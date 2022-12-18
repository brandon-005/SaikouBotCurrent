import { Message, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import urlRegex from 'url-regex';
import stringSimilarity from 'string-similarity';

import { EMBED_COLOURS, MESSAGE_TIMEOUT, QUESTION_ANSWERS } from '../../utils/constants';
import { swearCheck, maliciousLinkCheck, inviteLinkCheck, statusCheck, massMentionCheck, everyoneMention, devMention, personalInfoCheck } from '../../utils/autoMod';

export = async (bot: any, message: Message) => {
	/* Importing auto mod stuff */
	if (message.author.bot || message.channel.type === ChannelType.DM || message.system) return;

	if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
		await swearCheck(bot, message);
		await maliciousLinkCheck(bot, message);
		await inviteLinkCheck(bot, message);
		await massMentionCheck(bot, message);
		await everyoneMention(bot, message);
		await devMention(bot, message);
		await personalInfoCheck(bot, message);
	}

	/* If user @mentions bot */
	if (message.content === `<@${bot.user!.id}>` || message.content === `<@!${bot.user!.id}>`) {
		return message.channel
			.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription(`You can use **/help** to view all of Saikou's commands.`)
						.setColor(EMBED_COLOURS.green),
				],
			})
			.then((msg: any) =>
				setTimeout(() => {
					if (msg.deletable) msg.delete();
				}, MESSAGE_TIMEOUT)
			);
	}

	/* Deleting messages in feedback and report channels */
	if ((message.channel.type === ChannelType.GuildText && message.channel.parent!.name === '🔖 | Feedback & reports') || (message.channel.type === ChannelType.GuildText && message.channel.name === '👋introductions')) {
		try {
			setTimeout(() => {
				if (message.deletable) message.delete();
			}, 500);
		} catch (err) {
			return;
		}
	}

	/* Deleting content that isn't a discord attachment in memes and art */
	if ((message.channel.type === ChannelType.GuildText && message.channel.name.match('memes')) || (message.channel.type === ChannelType.GuildText && message.channel.name.match('art'))) {
		if (!(message.attachments.size > 0 || urlRegex({ exact: false }).test(message.content))) {
			if (message.deletable) return message.delete();
			return;
		}

		/* Deleting attachments that are invisible with less than 5 pixel height and width */
		if (message.attachments.size > 0 && message.attachments.first().height < 5 && message.attachments.first().width < 5) {
			if (message.deletable) return message.delete();
			return;
		}
	}

	/* Story Corner Character limit */
	if (message.channel.name === '📚story-corner' && message.content.length < 150) {
		if (message.deletable) message.delete();
		return message.channel
			.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription('**Stories must be 150 characters or more.**')
						.setColor(EMBED_COLOURS.red),
				],
			})
			.then((msg: any) =>
				setTimeout(() => {
					if (msg.deletable) msg.delete();
				}, MESSAGE_TIMEOUT)
			);
	}

	setTimeout(async () => {
		await statusCheck(bot, message);
	}, 5000);

	/* Automatically answering frequently asked questions */
	for (const { question, answer } of QUESTION_ANSWERS) {
		const similarity = stringSimilarity.compareTwoStrings(message.content.toLowerCase(), question.toLowerCase());

		// If the message is similar enough to the pre-defined question, send the pre-defined answer
		if (similarity > 0.6) {
			return message.channel.send(answer);
		}
	}
};
