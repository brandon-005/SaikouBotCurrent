import { GuildMember, EmbedBuilder } from 'discord.js';
import moment from 'moment';

import { WELCOME_MESSAGES, EMBED_COLOURS } from '../../utils/constants';
import { choose } from '../../utils/functions';

export = async (bot: any, member: GuildMember) => {
	bot.channels.cache.get(process.env.JOIN_LEAVES_CHANNEL).send({
		embeds: [
			new EmbedBuilder() // prettier-ignore
				.setTitle('👋 Welcome to the **Saikou Discord**!')
				.setDescription(`**${member.user.username}** ${choose(WELCOME_MESSAGES)}`)
				.setColor(EMBED_COLOURS.green)
				.setFooter({ text: 'User joined' })
				.setTimestamp(),
		],
	});

	bot.channels.cache.get(process.env.ADMIN_LOG).send({
		embeds: [
			new EmbedBuilder() // prettier-ignore
				.setTitle('ℹ Member joined!')
				.setDescription(`<@${member.user.id}> has joined the server.`)
				.addFields([
					// prettier-ignore
					{ name: 'Username', value: member.user.username, inline: true },
					{ name: 'Registered', value: `${moment(member.user.createdAt).format('MMMM Do YYYY')} (${moment(member.user.createdAt).fromNow()})`, inline: true },
				])
				.setColor(EMBED_COLOURS.blurple)
				.setFooter({ text: `User ID: ${member.user.id}` })
				.setTimestamp(),
		],
	});
};
