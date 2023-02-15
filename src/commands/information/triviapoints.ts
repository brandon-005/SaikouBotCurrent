import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import { EMBED_COLOURS } from '../../utils/constants';
import { noUser } from '../../utils/embeds';
import triviaUserData from '../../models/correctTrivia';
import weeklyTrivia from '../../models/weeklyTrivia';

const command: Command = {
	config: {
		commandName: 'triviapoints',
		commandAliases: ['triviarank', 'triviastats', 'ts', 'stats'],
		commandDescription: 'Get some more in depth stats about your correct trivia answers!',
		commandUsage: '[user]',
		slashOptions: [
			{
				name: 'user',
				description: 'The user who you would like to view stats of.',
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ interaction }) => {
		/* If user can't be found in cache */
		if (!interaction.inCachedGuild()) return noUser(interaction, false);

		const member = interaction.options.getMember('user') || interaction.member;

		const overallUserStats = await triviaUserData.findOne({ userID: member.id });
		const weeklyUserStats = await weeklyTrivia.findOne({ userID: member.id });
		const alltimeTriviaUsers = await triviaUserData.find({}).sort({ answersCorrect: -1 });
		const weeklyTriviaUsers = await weeklyTrivia.find({}).sort({ answersCorrect: -1 });
		let alltimeRank = 0;
		let weeklyRank = 0;

		alltimeTriviaUsers.forEach((position, count) => {
			if (position.userID === member.id) alltimeRank = count + 1;
		});

		weeklyTriviaUsers.forEach((position, count) => {
			if (position.userID === member.id) weeklyRank = count + 1;
		});

		/* If no user */
		if (!overallUserStats)
			return interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('🗃️ No trivia data!')
						.setColor(EMBED_COLOURS.red)
						.setDescription(`**${member.displayName ? member.displayName : member.user.username}** hasn't got any data yet.`),
				],
			});

		const statsEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('🎖️ Trivia Statistics')
			.setDescription(`Down below you can find **${member.displayName ? member.displayName : member.user.username}'s** trivia statistics.`)
			.addFields([
				// prettier-ignore
				{ name: '🥇 Overall Points', value: `**${overallUserStats.answersCorrect}**`, inline: true },
				{ name: '🌍 Overall Position', value: `**#${alltimeRank}**`, inline: true },
			])
			.setColor(EMBED_COLOURS.blurple);

		if (weeklyUserStats) {
			statsEmbed.addFields([
				//prettier-ignore
				{ name: '\u200b', value: '\u200b', inline: true },
				{ name: '🥈 Weekly Points', value: `**${weeklyUserStats.answersCorrect}**`, inline: true },
				{ name: '🌅 Weekly Position', value: `**#${weeklyRank}**`, inline: true },
				{ name: '\u200b', value: '\u200b', inline: true },
			]);
		}

		/* If found user */
		return interaction.editReply({
			embeds: [statsEmbed],
		});
	},
};

export = command;
