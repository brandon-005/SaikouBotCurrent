import { Message, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import urlRegex from 'url-regex';

import { EMBED_COLOURS, MESSAGE_TIMEOUT } from '../../utils/constants';
import { swearCheck, maliciousLinkCheck, inviteLinkCheck, statusCheck, massMentionCheck, everyoneMention, devMention } from '../../utils/autoMod';

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
	}

	/* If user @mentions bot */
	if (message.content === `<@${bot.user!.id}>` || message.content === `<@!${bot.user!.id}>`) {
		return message.channel.send({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setDescription(`You can use **/help** to view all of Saikou's commands.`)
					.setColor(EMBED_COLOURS.green),
			],
		});
	}

	/* Deleting messages in feedback and report channels */
	if ((message.channel.type === ChannelType.GuildText && message.channel.parent!.name === '🔖 | Feedback & reports') || (message.channel.type === ChannelType.GuildText && message.channel.name === '👋introductions')) {
		try {
			setTimeout(() => message.delete(), 500);
		} catch (err) {
			return;
		}
	}

	/* Deleting content that isn't a discord attachment in memes and art */
	if ((message.channel.type === ChannelType.GuildText && message.channel.name.match('memes')) || (message.channel.type === ChannelType.GuildText && message.channel.name.match('art'))) {
		if (!(message.attachments.size > 0 || urlRegex({ exact: false }).test(message.content))) {
			return message.delete().catch(() => {});
		}

		/* Deleting attachments that are invisible with less than 5 pixel height and width */
		if (message.attachments.size > 0 && message.attachments.first().height < 5 && message.attachments.first().width < 5) {
			return message.delete().catch(() => {});
		}
	}

	/* Story Corner Character limit */
	if (message.channel.name === '📚story-corner' && message.content.length < 150) {
		message.delete();
		return message.channel
			.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription('**Stories must be 150 characters or more.**')
						.setColor(EMBED_COLOURS.red),
				],
			})
			.then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
	}

	setTimeout(async () => {
		await statusCheck(bot, message);
	}, 5000);

	/* TEMP - Checking if user is trying to use chat commands */
	try {
		if (message.content === `.${bot.slashCommands.get(message.content.substring(1)).config.commandName}`) {
			return await message.channel.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription('**SaikouBot commands now rely on slash commands to function. To get started, use the /help command.**')
						.setColor(EMBED_COLOURS.red),
				],
			});
		}
	} catch (err) {
		return;
	}
};
