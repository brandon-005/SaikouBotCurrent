import { Message, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';

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

	/* Incorrect Usages */
	const correctCommandEmbed = new EmbedBuilder() // prettier-ignore
		.setTitle('❌ Incorrect usage!')
		.setColor(EMBED_COLOURS.red)
		.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png');

	if (message.channel.name === '📝report-abuse' && message.content !== '.report') {
		correctCommandEmbed.setDescription('To begin a prompt, please use the `.report` command. You will be DMed further instructions.');
		return message.reply({ embeds: [correctCommandEmbed], failIfNotExists: false }).then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
	}

	if (message.channel.name === '💡suggestions' && message.content !== '.suggest') {
		correctCommandEmbed.setDescription('To begin a prompt, please use the `.suggest` command. You will be DMed further instructions.');
		return message.reply({ embeds: [correctCommandEmbed], failIfNotExists: false }).then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
	}

	if (message.channel.name === '🔥suggestions-nitro' && message.content !== '.suggest') {
		correctCommandEmbed.setDescription('To begin a prompt, please use the `.suggest` command. You will be DMed further instructions.');
		return message.reply({ embeds: [correctCommandEmbed], failIfNotExists: false }).then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
	}

	if (message.channel.name === '🐞bug-reports' && message.content !== '.bugreport') {
		correctCommandEmbed.setDescription('To begin a prompt, please use the `.bugreport` command. You will be DMed further instructions.');
		return message.reply({ embeds: [correctCommandEmbed], failIfNotExists: false }).then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
	}

	if (message.channel.name === '👋introductions' && message.content !== '.introduce') {
		correctCommandEmbed.setDescription('To begin a prompt, please use the `.introduce` command. You will be DMed further instructions.');
		return message.reply({ embeds: [correctCommandEmbed], failIfNotExists: false }).then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
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
};
