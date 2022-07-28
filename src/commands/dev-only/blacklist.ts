import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import blacklisted from '../../models/blacklistedUsers';

import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'blacklist',
		commandAliases: ['botban'],
		commandDescription: 'DEVELOPER ONLY - Bans user from bot access.',
		limitedChannel: 'None',
		slashCommand: true,
		developerOnly: true,
		slashOptions: [
			{
				name: 'user',
				description: 'The user to blacklist.',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
		],
	},
	run: async ({ message, args, interaction }) => {
		if (!message) {
			console.log(args[0]);
			const blacklistedUser = await blacklisted.findOne({ userID: args[0] });

			if (blacklistedUser) {
				return interaction.followUp({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setColor(EMBED_COLOURS.red)
							.setDescription('❌ User already blacklisted.'),
					],
				});
			}

			return blacklisted.create({ userID: args[0] }).then(() => {
				interaction.followUp({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setColor(EMBED_COLOURS.green)
							.setDescription('✅ Successfully blacklisted.'),
					],
				});
			});
		}

		return message.channel.send('❌ **Please Use Slash Commands**\n\nThis command relies on slash commands to work, please type /blacklist to get started.');
	},
};

export = command;
