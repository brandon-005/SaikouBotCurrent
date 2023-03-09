import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import triviaUsers from '../../models/correctTrivia';
import weeklyTrivia from '../../models/weeklyTrivia';

import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'leaderboard',
		commandAliases: ['tl', 'lbtrivia', 'lb', 'leaderboard'],
		commandUsage: '[amount]',
		commandDescription: 'Compete against your friends for that sweet number one spot in the most correct trivias.',
		slashOptions: [
			{
				name: 'period',
				description: 'Which leaderboard you would like to view.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: '👑 All-time',
						value: 'Trivia King 👑',
					},
					{
						name: '🌅 Weekly',
						value: 'Weekly Champion 🌅',
					},
				],
			},
			{
				name: 'amount',
				description: 'The amount of users you would like displayed.',
				type: ApplicationCommandOptionType.Number,
				required: false,
			},
		],
	},
	run: async ({ interaction, args }) => {
		const numbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'keycap_ten'];
		let number = '';
		let tenUsers = '';
		let triviaData;

		const leaderboard = new EmbedBuilder() // prettier-ignore
			.setTitle('👑 Trivia Leaderboard')
			.setColor(EMBED_COLOURS.blurple)
			.setFooter({ text: `${interaction.guild!.name}`, iconURL: interaction.guild?.iconURL()! })
			.setTimestamp();

		if (args[1] && !Number.isNaN(Number(args[1]))) {
			leaderboard.setDescription(`Displaying the **top ${args[1]}** users with the most trivia points.`);

			if (args[0] === 'Weekly Champion 🌅') {
				leaderboard.setTitle('🌅 Weekly Trivia Leaderboard');
				triviaData = await weeklyTrivia.find({}).sort({ answersCorrect: -1 }).limit(Number(args[1]));
			} else {
				triviaData = await triviaUsers.find({}).sort({ answersCorrect: -1 }).limit(Number(args[1]));
			}
		} else {
			leaderboard.setDescription('Displaying the **top 10** users with the most trivia points.');

			if (args[0] === 'Weekly Champion 🌅') {
				leaderboard.setTitle('🌅 Weekly Trivia Leaderboard');
				triviaData = await weeklyTrivia.find({}).sort({ answersCorrect: -1 }).limit(10);
			} else {
				triviaData = await triviaUsers.find({}).sort({ answersCorrect: -1 }).limit(10);
			}
		}

		if (triviaData.length === 0) {
			leaderboard.setDescription('Uh oh! Looks like no data was found. Try getting some correct trivias and try again!');
			return interaction.editReply({ embeds: [leaderboard] });
		}

		triviaData.forEach((user, count: number) => {
			switch (count + 1) {
				case 1:
					number = '🥇';
					break;
				case 2:
					number = '🥈';
					break;
				case 3:
					number = '🥉';
					break;
				default:
					number = numbers[count] ? `:${numbers[count]}:` : `**${count + 1}**`;
					break;
			}
			tenUsers += `${number} ${interaction.guild?.members.cache.get(user.userID)?.displayName || 'Member Left'} | **${user.answersCorrect.toLocaleString()} Points**\n`;
		});

		try {
			leaderboard.addFields([{ name: 'Users', value: tenUsers }]);
		} catch (err) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('❌ Too many users!')
						.setDescription('There is too many users to display this embed, try providing less.')
						.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		interaction.editReply({ embeds: [leaderboard] });
	},
};

export = command;
