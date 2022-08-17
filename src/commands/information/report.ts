import { Command, Message, AttachmentBuilder, MessageCollector, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import urlRegex from 'url-regex';

import { interactiveSetup, cancel, noContent, timeout, noUser } from '../../utils/embeds';
import { LETTER_EMOJIS, EMBED_COLOURS, PROMPT_TIMEOUT, MESSAGE_TIMEOUT, VIDEO_FILE_TYPES } from '../../utils/constants';
import reportData from '../../models/reports';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'report',
		commandAliases: ['userreport', 'playerreport'],
		commandDescription: "Report players who are in breach of Saikou's rules through this command, make sure you grab some proof to go with it!",
		limitedChannel: 'report-abuse',
	},
	run: async ({ bot, message }) => {
		const platformTypes: any = {
			'Military Warfare Tycoon': '🇦',
			Killstreak: '🇧',
			Discord: '🇨',
			'Saikou Group': '🇩',
			Other: '🇪',
		};

		const anonymousReactions: String[] = ['✅', '❌', '🚪'];
		let platformFinal: String = '';

		let finalName: String = '';
		let robloxID: Number = 0;
		let robloxDisplayName: String = '';

		let reportReason: String = '';
		let anonymous: Boolean = false;

		/* FUNCTIONS */
		function sendCancel(reactionPrompt: Boolean, inputtedReaction?: any, userMessage?: Message) {
			if (reactionPrompt === true && inputtedReaction === '🚪') {
				openPrompt.delete(message.author.id);
				return cancel(message, true);
			}
			if (userMessage?.content.toLowerCase() === 'cancel') {
				openPrompt.delete(message.author.id);
				return cancel(message, true);
			}
			return false;
		}

		function sendNoContent(userMessage: Message) {
			if (!userMessage.content) {
				openPrompt.delete(message.author.id);
				return noContent(message);
			}
			return false;
		}

		/* IF USER HAS PROMPT OPEN */
		if (openPrompt.has(message.author.id))
			return message.channel
				.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('🗃️ Prompt already open!')
							.setDescription('You already have a report open, please either finish/cancel and try again!')
							.setColor(EMBED_COLOURS.red)
							.setFooter({ text: 'Already open prompt' }),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));

		openPrompt.add(message.author.id);

		/* PLATFORM PROMPT */
		try {
			const platformEmbed = await interactiveSetup(
				message,
				bot,
				true,
				'1/4',
				`❓ **Which platform below does your report come under?\n\n${Object.keys(platformTypes)
					.map((option: string, number: number) => `${String.fromCharCode(97 + number).toUpperCase()}. ${option}\n`)
					.join('')}**\n\nSubmit your answer by reacting with the corresponding reaction.`,
				true
			);

			Object.values(platformTypes).forEach(async (_platform, count) => {
				await platformEmbed!.react(String(LETTER_EMOJIS[count]));
			});

			await platformEmbed?.react('🚪');

			/* DM SENT MESSAGE */
			message.channel
				.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setDescription(`📬 A message has been sent to your DM's <@${message.author.id}>`)
							.setColor(EMBED_COLOURS.green),
					],
				})
				.then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT))
				.catch(() => {});

			const collectingReaction = await platformEmbed!.awaitReactions({ filter: (reaction: any, user: any) => LETTER_EMOJIS.includes(reaction.emoji.name) && user.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedReaction = collectingReaction.first()?.emoji.name;

			if (sendCancel(true, inputtedReaction) !== false) return;

			platformFinal = String(Object.keys(platformTypes).find((key: any) => platformTypes[key] === inputtedReaction));
		} catch (err: any) {
			openPrompt.delete(message.author.id);
			if (err.status === 403) {
				return message.channel
					.send({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('❌ Unable to DM!')
								.setDescription("Please ensure your DM's are enabled in order for the bot to message you the prompt.")
								.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
								.setColor(EMBED_COLOURS.red),
						],
					})
					.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
			}
			return timeout(message, true);
		}

		/* REPORT USERNAME PROMPT */
		const dmChannel = await message.author.createDM();
		await interactiveSetup(message, bot, true, '1/4', '❓ **What is the username of the person you are reporting?**');

		try {
			const collectingMessage = await dmChannel.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedMessage = collectingMessage.first();

			if (sendCancel(false, null, inputtedMessage) !== false || sendNoContent(inputtedMessage) !== false) return;

			finalName = inputtedMessage!.content;

			if (platformFinal !== 'Discord' && platformFinal !== 'Other') {
				let invalidUser = false;
				await axios({
					method: 'post',
					url: 'https://users.roblox.com/v1/usernames/users',
					data: {
						usernames: [finalName],
					},
				})
					.then((response: any) => {
						robloxDisplayName = response.data.data.map((value: any) => value.displayName);
						robloxID = response.data.data.map((value: any) => value.id);
						if (response.data.data.length === 0) invalidUser = true;
					})
					.catch((error) => {
						console.error(error);
					});

				if (invalidUser !== false) {
					openPrompt.delete(message.author.id);
					return await noUser(message, true);
				}
			}
		} catch (err) {
			openPrompt.delete(message.author.id);
			return timeout(message, true);
		}

		/* REPORT USERNAME PROMPT */
		await interactiveSetup(message, bot, true, '2/4', `❓ **What is the reason for reporting ${finalName}?**`);

		try {
			const collectingMessage = await dmChannel.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedMessage = collectingMessage.first();

			if (sendCancel(false, null, inputtedMessage) !== false || sendNoContent(inputtedMessage) !== false) return;

			reportReason = inputtedMessage!.content;
		} catch (err) {
			openPrompt.delete(message.author.id);
			return timeout(message, true);
		}

		/* ANONYMOUS REPORT PROMPT */
		const anonymousEmbed = await interactiveSetup(message, bot, true, '3/4', "❓ **Do you want to report anonymously?**\n\n**Note:** This will still make you visible to staff, however you won't be revealed publicly.", true);

		anonymousReactions.forEach((reaction: any) => anonymousEmbed?.react(reaction));

		try {
			const collectingReaction = await anonymousEmbed!.awaitReactions({ filter: (reaction: any, user: any) => anonymousReactions.includes(reaction.emoji.name) && user.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedReaction = collectingReaction.first()?.emoji.name;

			if (sendCancel(true, inputtedReaction) !== false) return;
			if (inputtedReaction === '✅') anonymous = true;
		} catch (err) {
			openPrompt.delete(message.author.id);
			return timeout(message, true);
		}

		/* REPORT PROOF PROMPT */
		await interactiveSetup(message, bot, true, '4/4', `📸 **Please input a video/photo of the offence.**\n\n**Note:** If you don't have any proof you will have to cancel this report and gain some. Our staff cannot issue punishments without solid evidence of the offence.\n\nPlease say **done** once you have finished uploading the proof.`);

		const attachmentCollector: MessageCollector = dmChannel.createMessageCollector({ filter: (msg: Message) => msg.author.id === message.author.id, idle: PROMPT_TIMEOUT, max: 10 });
		const fetchedAttachments: any = [];

		attachmentCollector.on('collect', (collectedMsg: Message): any => {
			if (sendCancel(false, null, collectedMsg) !== false) return attachmentCollector.stop('Prompt Cancelled');
			if (collectedMsg.content.toLowerCase() === 'done' && !fetchedAttachments.length) return message.author.send('You **MUST** provide at least one video, link or photo of the offence before you can submit the report.');
			if (collectedMsg.content.toLowerCase() === 'done') return attachmentCollector.stop();
			if (collectedMsg.attachments.size > 5 || fetchedAttachments.length === 5) return message.author.send('You can only provide 5 photos/videos, please either say **done** to submit the report, or cancel to submit different proof.');

			if (collectedMsg.attachments.size > 0) {
				collectedMsg.attachments.forEach((attachment) => {
					fetchedAttachments.push({ content: collectedMsg.content ? collectedMsg.content : '', url: attachment.url });
				});
			}

			/* LINK DETECTION */
			if (urlRegex({ exact: true }).test(collectedMsg.content) === true) {
				fetchedAttachments.push({ linkContent: collectedMsg.content });
			}

			if (collectedMsg.attachments.size === 0 && urlRegex({ exact: true }).test(collectedMsg.content) === false) {
				return message.author.send('Please input a link, photo or video of the offence. If this is incorrect, please inform us!');
			}
		});

		attachmentCollector.on('end', async (_collected: any, response: any) => {
			if (response === 'Prompt Cancelled') return;
			if (response === 'idle') {
				openPrompt.delete(message.author.id);
				await timeout(message, true);
			}

			message.author.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('✅ Success!')
						.setDescription('Your report has been posted.')
						.setColor(EMBED_COLOURS.green)
						.setTimestamp(),
				],
			});

			const embed = new EmbedBuilder() // prettier-ignore
				.setTitle(`🛡 New report!`)
				.setDescription(`**Platform:** ${platformFinal}\n**Reported User:** ${finalName}\n**Reason**: ${reportReason}`)
				.setThumbnail(message.author.displayAvatarURL())
				.setFooter({ text: `Reported by ${message.guild?.members.cache.get(message.author.id)?.displayName}`, iconURL: message.author.displayAvatarURL() })
				.setColor(EMBED_COLOURS.blurple)
				.setTimestamp();

			if (robloxDisplayName !== '') embed.setDescription(`**Platform:** ${platformFinal}\n**Reported User:** [${finalName}](https://www.roblox.com/users/${robloxID}/profile) [${robloxDisplayName}]\n**Reason**: ${reportReason}`);

			const reportEmbed = await message.channel.send({ embeds: [embed] });

			if (anonymous === true) {
				reportEmbed.edit({ embeds: [embed.setFooter({ text: `Report ID: ${reportEmbed.id}`, iconURL: bot.user?.displayAvatarURL() }).setThumbnail(bot.user?.displayAvatarURL()!)] });

				await reportData.create({
					messageID: reportEmbed.id,
					userID: message.author.id,
				});
			}

			fetchedAttachments.forEach(async (attachment: any) => {
				const attachmentEmbed = new EmbedBuilder() // prettier-ignore
					.setImage(attachment.url)
					.setColor(EMBED_COLOURS.blurple)
					.setFooter({ text: `Reported by ${message.guild?.members.cache.get(message.author.id)?.displayName}`, iconURL: message.author.displayAvatarURL() });

				if (attachment.content !== '') attachmentEmbed.setTitle(String(attachment.content));
				if (anonymous === true) attachmentEmbed.setFooter({ text: `Report ID: ${reportEmbed.id}`, iconURL: bot.user?.displayAvatarURL() });

				/* POSTING LINKS */
				if (attachment.linkContent)
					return message.channel.send({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setDescription(attachment.linkContent)
								.setColor(EMBED_COLOURS.blurple),
						],
					});

				/* IF VIDEO POST WITHOUT EMBED */
				for (const fileType of VIDEO_FILE_TYPES) {
					if (attachment.url.includes(fileType)) {
						if (attachment.content !== '') return message.channel.send({ content: attachment.content, files: [new AttachmentBuilder(attachment.url)] });
						return message.channel.send({ files: [new AttachmentBuilder(attachment.url)] });
					}
				}

				/* POST IMAGE */
				message.channel.send({ embeds: [attachmentEmbed] });
			});

			openPrompt.delete(message.author.id);
		});
	},
};

export = command;
