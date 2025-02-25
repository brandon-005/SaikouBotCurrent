import { GuildMember, EmbedBuilder, Role } from 'discord.js';
import moment from 'moment';

import { EMBED_COLOURS, WELCOME_MESSAGES } from '../../utils/constants';
import { choose } from '../../utils/functions';

export = async (bot: any, member: GuildMember) => {

	await member.roles.add(member.guild!.roles.cache.find((role: Role) => role.name === 'Unverified')!);

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

	bot.channels.cache.get(process.env.JOIN_LEAVES_CHANNEL).send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('👋 Welcome to the **Saikou Discord**!')
							.setDescription(`**${member.nickname ? member.user.username : member.nickname}** ${choose(WELCOME_MESSAGES)}`)
							.setColor(EMBED_COLOURS.green)
							.setThumbnail(member.displayAvatarURL({ extension: 'webp' }))
							.setFooter({ text: 'User joined' })
							.setTimestamp()
					],
				});
};
