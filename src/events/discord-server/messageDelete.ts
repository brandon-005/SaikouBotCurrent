import { Message, ChannelType, PermissionFlagsBits, MessageMentions, EmbedBuilder } from 'discord.js';
import { autoPunish } from '../../utils/autoMod';

import { EMBED_COLOURS } from '../../utils/constants';

export = async (bot: any, message: Message) => {
	if (message.channel.type !== ChannelType.DM && !message.partial && !message.author.bot) {
		switch (message.channel.parent.name) {
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

		/* GHOST PING AUTO MOD */
		if (message.member && !message.member.permissions.has(PermissionFlagsBits.ManageMessages) && message.channel.name !== '🎨art' && message.channel.name !== '📝report-abuse' && message.channel.name !== '🐞bug-reports' && message.channel.name !== '💡suggestions' && message.channel.name !== '🐸memes') {
			await autoPunish(message.content.match(MessageMentions.UsersPattern), message, 'GHOST_PING', `\`1.13\` - Do not ping the staff team for baseless reasons, as well as members. Ghost pings are also forbidden. `, bot, true);
		}

		const messageDeletedEmbed = new EmbedBuilder() //
			.setTitle(':warning: Warning!')
			.setColor(EMBED_COLOURS.yellow)
			.setFooter({ text: `${message.author.username} (${message.author.id})`, iconURL: message.author.avatarURL() })
			.setTimestamp();

		if (message.attachments.first()) {
			messageDeletedEmbed.setDescription(`**<@!${message.author.id}> deleted an attachment posted <t:${parseInt(String(message.createdTimestamp / 1000))}:R> in <#${message.channel.id}>**`);
			messageDeletedEmbed.setImage(message.attachments.first().proxyURL);

			if (message.content) {
				messageDeletedEmbed.addFields([{ name: 'Message Content', value: `> ${message.content.length > 1020 ? `${message.content.substring(0, 1019)}...` : message.content}`, inline: true }]);
			}
		} else {
			messageDeletedEmbed.setDescription(`**<@!${message.author.id}> deleted a message posted <t:${parseInt(String(message.createdTimestamp / 1000))}:R> in <#${message.channel.id}>**`);
			messageDeletedEmbed.addFields([{ name: 'Message Content', value: `> ${message.content.length > 1020 ? `${message.content.substring(0, 1019)}...` : message.content}`, inline: true }]);
		}

		return bot.channels.cache.get(process.env.ADMIN_LOG).send({ embeds: [messageDeletedEmbed] });
	}
};
