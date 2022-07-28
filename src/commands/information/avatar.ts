import { Command, ApplicationCommandOptionType, EmbedBuilder, GuildMember, User } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';
import { getMember } from '../../utils/functions';

const command: Command = {
	config: {
		commandName: 'avatar',
		commandAliases: ['profilepic', 'av', 'pfp'],
		commandDescription: 'Show off your avatar or admire someone elses with this command, you can even get a direct link to their avatar image!',
		commandUsage: '[user]',
		slashCommand: true,
		slashOptions: [
			{
				name: 'user',
				description: "The user who's avatar you would like to view.",
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ message, args, interaction }) => {
		/* If command is a slash command */
		if (!message) {
			const member: User = interaction.options.getUser('user')! || interaction.user;

			return interaction.followUp({
				embeds: [
					new EmbedBuilder() //
						.setAuthor({ name: member.tag, iconURL: member.displayAvatarURL({ size: 64 }) })
						.setDescription(member.avatarURL() ? `[JPG](${member.avatarURL({ extension: 'jpg' })}) | [PNG](${member.avatarURL({ extension: 'png' })}) | [WEBP](${member.avatarURL({ extension: 'webp' })}) | [JPEG](${member.avatarURL({ extension: 'jpeg' })})` : '')
						.setColor(EMBED_COLOURS.blurple)
						.setImage(member.displayAvatarURL({ extension: 'webp', size: 512 })),
				],
			});
		}

		/* If command is text based */
		const member: GuildMember = getMember(message, args.join(' '));

		return message.channel.send({
			embeds: [
				new EmbedBuilder() //
					.setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ size: 64 }) })
					.setDescription(member.user.avatarURL() ? `[JPG](${member.user.avatarURL({ extension: 'jpg' })}) | [PNG](${member.user.avatarURL({ extension: 'png' })}) | [WEBP](${member.user.avatarURL({ extension: 'webp' })}) | [JPEG](${member.user.avatarURL({ extension: 'jpeg' })})` : '')
					.setColor(EMBED_COLOURS.blurple)
					.setImage(member.user.displayAvatarURL({ extension: 'webp', size: 512 })),
			],
		});
	},
};

export = command;
