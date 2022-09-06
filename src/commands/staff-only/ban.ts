import { Command, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, Interaction, TextChannel, PermissionFlagsBits, ButtonStyle } from 'discord.js';

import { noUser, equalPerms, moderationDmEmbed } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'ban',
		commandAliases: ['permremove'],
		commandDescription: 'Removes a user from the Discord server.',
		userPermissions: 'BanMembers',
		commandUsage: '<user> <reason>',
		limitedChannel: 'None',
		COOLDOWN_TIME: 30,
		slashOptions: [
			{
				name: 'user',
				description: 'The user who you would like to ban.',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'reason',
				description: 'The reason for the ban.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ bot, interaction, args }) => {
		/* If user can't be found in cache */
		if (!interaction.inCachedGuild()) return noUser(interaction, false);

		const member = interaction.options.getMember('user');
		const reason = args[1];

		if (!member) return noUser(interaction, false);
		if (member.permissions && member.permissions.has(PermissionFlagsBits.BanMembers)) return equalPerms(interaction, 'Ban Members');

		/* DELETE MESSAGE HISTORY PROMPT */
		const buttonMsg = await interaction.followUp({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setDescription("**🗑️ Do you want to delete the user's message history?**")
					.setColor(EMBED_COLOURS.red),
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					// prettier-ignore
					new ButtonBuilder().setLabel('Yes').setStyle(ButtonStyle.Success).setCustomId('Yes'),
					new ButtonBuilder().setLabel('No').setStyle(ButtonStyle.Danger).setCustomId('No'),
				]),
			],
			fetchReply: true,
		});

		const collector = buttonMsg.createMessageComponentCollector({ filter: (userInteraction: Interaction) => userInteraction.user.id === interaction.user.id, max: 1, time: 30000 });

		const successEmbed = new EmbedBuilder() // prettier-ignore
			.setDescription(`✅ **${member.displayName ? member.displayName : member.user.username} has been banned.**`)
			.setColor(EMBED_COLOURS.green);

		collector.on('end', async (buttonInteraction: any) => {
			if (!buttonInteraction.first()) {
				buttonMsg.edit({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setDescription("**⌛ Option wasn't inputted in time.**")
							.setColor(EMBED_COLOURS.red),
					],
					components: [],
				});

				return;
			}

			switch (buttonInteraction.first()!.customId) {
				case 'Yes':
					await moderationDmEmbed(member, 'Ban', `Hello **${member.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules for the final time. Because of this, your account has been permanently banned from the Saikou Discord.\n\nIf you believe this is a mistake, submit an appeal by visiting:\nhttps://forms.gle/L98zfzbC8fuAz5We6\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, reason);

					try {
						member.ban({ deleteMessageDays: 7, reason });
					} catch (err) {
						interaction.guild?.members.ban(member);
					}
					break;

				case 'No':
					await moderationDmEmbed(member, 'Ban', `Hello **${member.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules for the final time. Because of this, your account has been permanently banned from the Saikou Discord.\n\nIf you believe this is a mistake, submit an appeal by visiting\nhttps://forms.gle/L98zfzbC8fuAz5We6\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, reason);

					try {
						member.ban({ reason });
					} catch (err) {
						interaction.guild?.members.ban(member);
					}
					break;

				default:
					break;
			}

			buttonMsg.edit({ embeds: [successEmbed], components: [] });

			(bot.channels.cache.get(String(process.env.MODERATION_CHANNEL)) as TextChannel).send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setAuthor({ name: `Saikou Discord | Ban`, iconURL: member.user ? member.user.displayAvatarURL() : bot.user.displayAvatarURL() })
						.addFields([
							// prettier-ignore
							{ name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
							{ name: 'User', value: `<@${member.id}>`, inline: true },
							{ name: 'Reason', value: reason },
						])
						.setThumbnail(member.user ? member.user.displayAvatarURL() : bot.user.displayAvatarURL())
						.setColor(EMBED_COLOURS.green)
						.setFooter({ text: 'Ban' })
						.setTimestamp(),
				],
			});
		});
	},
};

export = command;
