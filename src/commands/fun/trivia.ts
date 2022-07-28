import { Command, EmbedBuilder } from 'discord.js';

import triviaData from '../../models/trivias';
import triviaAnswerData from '../../models/correctTrivia';
import { EMBED_COLOURS, LETTER_EMOJIS, PROMPT_TIMEOUT } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'trivia',
		commandAliases: ['quiz', 'gamequestion', 't'],
		commandDescription: "Answer questions based on Saikou's games, how good is your knowledge?",
		COOLDOWN_TIME: 60,
		serverOnly: false,
		slashCommand: true,
	},
	run: async ({ message, interaction }) => {
		const fetchedQuestion = await triviaData.aggregate([{ $sample: { size: 1 } }]);
		const triviaUser = await triviaAnswerData.findOne({ userID: message ? message.author.id : interaction.user.id });
		const randomOrderedOptions = fetchedQuestion[0].options.sort(() => Math.random() - 0.5);
		const optionsObj: any = {};
		let triviaSent: any;

		const triviaEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('Trivia Question')
			.setDescription(`Question\n**${fetchedQuestion[0].question}\n\n${randomOrderedOptions.map((option: string, number: number) => `${String.fromCharCode(97 + number).toUpperCase()}. ${option}\n`).join('')}**\nSubmit your answer by adding a reaction.`)
			.setColor(EMBED_COLOURS.blurple)
			.setFooter({ text: `Requested by: ${message ? message.guild?.members.cache.get(message.author.id)?.displayName || message.author.username : interaction.guild?.members.cache.get(interaction.user.id)?.displayName || interaction.user.username}`, iconURL: message ? message.author.displayAvatarURL() : interaction.user.displayAvatarURL() })
			.setTimestamp();

		if (!message) {
			triviaSent = await interaction.followUp({ embeds: [triviaEmbed] });
		} else {
			triviaSent = await message.reply({ embeds: [triviaEmbed], failIfNotExists: false, allowedMentions: { repliedUser: false } });
		}

		randomOrderedOptions.forEach(async (option: string, count: number) => {
			Object.assign(optionsObj, { [option]: LETTER_EMOJIS[count] });
			await triviaSent.react(LETTER_EMOJIS[count]!);
		});

		try {
			const collectingReaction = await triviaSent.awaitReactions({ filter: (reaction: any, user: any) => LETTER_EMOJIS.includes(reaction.emoji.name) && user.id === (message ? message.author.id : interaction.user.id), time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedReaction = collectingReaction.first()?.emoji.name;

			const resultEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle('Trivia Results')
				.addFields([{ name: 'Your Answer', value: `${inputtedReaction}`, inline: true }])
				.setColor(EMBED_COLOURS.blurple)
				.setThumbnail(message ? message.author.displayAvatarURL() : interaction.user.displayAvatarURL());

			if (`${Object.keys(optionsObj)!.find((key: any) => optionsObj[key] === inputtedReaction)!}` === `${fetchedQuestion[0].answer}`) {
				if (!triviaUser) {
					await triviaAnswerData.create({ userID: message ? message.author.id : interaction.user.id, answersCorrect: fetchedQuestion[0].points });

					if (fetchedQuestion[0].points === 1) {
						resultEmbed.setDescription(`You answered the trivia correctly and gained **${fetchedQuestion[0].points} point**!`);
					} else {
						resultEmbed.setDescription(`You answered the trivia correctly and gained **${fetchedQuestion[0].points} points**!`);
					}

					if (!message) {
						return interaction.followUp({ embeds: [resultEmbed] });
					}
					return await message.reply({ embeds: [resultEmbed], allowedMentions: { repliedUser: false }, failIfNotExists: false });
				}

				if (fetchedQuestion[0].points === 1) {
					resultEmbed.setDescription(`You answered the trivia correctly and gained **${fetchedQuestion[0].points} point**!`);
				} else {
					resultEmbed.setDescription(`You answered the trivia correctly and gained **${fetchedQuestion[0].points} points**!`);
				}

				triviaUser.answersCorrect += fetchedQuestion[0].points;
				await triviaUser.save();

				if (!message) {
					return interaction.followUp({ embeds: [resultEmbed] });
				}
				return await message.reply({ embeds: [resultEmbed], allowedMentions: { repliedUser: false }, failIfNotExists: false });
			}

			if (triviaUser && triviaUser.answersCorrect - 1 > 0) {
				resultEmbed.setDescription(`You answered the trivia incorrectly and lost **1 point**!`);
				resultEmbed.addFields([{ name: 'Correct Answer', value: `${Object.entries(optionsObj).find((key: any) => key[0] === fetchedQuestion[0].answer)![1]}`, inline: true }]);

				triviaUser.answersCorrect -= 1;
				await triviaUser.save();

				if (!message) {
					return interaction.followUp({ embeds: [resultEmbed] });
				}
				return await message.reply({ embeds: [resultEmbed], allowedMentions: { repliedUser: false }, failIfNotExists: false });
			}

			resultEmbed.setDescription(`You answered the trivia incorrectly, good try!`);
			resultEmbed.addFields([{ name: 'Correct Answer', value: `${Object.entries(optionsObj).find((key: any) => key[0] === fetchedQuestion[0].answer)![1]}`, inline: true }]);

			if (!message) {
				return interaction.followUp({ embeds: [resultEmbed] });
			}
			return await message.reply({ embeds: [resultEmbed], allowedMentions: { repliedUser: false }, failIfNotExists: false });
		} catch (err) {
			const noTimeEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle('⏱ Out of time!')
				.setDescription('You ran out of time to input an answer for the trivia question.')
				.setColor(EMBED_COLOURS.red)
				.setThumbnail(message ? message.author.displayAvatarURL() : interaction.user.displayAvatarURL());

			if (!message) {
				return interaction.followUp({ embeds: [noTimeEmbed] });
			}

			return message.channel.send({ embeds: [noTimeEmbed] });
		}
	},
};

export = command;
