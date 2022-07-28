import { Command, EmbedBuilder } from 'discord.js';

import { getMember } from '../../utils/functions';
import { EMBED_COLOURS } from '../../utils/constants';
import triviaUserData from '../../models/correctTrivia';

const command: Command = {
	config: {
		commandName: 'triviapoints',
		commandAliases: ['triviarank', 'triviastats', 'ts', 'stats'],
		commandDescription: 'Get some more in depth stats about your correct trivia answers!',
		commandUsage: '[user]',
		slashCommand: true,
	},
	run: async ({ message, args, interaction }) => {
		let member: any;

		if (!message) {
			member = interaction.options.getUser('user') || interaction.user;
		} else {
			member = getMember(message, args.join(' '));
		}

		const triviaUser = await triviaUserData.findOne({ userID: member.id ? member.id : member.user.id });
		let rank = 0;

		const allTriviaUsers = await triviaUserData.find({}).sort({ answersCorrect: -1 });

		allTriviaUsers.forEach((position, count) => {
			if (position.userID === member.id) rank = count + 1;
		});

		/* If no user */
		const noUser = new EmbedBuilder() // prettier-ignore
			.setTitle('🗃️ No trivia data!')
			.setColor(EMBED_COLOURS.red)
			.setDescription(`**${member.displayName ? member.displayName : member.username}** hasn't got any data yet.`);

		if (!triviaUser) return message ? message.channel.send({ embeds: [noUser] }) : interaction.followUp({ embeds: [noUser] });

		/* If found user */
		const pointsEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('🎖️ Trivia Statistics')
			.setDescription(`Down below you can find **${member.displayName ? member.displayName : member.username}'s** trivia statistics.`)
			.addFields([
				// prettier-ignore
				{ name: 'Trivia Points', value: `${triviaUser.answersCorrect}`, inline: true },
				{ name: 'Leaderboard Position', value: `#${rank}`, inline: true },
			])
			.setColor(EMBED_COLOURS.blurple);

		return message ? message.channel.send({ embeds: [pointsEmbed] }) : interaction.followUp({ embeds: [pointsEmbed] });
	},
};

export = command;
