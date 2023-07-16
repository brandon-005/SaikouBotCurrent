import { ApplicationCommandOptionType, Command, EmbedBuilder } from 'discord.js';

import triviaData from '../../models/trivias';
import weeklyTrivia from '../../models/weeklyTrivia';
import triviaAnswerData from '../../models/correctTrivia';
import { EMBED_COLOURS, LETTER_EMOJIS, PROMPT_TIMEOUT } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'trivia',
		commandAliases: ['quiz', 'gamequestion', 't'],
		commandDescription: "Answer questions based on Saikou's games and platforms, how good is your knowledge?",
		COOLDOWN_TIME: 30,
		slashOptions: [
			{
				name: 'difficulty',
				description: 'Which difficulty you would like to play.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: '😎 Easy',
						value: 'Easy',
					},
					{
						name: '🤔 Medium',
						value: 'Medium',
					},
					{
						name: '😨 Hard',
						value: 'Hard',
					},
					{
						name: '😱 Very Hard',
						value: 'Very Hard',
					},
				],
			},
		],
	},
	run: async ({ interaction, args }) => {
		const fetchedQuestion = await triviaData.aggregate([{ $match: { difficulty: `${args[0]}` } }, { $sample: { size: 1 } }]);
		const triviaUser = await triviaAnswerData.findOne({ userID: interaction.user.id });
		const weeklyTriviaUser = await weeklyTrivia.findOne({ userID: interaction.user.id });
		const randomOrderedOptions = fetchedQuestion[0].options.sort(() => Math.random() - 0.5);
		const optionsObj: any = {};
		const allowedEmojis: string[] = [];

		const triviaSent = await interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('Trivia Question')
					.setDescription(`Question\n**${fetchedQuestion[0].question}\n\n${randomOrderedOptions.map((option: string, number: number) => `${String.fromCharCode(97 + number).toUpperCase()}. ${option}\n`).join('')}**\nSubmit your answer by adding a reaction.`)
					.setColor(EMBED_COLOURS.blurple)
					.setFooter({ text: `Requested by: ${interaction.guild?.members.cache.get(interaction.user.id)?.displayName || interaction.user.username} • Difficulty: ${args[0]}`, iconURL: interaction.user.displayAvatarURL() }),
			],
		});

		randomOrderedOptions.forEach(async (option: string, count: number) => {
			Object.assign(optionsObj, { [option]: LETTER_EMOJIS[count] });
			allowedEmojis.push(LETTER_EMOJIS[count]);
			await triviaSent.react(LETTER_EMOJIS[count]!);
		});

		try {
			const collectingReaction = await triviaSent.awaitReactions({ filter: (reaction: any, user: any) => allowedEmojis.includes(reaction.emoji.name) && user.id === interaction.user.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedReaction = collectingReaction.first()?.emoji.name;

			const resultEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle('Trivia Results')
				.addFields([{ name: 'Your Answer', value: `${inputtedReaction} ${Object.keys(optionsObj)!.find((key: any) => optionsObj[key] === inputtedReaction)!}`, inline: true }])
				.setColor(EMBED_COLOURS.blurple)
				.setThumbnail(interaction.user.displayAvatarURL());

			if (`${Object.keys(optionsObj)!.find((key: any) => optionsObj[key] === inputtedReaction)!}` === `${fetchedQuestion[0].answer}`) {
				if (fetchedQuestion[0].points === 1) {
					resultEmbed.setDescription(`You answered the trivia correctly and gained **${fetchedQuestion[0].points} point**!`);
				} else {
					resultEmbed.setDescription(`You answered the trivia correctly and gained **${fetchedQuestion[0].points} points**!`);
				}

				if (!triviaUser) {
					await triviaAnswerData.create({ userID: interaction.user.id, answersCorrect: fetchedQuestion[0].points });
					return await interaction.editReply({ embeds: [resultEmbed] }).then((msg) => {
						msg.reactions.removeAll();
					});
				}

				if (!weeklyTriviaUser) {
					await weeklyTrivia.create({ userID: interaction.user.id, answersCorrect: fetchedQuestion[0].points });
					return await interaction.editReply({ embeds: [resultEmbed] }).then((msg) => {
						msg.reactions.removeAll();
					});
				}

				triviaUser.answersCorrect += fetchedQuestion[0].points;
				weeklyTriviaUser.answersCorrect += fetchedQuestion[0].points;
				await triviaUser.save();
				await weeklyTriviaUser.save();

				return await interaction.editReply({ embeds: [resultEmbed] }).then((msg) => {
					msg.reactions.removeAll();
				});
			}

			if (triviaUser && triviaUser.answersCorrect - 1 > 0 && weeklyTriviaUser && weeklyTriviaUser.answersCorrect - 1 > 0) {
				let lostPoints;

				switch (args[0]) {
					case 'Easy':
						lostPoints = 1;
						break;

					case 'Medium':
						lostPoints = 2;
						break;

					case 'Hard':
						lostPoints = 3;
						break;

					case 'Very Hard':
						lostPoints = 3;
						break;
				}
				resultEmbed.setDescription(`You answered the trivia incorrectly and lost **${lostPoints} points**!`);
				resultEmbed.addFields([{ name: 'Correct Answer', value: `${Object.entries(optionsObj).find((key: any) => key[0] === fetchedQuestion[0].answer)![1]} ${fetchedQuestion[0].answer}`, inline: true }]);

				triviaUser.answersCorrect -= lostPoints;
				weeklyTriviaUser.answersCorrect -= lostPoints;
				await triviaUser.save();
				await weeklyTriviaUser.save();

				return await interaction.editReply({ embeds: [resultEmbed] }).then((msg) => {
					msg.reactions.removeAll();
				});
			}

			resultEmbed.setDescription(`You answered the trivia incorrectly, good try!`);
			resultEmbed.addFields([{ name: 'Correct Answer', value: `${Object.entries(optionsObj).find((key: any) => key[0] === fetchedQuestion[0].answer)![1]} ${fetchedQuestion[0].answer}`, inline: true }]);

			return await interaction.editReply({ embeds: [resultEmbed] }).then((msg) => {
				msg.reactions.removeAll();
			});
		} catch (err) {
			return await interaction
				.editReply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('⏱ Out of time!')
							.setDescription('You ran out of time to input an answer for the trivia question.')
							.setColor(EMBED_COLOURS.red)
							.setThumbnail(interaction.user.displayAvatarURL()),
					],
				})
				.then((msg) => {
					msg.reactions.removeAll();
				});
		}
	},
};

export = command;
