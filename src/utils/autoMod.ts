import { Message, EmbedBuilder, ChannelType, ActivityType, TextChannel } from 'discord.js';
import { google } from 'googleapis';
import { Types } from 'mongoose';

import { EMBED_COLOURS, WHITELISTED_WORDS } from './constants';
import { moderationDmEmbed, moderationEmbed } from './embeds';

import warnData from '../models/warnings';
import statusTimer from '../models/statusTimer';

/* Auto Moderation */
export async function autoPunish(ifStatement: any, message: Message, autoModEmbedReason: any, reason: any, bot: any, noDelete?: boolean) {
	if (ifStatement) {
		if (noDelete !== true && message.deletable) {
			message.delete().catch(() => {});
		}

		const autoModEmbed = new EmbedBuilder() // prettier-ignore
			.setAuthor({ name: message.member ? message.member.displayName : message.author.username, iconURL: message.author.displayAvatarURL() })
			.setDescription(`**${message.author.username} has triggered the auto moderation for ${autoModEmbedReason}**.`)
			.addFields([{ name: 'Triggered Content', value: `${message.cleanContent} [[Jump to message]](${message.url})` }])
			.setFooter({ text: `User ID: ${message.author.id}` })
			.setTimestamp()
			.setColor(EMBED_COLOURS.red);

		const warningObj = {
			_id: new Types.ObjectId(),
			date: new Date(),
			moderator: 'SaikouDev',
			reason: `${reason} [AUTOMATIC]`,
		};

		const userWarns = await warnData.findOne({ userID: message.author.id });

		if (!userWarns) {
			await warnData.create({
				userID: message.author.id,
				warnings: [warningObj],
			});

			await moderationDmEmbed(message.author, 'Warning', `Hello **${message.author.username}**,\n\nYour account has recently been flagged by a staff member for breaching Saikou's Community Rules.\n\nTo learn more about our server rules, visit <#397797150840324115>\n\nWe take these actions seriously. If you continue to break the rules, we may need to take additional action against your account, which could result in a permanent ban from the Saikou Discord.\n\nPlease check the attached moderator note below for more details.`, reason);
			message.channel.send({ content: `<@${message.author.id}>, You have been automatically warned for breaking Saikou's rules.\n\n**Infraction:** ${reason}` });

			return bot.channels.cache.find((channel: TextChannel) => channel.name === '🤖auto-mod').send({ embeds: [autoModEmbed] });
		}

		userWarns!.warnings.push(warningObj);
		await userWarns!.save();

		switch (userWarns!.warnings.length) {
			case 3:
				if (message.member!.isCommunicationDisabled() === true) {
					message.channel.send({ content: `<@${message.author.id}>, You have been automatically warned for breaking Saikou's rules.\n\n**Infraction:** ${reason}` });
				} else {
					await message.member?.timeout(10800000, 'Reached 3 warnings.');
					message.channel.send({ content: `<@${message.author.id}>, You have been automatically muted for 3 hours for breaking Saikou's rules (Reached 3 warnings).\n\n**Infraction:** ${reason}` });

					await moderationDmEmbed(message.author, `Mute`, `Hello **${message.author.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a **3h mute** on our Discord Server.\n\nIf you continue to break the rules, your account will receive further penalties. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, `${reason} [AUTOMATIC]`);
					await moderationEmbed(message, bot, '3h Mute', message.member, `User triggered SaikouBot's auto moderation for ${autoModEmbedReason}. (Reached 3 warnings)`, false);
					bot.channels.cache.find((channel: TextChannel) => channel.name === '📂moderation').send({ content: `**<t:${Math.floor(Date.now() / 1000)}:F> | ${message.author.username}**\nContent: ${message.cleanContent}` });
				}
				break;

			case 4:
				if (message.member!.isCommunicationDisabled() === true) {
					message.channel.send({ content: `<@${message.author.id}>, You have been automatically warned for breaking Saikou's rules.\n\n**Infraction:** ${reason}` });
				} else {
					await message.member?.timeout(259200000, 'Reached 4 warnings.');
					message.channel.send({ content: `<@${message.author.id}>, You have been automatically muted for 3 days for breaking Saikou's rules (Reached 4 warnings).\n\n**Infraction:** ${reason}` });

					await moderationDmEmbed(message.author, `Mute`, `Hello **${message.author.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a **3 day mute** on our Discord Server.\n\nIf you continue to break the rules, your account will receive further penalties. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, `${reason} [AUTOMATIC]`);
					await moderationEmbed(message, bot, '3d Mute', message.member, `User triggered SaikouBot's auto moderation for ${autoModEmbedReason}. (Reached 4 warnings)`, false);
					bot.channels.cache.find((channel: TextChannel) => channel.name === '📂moderation').send({ content: `**<t:${Math.floor(Date.now() / 1000)}:F> | ${message.author.username}**\nContent: ${message.cleanContent}` });
				}
				break;

			case 5:
				await moderationDmEmbed(message.author, 'Kick', `Hello **${message.author.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a kick from our Discord Server.\n\nIf you continue to break the rules, your account will be permanently banned from accessing the Discord Server. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, `${reason} [AUTOMATIC]`);
				await moderationEmbed(message, bot, 'Kick', message.member, `User triggered SaikouBot's auto moderation for ${autoModEmbedReason}. (Reached 5 warnings)`, false);
				bot.channels.cache.find((channel: TextChannel) => channel.name === '📂moderation').send({ content: `**<t:${Math.floor(Date.now() / 1000)}:F> | ${message.author.username}**\nContent: ${message.cleanContent}` });

				message.channel.send({ content: `<@${message.author.id}>, You have been automatically kicked for breaking Saikou's rules (Reached 5 warnings).\n\n**Infraction:** ${reason}` });
				message.member!.kick('Reached 5 warnings.');
				break;

			case 6:
				await moderationDmEmbed(message.author, 'Ban', `Hello **${message.author.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules for the final time. Because of this, your account has been permanently banned from the Saikou Discord.\n\nIf you believe this is a mistake, submit an appeal by visiting\nhttps://forms.gle/L98zfzbC8fuAz5We6\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, `${reason} [AUTOMATIC]`);
				await moderationEmbed(message, bot, 'Ban', message.member, `User triggered SaikouBot's auto moderation for ${autoModEmbedReason}. (Reached 6 warnings)`, false);
				bot.channels.cache.find((channel: TextChannel) => channel.name === '📂moderation').send({ content: `**<t:${Math.floor(Date.now() / 1000)}:F> | ${message.author.username}**\nContent: ${message.cleanContent}` });

				message.channel.send({ content: `<@${message.author.id}>, You have been automatically banned for breaking Saikou's rules (Reached 6 warnings).\n\n**Infraction:** ${reason}` });
				message.member!.ban({ deleteMessageSeconds: 604800, reason: 'Reached 6 warnings.' });
				break;
			default:
				await moderationDmEmbed(message.author, 'Warning', `Hello **${message.author.username}**,\n\nYour account has recently been flagged by a staff member for breaching Saikou's Community Rules.\n\nTo learn more about our server rules, visit <#397797150840324115>\n\nWe take these actions seriously. If you continue to break the rules, we may need to take additional action against your account, which could result in a permanent ban from the Saikou Discord.\n\nPlease check the attached moderator note below for more details.`, `${reason} [AUTOMATIC]`);
				message.channel.send({ content: `<@${message.author.id}>, You have been automatically warned for breaking Saikou's rules.\n\n**Infraction:** ${reason}` });
				break;
		}

		bot.channels.cache.find((channel: TextChannel) => channel.name === '🤖auto-mod').send({ embeds: [autoModEmbed] });
	}
}

/* Swear Filter */
export async function insultCheck(message: Message) {
	if (message.author.bot || message.system === true || message.channel.type === ChannelType.DM || message.content === '') return;

	const data: any = {};
	const requestedAttributes: any = {};
	const attributeThresholds: any = {
		TOXICITY: 0.8,
		INSULT: 0.8,
	};

	let filteredContent: any;

	for (const attribute in attributeThresholds) {
		requestedAttributes[attribute] = {};
	}

	google
		.discoverAPI('https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1')
		.then(async (client: any) => {
			const res = await client.comments.analyze({
				key: process.env.PERSPECTIVE_API_KEY,
				resource: {
					comment: { text: filteredContent || message.content },
					languages: ['en'],
					requestedAttributes,
				},
			});

			for (const key in res.data.attributeScores) {
				data[key] = res.data.attributeScores[key].summaryScore.value > attributeThresholds[key];
			}

			if (data.INSULT === true || data.TOXICITY === true) {
				message.channel.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setDescription("We've detected some behaviour that may be toxic or insulting.\n\n🔎 **Looking on how to quick report? Follow below.**")
							.setImage('https://saikou.dev/assets/images/discord-bot/report-help.png')
							.setColor(EMBED_COLOURS.red),
					],
				});
			}
		})
		.catch(() => {});
}

/* Invite link filter */
export async function inviteLinkCheck(bot: any, message: Message) {
	if (message.author.bot || message.system === true || message.channel.type === ChannelType.DM || message.content === '') return;

	for (const invite of ['discord.gg/', 'discord.com/invite', 'discordapp.com/invite']) {
		if (message.content.toLowerCase().includes(`${invite}/saikou`)) return;

		autoPunish(message.content.includes(invite), message, 'INVITE_LINK', `\`1.8\` - All forms of **advertising**, selling, scamming are forbidden.`, bot);
	}
}

/* Warning users with bad custom statuses */
export async function statusCheck(bot: any, message: Message) {
	if (!message.member?.presence || message.author.bot || message.system) return;

	for (const status of message.member!.presence.activities) {
		if (status.type === ActivityType.Custom) {
			const statusTimerData = await statusTimer.findOne({ userID: message.member!.id });

			if (statusTimerData || !status.state) return;

			const data: any = {};
			const requestedAttributes: any = {};
			const attributeThresholds: any = {
				PROFANITY: 0.9,
				SEXUALLY_EXPLICIT: 0.95,
			};

			let filteredContent: any;

			for (const attribute in attributeThresholds) {
				requestedAttributes[attribute] = {};
			}

			for await (const word of WHITELISTED_WORDS) {
				if (status.state.toLowerCase().includes(word)) {
					filteredContent = filteredContent ? filteredContent.toLowerCase().replace(word, '') : status.state.toLowerCase().replace(word, '');
				}
			}

			if (filteredContent === '') return;

			google
				.discoverAPI('https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1')
				.then(async (client: any) => {
					const res = await client.comments.analyze({
						key: process.env.PERSPECTIVE_API_KEY,
						resource: {
							comment: { text: filteredContent || status.state },
							languages: ['en'],
							requestedAttributes,
						},
					});

					for (const key in res.data.attributeScores) {
						data[key] = res.data.attributeScores[key].summaryScore.value > attributeThresholds[key];
					}

					if (data.PROFANITY === true || data.SEXUALLY_EXPLICIT === true) {
						statusTimer.create({
							userID: message.member?.id,
							timestamp: new Date(),
							duration: 43200000,
							status: status.state,
						});

						bot.channels.cache
							.find((channel: TextChannel) => channel.name === '🤖auto-mod')
							.send({
								embeds: [
									new EmbedBuilder()
										.setAuthor({ name: message.member ? message.member.displayName : message.author.username, iconURL: message.author.displayAvatarURL() })
										.setDescription(`**${message.author.username} has triggered the auto moderation for INAPPROPRIATE_STATUS, they will be kicked in 12 hours if they don't change it**.`)
										.addFields([{ name: 'Triggered Status', value: `${status.state}` }])
										.setFooter({ text: `User ID: ${message.author.id}` })
										.setTimestamp()
										.setColor(EMBED_COLOURS.red),
								],
							});
						return message.channel.send({ content: `<@${message.author.id}>, please change your status to be in-line with Saikou's rules, failure to do so will result in an automated kick after 12 hours.\n\n**Infraction:** \`3.1\` - Inappropriate names, **game displays** and profile pictures will be asked to be removed and changed. Failure to change them will result in removal of the server.` });
					}
				})
				.catch(() => {});
		}
	}
}

/* Warning users who attempt to mention @here or @everyone */
export async function everyoneMention(bot: any, message: Message) {
	if (message.author.bot) return;
	await autoPunish(message.content.includes('@everyone') || message.content.includes('@here'), message, 'EVERYONE_MENTION', `\`1.13\` - Do not ping the staff team for baseless reasons, as well as members. Ghost pings are also forbidden.`, bot);
}

/* Warning users who attempt to mention Force */
export async function devMention(bot: any, message: Message) {
	if (message.author.bot || message.mentions.members!.size < 1) return;
	await autoPunish(message.content.includes(`<@198545845287780352>`) || message.content.includes(`<@!198545845287780352>`), message, 'DEVELOPER_MENTION', `\`1.12\` - Do not ping developers for any reason.`, bot, true);
}

/* Warning users who post personal information */
export async function personalInfoCheck(bot: any, message: Message) {
	if (message.author.bot) return;

	const emailRegex = /[\w.]+@[\w.]+\.[\w.]+/;

	await autoPunish(emailRegex.test(message.content), message, 'PERSONAL_INFORMATION', `\`1.15\` - Leaking any personal information about other members or staff is forbidden.`, bot);
}
