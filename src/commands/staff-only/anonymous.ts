import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';

import suggestData from '../../models/suggestions';
import reportData from '../../models/reports';

const command: Command = {
	config: {
		commandName: 'anonymous',
		commandAliases: ['reveal'],
		commandDescription: 'Reveals the author behind an anonymous suggestion or report.',
		userPermissions: 'ManageMessages',
		commandUsage: '<ID>',
		limitedChannel: '🤖staff-cmds',
		slashCommand: true,
		slashOptions: [
			{
				name: 'id',
				description: 'The ID for the report or suggestion.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ bot, message, args, interaction }) => {
		const inputtedID = args[0];
		const data = await suggestData.findOne({ messageID: inputtedID });

		if (!data) {
			const reportUser = await reportData.findOne({ messageID: inputtedID });

			if (!reportUser) {
				if (!message) return interaction.followUp({ content: 'Inputted ID does not exist! ' });
				return message.channel.send("Inputted ID doesn't exist!");
			}

			const fetchedUser = await bot.users.fetch(`${BigInt(reportUser!.userID)}`);
			const fetchedEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle('🔎 User Found!')
				.addFields([
					// prettier-ignore
					{ name: 'Username', value: `${fetchedUser.username}#${fetchedUser.discriminator}`, inline: true },
					{ name: 'User ID', value: fetchedUser.id, inline: true },
				])
				.setColor(EMBED_COLOURS.blurple);

			if (!message) return interaction.followUp({ embeds: [fetchedEmbed] });
			return message.channel.send({ embeds: [fetchedEmbed] });
		}

		const fetchedUser = await bot.users.fetch(`${BigInt(data!.userID)}`);
		const fetchedEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('🔎 User Found!')
			.addFields([
				// prettier-ignore
				{ name: 'Username', value: `${fetchedUser.username}#${fetchedUser.discriminator}`, inline: true },
				{ name: 'User ID', value: fetchedUser.id, inline: true },
				{ name: 'Suggestion Content', value: data!.suggestionMessage },
			])
			.setColor(EMBED_COLOURS.blurple);

		if (!message) return interaction.followUp({ embeds: [fetchedEmbed] });
		return message.channel.send({ embeds: [fetchedEmbed] });
	},
};

export = command;
