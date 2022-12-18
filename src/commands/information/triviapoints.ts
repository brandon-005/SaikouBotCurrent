import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import { EMBED_COLOURS } from '../../utils/constants';
import { noUser } from '../../utils/embeds';
import triviaUserData from '../../models/correctTrivia';

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

		const triviaUser = await triviaUserData.findOne({ userID: member.id });
		let rank = 0;

		const allTriviaUsers = await triviaUserData.find({}).sort({ answersCorrect: -1 });

		allTriviaUsers.forEach((position, count) => {
			if (position.userID === member.id) rank = count + 1;
		});

		/* If no user */
		if (!triviaUser)
			return interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('🗃️ No trivia data!')
						.setColor(EMBED_COLOURS.red)
						.setDescription(`**${member.displayName ? member.displayName : member.user.username}** hasn't got any data yet.`),
				],
			});

		/* If found user */
		return interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('🎖️ Trivia Statistics')
					.setDescription(`Down below you can find **${member.displayName ? member.displayName : member.user.username}'s** trivia statistics.`)
					.addFields([
						// prettier-ignore
						{ name: 'Trivia Points', value: `${triviaUser.answersCorrect}`, inline: true },
						{ name: 'Leaderboard Position', value: `#${rank}`, inline: true },
					])
					.setColor(EMBED_COLOURS.blurple),
			],
		});
	},
};

export = command;
