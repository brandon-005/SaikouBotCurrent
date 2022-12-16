import { Command, ApplicationCommandOptionType, EmbedBuilder, User } from 'discord.js';

import { EMBED_COLOURS } from '../../utils/constants';
import { getRandomInt } from '../../utils/functions';

const command: Command = {
	config: {
		commandName: 'skillrate',
		commandAliases: ['prorate', 'skill', 'pro', 'rate', 'rating'],
		commandDescription: 'See how skilled you truly are with a state of the art command, 100% accurate no questions asked.',
		commandUsage: '[user]',
		slashOptions: [
			{
				name: 'user',
				description: 'The user who you would like to check',
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ interaction }) => {
		/* If command is slash command */

		const interactionUser: User = interaction.options.getUser('user') || interaction.user;

		if (getRandomInt(0, 100) < 98) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder() //
						.setAuthor({ name: 'Skill Rating ✨', iconURL: interactionUser.displayAvatarURL() })
						.setDescription(`**${interactionUser.username}** is ${getRandomInt(0, 100)}% skilled! 🏆`)
						.setColor('Random'),
				],
			});
		}
		return interaction.editReply({
			embeds: [
				new EmbedBuilder() //
					.setAuthor({ name: 'Skill Rating 🔥', iconURL: interactionUser.displayAvatarURL() })
					.setDescription(`**${interactionUser.username}** is 𝐁𝐄𝐘𝐎𝐍𝐃 𝐆𝐎𝐃𝐋𝐈𝐊𝐄!! 🏆`)
					.setColor(EMBED_COLOURS.red),
			],
		});
	},
};

export = command;
