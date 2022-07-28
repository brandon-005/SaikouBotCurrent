import { Command, ApplicationCommandOptionType, GuildMember, EmbedBuilder, User } from 'discord.js';

import { EMBED_COLOURS } from '../../utils/constants';
import { getRandomInt, getMember } from '../../utils/functions';

const command: Command = {
	config: {
		commandName: 'skillrate',
		commandAliases: ['prorate', 'skill', 'pro', 'rate', 'rating'],
		commandDescription: 'See how skilled you truly are with a state of the art command, 100% accurate no questions asked.',
		commandUsage: '[user]',
		slashCommand: true,
		slashOptions: [
			{
				name: 'user',
				description: 'The user who you would like to check',
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ message, args, interaction }) => {
		/* If command is slash command */
		if (!message) {
			const interactionUser: User = interaction.options.getUser('user') || interaction.user;

			if (getRandomInt(0, 100) < 98) {
				return interaction.followUp({
					embeds: [
						new EmbedBuilder() //
							.setAuthor({ name: 'Skill Rating ✨', iconURL: interactionUser.displayAvatarURL() })
							.setDescription(`**${interactionUser.username}** is ${getRandomInt(0, 100)}% skilled! 🏆`)
							.setColor('Random'),
					],
				});
			}
			return interaction.followUp({
				embeds: [
					new EmbedBuilder() //
						.setAuthor({ name: 'Skill Rating 🔥', iconURL: interactionUser.displayAvatarURL() })
						.setDescription(`**${interactionUser.username}** is 𝐁𝐄𝐘𝐎𝐍𝐃 𝐆𝐎𝐃𝐋𝐈𝐊𝐄!! 🏆`)
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		/* If command is text based */
		const member: GuildMember = getMember(message, args.join(' '));

		if (getRandomInt(0, 100) < 98) {
			return message.channel.send({
				embeds: [
					new EmbedBuilder() //
						.setAuthor({ name: 'Skill Rating ✨', iconURL: member.user.displayAvatarURL() })
						.setDescription(`**${member.displayName}** is ${getRandomInt(0, 100)}% skilled! 🏆`)
						.setColor('Random'),
				],
			});
		}
		return message.channel.send({
			embeds: [
				new EmbedBuilder() //
					.setAuthor({ name: 'Skill Rating 🔥', iconURL: member.user.displayAvatarURL() })
					.setDescription(`**${member.displayName}** is 𝐁𝐄𝐘𝐎𝐍𝐃 𝐆𝐎𝐃𝐋𝐈𝐊𝐄!! 🏆`)
					.setColor(EMBED_COLOURS.red),
			],
		});
	},
};

export = command;
