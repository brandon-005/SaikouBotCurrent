import { Command, ApplicationCommandOptionType, EmbedBuilder, User } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'verify',
		commandAliases: ['verifyacc'],
		commandDescription: 'Link your Roblox account to your Discord account and gain full access to Saikou.',
		commandUsage: '[user]',
		slashOptions: [
			{
				name: 'user',
				description: "The user who's avatar you would like to view.",
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ interaction }) => {
		const member: User = interaction.options.getUser('user')! || interaction.user;

		if (!member.avatar) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription('ℹ️ This user has no avatar.')
						.setColor(EMBED_COLOURS.blurple),
				],
			});
		}

		return interaction.editReply({
			embeds: [
				new EmbedBuilder() //
					.setAuthor({ name: member.tag, iconURL: member.displayAvatarURL({ size: 64 }) })
					.setDescription(member.avatarURL() ? `[JPG](${member.avatarURL({ extension: 'jpg' })}) | [PNG](${member.avatarURL({ extension: 'png' })}) | [WEBP](${member.avatarURL({ extension: 'webp' })}) | [JPEG](${member.avatarURL({ extension: 'jpeg' })})` : '')
					.setColor(EMBED_COLOURS.blurple)
					.setImage(member.displayAvatarURL({ extension: 'webp', size: 512 })),
			],
		});
	},
};

export = command;
