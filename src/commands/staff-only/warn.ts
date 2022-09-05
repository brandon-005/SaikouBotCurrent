import { Command, ApplicationCommandOptionType, CommandInteraction, Interaction, ActionRowBuilder, ButtonBuilder, EmbedBuilder, PermissionFlagsBits, ButtonStyle } from 'discord.js';
import { Types } from 'mongoose';

import { equalPerms, moderationDmEmbed, moderationEmbed, noUser } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

import warnData from '../../models/warnings';

const command: Command = {
	config: {
		commandName: 'warn',
		commandAliases: ['givewarn'],
		commandDescription: 'Issues a warning to a user.',
		userPermissions: 'ManageMessages',
		commandUsage: '<user> <reason>',
		COOLDOWN_TIME: 1,
		limitedChannel: 'None',
		slashOptions: [
			{
				name: 'user',
				description: 'The user who you would like to warn.',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'reason',
				description: 'The reason for the warn.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ bot, message, args, interaction }) => {
		const member = interaction.options.getMember('user');
		const reason = args[1];

		if (!member) return noUser(interaction, false);

		const userWarns = await warnData.findOne({ userID: member.id });

		const warnEmbed = new EmbedBuilder() // prettier-ignore
			.setDescription(`✅ **${member.displayName} has been warned**`)
			.addFields([{ name: 'Warnings:', value: `${userWarns?.warnings.length ? userWarns?.warnings.length + 1 : 1}`, inline: true }])
			.setColor(EMBED_COLOURS.green);

		const warningObj = {
			_id: new Types.ObjectId(),
			date: new Date(),
			moderator: message ? message.author.id : interaction.user.id,
			reason,
		};

		if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return equalPerms(interaction, 'Manage Messages');

		if (!userWarns) {
			await warnData.create({
				userID: member.id,
				warnings: [warningObj],
			});

			await moderationDmEmbed(member, 'Warning', `Hello **${member.user.username}**,\n\nYour account has recently been flagged by a staff member for breaching Saikou's Community Rules.\n\nTo learn more about our server rules, visit <#397797150840324115>\n\nWe take these actions seriously. If you continue to break the rules, we may need to take additional action against your account, which could result in a permanent ban from the Saikou Discord.\n\nPlease check the attached moderator note below for more details.`, reason);
			warnEmbed.addFields([{ name: 'Auto Punishment:', value: 'None', inline: true }]);

			return interaction.followUp({ embeds: [warnEmbed] });
		}

		userWarns.warnings.push(warningObj);
		await userWarns.save();

		switch (userWarns.warnings.length) {
			case 3:
				await moderationDmEmbed(member, `Mute`, `Hello **${member.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a **2h mute** on our Discord Server.\n\nIf you continue to break the rules, your account will receive further penalties. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, reason);
				await moderationEmbed(message, bot, '2h Mute', member, reason, false, interaction as CommandInteraction);

				await member.timeout(7200000, reason);

				warnEmbed.addFields([{ name: 'Auto Punishment:', value: '2h Mute', inline: true }]);
				return interaction.followUp({ embeds: [warnEmbed] });

			case 4:
				await moderationDmEmbed(member, `Mute`, `Hello **${member.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a **1 day mute** on our Discord Server.\n\nIf you continue to break the rules, your account will receive further penalties. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, reason);
				await moderationEmbed(message, bot, '1d Mute', member, reason, false, interaction as CommandInteraction);

				await member.timeout(86400000, reason);

				warnEmbed.addFields([{ name: 'Auto Punishment:', value: '1d Mute', inline: true }]);
				return interaction.followUp({ embeds: [warnEmbed] });

			case 5:
				await moderationDmEmbed(member, 'Kick', `Hello **${member.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a kick from our Discord Server.\n\nIf you continue to break the rules, your account will be permanently banned from accessing the Discord Server. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, reason);
				await moderationEmbed(message, bot, 'Kick', member, reason, false, interaction as CommandInteraction);
				member.kick(reason);

				warnEmbed.addFields([{ name: 'Auto Punishment:', value: 'Server Kick', inline: true }]);
				return interaction.followUp({ embeds: [warnEmbed] });

			case 6:
				const buttonMsg: any = await interaction.followUp({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setDescription("**🗑️ Do you want to delete the user's message history?**")
							.setColor(EMBED_COLOURS.red),
					],
					components: [
						new ActionRowBuilder().addComponents([
							// prettier-ignore
							new ButtonBuilder().setLabel('Yes').setStyle(ButtonStyle.Success).setCustomId('Yes'),
							new ButtonBuilder().setLabel('No').setStyle(ButtonStyle.Danger).setCustomId('No'),
						]),
					],
					fetchReply: true,
				});

				const collector = buttonMsg.createMessageComponentCollector({ filter: (userInteraction: Interaction) => userInteraction.user.id === interaction.user.id, max: 1, time: 60000 });

				collector.on('end', async (clickedButton: any) => {
					if (!clickedButton.first()) {
						return buttonMsg.edit({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setDescription("**⌛ Option wasn't inputted in time.**")
									.setColor(EMBED_COLOURS.red),
							],
							components: [],
						});
					}

					switch (clickedButton.first()!.customId) {
						case 'Yes':
							try {
								member.ban({ deleteMessageDays: 7, reason });
							} catch (err) {
								if (!message) {
									interaction.guild?.members.ban(member);
								} else {
									message.guild?.members.ban(member);
								}
							}

							await moderationDmEmbed(member, 'Ban', `Hello **${member.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules for the final time. Because of this, your account has been permanently banned from the Saikou Discord.\n\nIf you believe this is a mistake, submit an appeal by visiting\nhttps://forms.gle/L98zfzbC8fuAz5We6\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, reason);
							await moderationEmbed(message, bot, 'Ban', member, reason, false, interaction as CommandInteraction);

							warnEmbed.addFields([{ name: 'Auto Punishment:', value: 'Server Ban', inline: true }]);
							await warnData.deleteOne({ userID: member.id });
							return buttonMsg.edit({ embeds: [warnEmbed], components: [] });

						case 'No':
							try {
								member.ban({ reason });
							} catch (err) {
								interaction.guild?.members.ban(member);
							}

							await moderationDmEmbed(member, 'Ban', `Hello **${member.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules for the final time. Because of this, your account has been permanently banned from the Saikou Discord.\n\nIf you believe this is a mistake, submit an appeal by visiting\nhttps://forms.gle/L98zfzbC8fuAz5We6\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, reason);
							await moderationEmbed(message, bot, 'Ban', member, reason, false, interaction as CommandInteraction);

							warnEmbed.addFields([{ name: 'Auto Punishment:', value: 'Server Ban', inline: true }]);
							await warnData.deleteOne({ userID: member.id });
							return buttonMsg.edit({ embeds: [warnEmbed], components: [] });

						default:
							break;
					}
				});
				break;

			default:
				await moderationDmEmbed(member, 'Warning', `Hello **${member.user.username}**,\n\nYour account has recently been flagged by a staff member for breaching Saikou's Community Rules.\n\nTo learn more about our server rules, visit <#397797150840324115>\n\nWe take these actions seriously. If you continue to break the rules, we may need to take additional action against your account, which could result in a permanent ban from the Saikou Discord.\n\nPlease check the attached moderator note below for more details.`, reason);
				warnEmbed.addFields([{ name: 'Auto Punishment:', value: 'None', inline: true }]);
				return interaction.followUp({ embeds: [warnEmbed] });
		}
	},
};

export = command;
