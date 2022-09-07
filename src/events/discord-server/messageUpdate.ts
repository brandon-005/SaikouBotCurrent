import { Message, ChannelType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

import { EMBED_COLOURS } from '../../utils/constants';
import { swearCheck, maliciousLinkCheck, inviteLinkCheck, massMentionCheck, everyoneMention, devMention } from '../../utils/autoMod';

export = async (bot: any, oldMessage: Message, newMessage: Message) => {
	if (oldMessage.channel.type !== ChannelType.DM && !newMessage.partial && !oldMessage.partial && !newMessage.author.bot && newMessage.channel.type !== ChannelType.DM) {
		switch (oldMessage.channel.parent!.name) {
			case '👑 | Staff channels':
				return;
			case '🧰 | Development channels':
				return;
			case '📁 | STAFF LOGS':
				return;
			case '📒 | Staff Archive':
				return;
			default:
				break;
		}

		if (oldMessage.channel.name.match('memes') || oldMessage.channel.name.match('art')) {
			if (newMessage.attachments.size === 0) return newMessage.delete();
		}

		if (oldMessage.content === newMessage.content) return;

		const oldMessageShorten = oldMessage.content.length > 900 ? `${oldMessage.content.substring(0, 850)}...` : oldMessage.content;
		const newMessageShorten = newMessage.content.length > 900 ? `${newMessage.content.substring(0, 850)}...` : newMessage.content;
		const modLogs = bot.channels.cache.get(String(process.env.ADMIN_LOG));

		const messageUpdateEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle(':warning: Warning!')
			.setColor(EMBED_COLOURS.yellow)
			.setDescription(`**<@!${newMessage.author.id}> edited an attachment [message](${newMessage.url}) posted <t:${parseInt(String(newMessage.createdTimestamp / 1000))}:R> in <#${newMessage.channel.id}>**`)
			.addFields([
				// prettier-ignore
				{ name: 'Previous Content', value: `> ${oldMessageShorten}` || '> None' },
				{ name: 'New Content', value: `> ${newMessageShorten}` },
			])
			.setFooter({ text: `${newMessage.author.tag} (${newMessage.author.id})`, iconURL: newMessage.author.avatarURL() })
			.setTimestamp();

		if (newMessage.attachments.size > 0) {
			if (oldMessage.content.length === 0) {
				messageUpdateEmbed.setDescription(`**<@!${newMessage.author.id}> edited an attachment [message](${newMessage.url}) posted <t:${parseInt(String(newMessage.createdTimestamp / 1000))}:R> in <#${newMessage.channel.id}>**`);
				return modLogs.send({ embeds: [messageUpdateEmbed] });
			}
			return modLogs.send({ embeds: [messageUpdateEmbed] });
		}

		messageUpdateEmbed.setDescription(`**<@!${newMessage.author.id}> edited their [message](${newMessage.url}) posted <t:${parseInt(String(newMessage.createdTimestamp / 1000))}:R> in <#${newMessage.channel.id}>**`);
		modLogs.send({ embeds: [messageUpdateEmbed] });

		/* AUTO MODERATION */
		if (!newMessage.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
			await swearCheck(bot, newMessage);
			await maliciousLinkCheck(bot, newMessage);
			await inviteLinkCheck(bot, newMessage);
			await massMentionCheck(bot, newMessage);
			await everyoneMention(bot, newMessage);
			await devMention(bot, newMessage);
		}
	}
};
