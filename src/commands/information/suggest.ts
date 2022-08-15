import { Command, Message, EmbedBuilder } from 'discord.js';

import { interactiveSetup, cancel, timeout, confirmationPrompt } from '../../utils/embeds';
import { LETTER_EMOJIS, EMBED_COLOURS, PROMPT_TIMEOUT, MESSAGE_TIMEOUT } from '../../utils/constants';
import suggestionData from '../../models/suggestions';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'suggest',
		commandAliases: ['suggestion'],
		commandDescription: 'Pondering on that one idea for Saikou? Why wait, use this command to suggest it to our team of awesomeness!',
		limitedChannel: 'suggestions',
	},
	run: async ({ bot, message }) => {
		const categoryTypes: any = {
			'Military Warfare Tycoon': '🇦',
			Killstreak: '🇧',
			Discord: '🇨',
			Other: '🇩',
		};

		const anonymousReactions: String[] = ['✅', '❌', '🚪'];
		let categoryFinal: String = '';
		let suggestionMsg: String = '';
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

		/* IF USER HAS PROMPT OPEN */
		if (openPrompt.has(message.author.id))
			return message.channel
				.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('🗃️ Prompt already open!')
							.setDescription('You already have a suggestion open, please either finish/cancel and try again!')
							.setColor(EMBED_COLOURS.red)
							.setFooter({ text: 'Already open prompt' }),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));

		openPrompt.add(message.author.id);

		/* CATEGORY PROMPT */
		try {
			const categoryEmbed = await interactiveSetup(
				message,
				bot,
				true,
				'1/3',
				`❓ **Which category below does your suggestion come under?\n\n${Object.keys(categoryTypes)
					.map((option: string, number: number) => `${String.fromCharCode(97 + number).toUpperCase()}. ${option}\n`)
					.join('')}**\n\nSubmit your answer by reacting with the corresponding reaction.`,
				true
			);

			Object.values(categoryTypes).forEach(async (_category, count) => {
				await categoryEmbed!.react(String(LETTER_EMOJIS[count]));
			});

			await categoryEmbed?.react('🚪');

			/* DM SENT MESSAGE */
			message.channel
				.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setDescription(`📬 A message has been sent to your DM's <@${message.author.id}>`)
							.setColor(EMBED_COLOURS.green),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT))
				.catch(() => {});

			const collectingReaction = await categoryEmbed!.awaitReactions({ filter: (reaction: any, user: any) => LETTER_EMOJIS.includes(reaction.emoji.name) && user.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedReaction = collectingReaction.first()?.emoji.name;

			if (sendCancel(true, inputtedReaction) !== false) return;

			categoryFinal = String(Object.keys(categoryTypes).find((key: any) => categoryTypes[key] === inputtedReaction));
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

		/* SUGGESTION MESSAGE PROMPT */
		const dmChannel = await message.author.createDM();
		await interactiveSetup(message, bot, true, '2/3', '❓ **What is the suggestion you would like to post?**');

		try {
			const collectingMessage = await dmChannel.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedMessage = collectingMessage.first();

			if (sendCancel(false, null, inputtedMessage) !== false) return;

			suggestionMsg = inputtedMessage.content;
		} catch (err) {
			openPrompt.delete(message.author.id);
			return timeout(message, true);
		}

		/* ANONYMOUS SUGGESTION PROMPT */
		const anonymousEmbed = await interactiveSetup(message, bot, true, '3/3', "❓ **Do you want to suggest anonymously?**\n\n**Note:** This will still make you visible to staff, however you won't be revealed publicly.", true);

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

		/* CONFIRMATION PROMPT */
		const confirmPrompt = await confirmationPrompt(message, bot, true, `• **Category -** ${categoryFinal}\n• **Anonymous -** ${anonymous ? 'Yes' : 'No'}\n\n**Suggestion:** ${suggestionMsg}`);

		confirmPrompt.react('✅').then(() => confirmPrompt.react('❌'));

		try {
			const collectingReaction = await confirmPrompt!.awaitReactions({ filter: (reaction: any, user: any) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedReaction = collectingReaction.first()?.emoji.name;

			if (sendCancel(true, inputtedReaction) !== false) return;
			if (inputtedReaction === '✅') {
				message.author.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('✅ Success!')
							.setDescription('Your suggestion has been posted.')
							.setColor(EMBED_COLOURS.green),
					],
				});

				const embed = new EmbedBuilder() // prettier-ignore
					.setTitle(`New Suggestion!`)
					.setDescription(`**Category:** ${categoryFinal}\n**Suggestion:** ${suggestionMsg.length > 1900 ? `${suggestionMsg.substring(0, 1800)}...` : suggestionMsg}`)
					.addFields([{ name: 'Status', value: '📊 Waiting for community feedback, please add a vote!' }])
					.setAuthor({ name: `${message.guild?.members.cache.get(message.author.id)?.displayName}`, iconURL: message.author.displayAvatarURL() })
					.setColor(EMBED_COLOURS.blurple)
					.setFooter({ text: 'Add a new suggestion with .suggest' })
					.setTimestamp();

				const suggestionEmbed = await message.channel.send({ embeds: [embed] });

				if (anonymous === true) suggestionEmbed.edit({ embeds: [embed.setFooter({ text: `Suggestion ID: ${suggestionEmbed.id}` }).setAuthor({ name: 'Anonymous Suggestion', iconURL: bot.user?.displayAvatarURL() })] });

				['⬆️', '↔', '⬇️'].forEach((reaction) => suggestionEmbed.react(reaction));

				await suggestionData.create({
					suggestionMessage: suggestionMsg,
					channelID: message.channel.id,
					messageID: suggestionEmbed.id,
					userID: message.author.id,
				});

				return openPrompt.delete(message.author.id);
			}
			openPrompt.delete(message.author.id);
			return await cancel(message, true);
		} catch (err) {
			openPrompt.delete(message.author.id);
			return timeout(message, true);
		}
	},
};

export = command;
