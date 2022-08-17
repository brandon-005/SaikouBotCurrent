import { Command, Message, AttachmentBuilder, Attachment, MessageCollector, EmbedBuilder } from 'discord.js';
import urlRegex from 'url-regex';

import { interactiveSetup, cancel, noContent, timeout } from '../../utils/embeds';
import { LETTER_EMOJIS, EMBED_COLOURS, PROMPT_TIMEOUT, MESSAGE_TIMEOUT, VIDEO_FILE_TYPES } from '../../utils/constants';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'bugreport',
		commandAliases: ['bug', 'reportbug'],
		commandDescription: "Use this command to report bugs regarding Saikou's games or bots to the developers.",
		limitedChannel: 'bug-reports',
	},
	run: async ({ bot, message }) => {
		const platformTypes: any = {
			'Discord/SaikouBot': '🇦',
			'Military Warfare Tycoon': '🇧',
			Killstreak: '🇨',
			Other: '🇩',
		};

		let platformFinal: String = '';
		let bugTitle: String = '';
		let reportDescription: String = '';

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
							.setDescription('You already have a bug report open, please either finish/cancel and try again!')
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
				`❓ **Which platform below does your bug come under?\n\n${Object.keys(platformTypes)
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

		/* BUG TITLE PROMPT */
		const dmChannel = await message.author.createDM();
		await interactiveSetup(message, bot, true, '1/3', '❓ **What title would you like to give your bug report? (e.g. Sniper Scope Broken)**');

		try {
			const collectingMessage = await dmChannel.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedMessage = collectingMessage.first();

			if (sendCancel(false, null, inputtedMessage) !== false || sendNoContent(inputtedMessage) !== false) return;

			bugTitle = inputtedMessage!.content;
		} catch (err) {
			openPrompt.delete(message.author.id);
			return timeout(message, true);
		}

		/* BUG DESCRIPTION PROMPT */
		await interactiveSetup(message, bot, true, '2/3', `❓ **Please provide a detailed description of the bug you are facing.**`);

		try {
			const collectingMessage = await dmChannel.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedMessage = collectingMessage.first();

			if (sendCancel(false, null, inputtedMessage) !== false || sendNoContent(inputtedMessage) !== false) return;

			reportDescription = inputtedMessage!.content;
		} catch (err) {
			openPrompt.delete(message.author.id);
			return timeout(message, true);
		}

		/* BUG REPORT PROOF PROMPT */
		await interactiveSetup(message, bot, true, '3/3', `📸 **Please input a video/photo of the bug in action.**\n\n**Note:** If you don't have any proof of this bug in action, you can say **skip**.\n\nPlease say **done** once you have finished uploading the proof.`);

		const attachmentCollector: MessageCollector = dmChannel.createMessageCollector({ filter: (msg: Message) => msg.author.id === message.author.id, idle: PROMPT_TIMEOUT, max: 10 });
		const fetchedAttachments: any = [];

		attachmentCollector.on('collect', (collectedMsg: Message): any => {
			if (sendCancel(false, null, collectedMsg) !== false) return attachmentCollector.stop('Prompt Cancelled');
			if (collectedMsg.content.toLowerCase() === 'done' || collectedMsg.content.toLowerCase() === 'skip') return attachmentCollector.stop();
			if (collectedMsg.attachments.size > 5 || fetchedAttachments.length === 5) return message.author.send('You can only provide 5 photos/videos, please either say **done** to submit the report, or cancel to submit different proof.');

			if (collectedMsg.attachments.size > 0) {
				collectedMsg.attachments.forEach((attachment: Attachment) => {
					fetchedAttachments.push({ content: collectedMsg.content ? collectedMsg.content : '', url: attachment.url });
				});
			}

			/* LINK DETECTION */
			if (urlRegex({ exact: true }).test(collectedMsg.content) === true) {
				fetchedAttachments.push({ linkContent: collectedMsg.content });
			}

			if (collectedMsg.attachments.size === 0 && urlRegex({ exact: true }).test(collectedMsg.content) === false) {
				return message.author.send('Please input a link, photo or video of the bug. If this is incorrect, please inform us!');
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
						.setDescription('Your bug report has been posted.')
						.setColor(EMBED_COLOURS.green)
						.setTimestamp()
						.setThumbnail('https://i.ibb.co/kxJqM6F/mascot-Success.png'),
				],
			});

			message.channel.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle(`🐛 Bug Reported!`)
						.setDescription(`**Platform:** ${platformFinal}\n\n__**${bugTitle}**__\n${reportDescription}`)
						.setThumbnail(message.author.displayAvatarURL())
						.setFooter({ text: `Bug Report by ${message.guild?.members.cache.get(message.author.id)?.displayName}`, iconURL: message.author.displayAvatarURL() })
						.setColor(EMBED_COLOURS.blurple)
						.setTimestamp(),
				],
			});

			fetchedAttachments.forEach(async (attachment: any) => {
				const attachmentEmbed = new EmbedBuilder() // prettier-ignore
					.setImage(attachment.url)
					.setColor(EMBED_COLOURS.blurple)
					.setFooter({ text: `Bug Report by ${message.guild?.members.cache.get(message.author.id)?.displayName}`, iconURL: message.author.displayAvatarURL() });

				if (attachment.content !== '') attachmentEmbed.setTitle(String(attachment.content));

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
