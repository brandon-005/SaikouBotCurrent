import { GuildMember, EmbedBuilder, Role } from 'discord.js';
import moment from 'moment';

import { EMBED_COLOURS } from '../../utils/constants';

export = async (bot: any, member: GuildMember) => {

	await member.guild?.bans
		.fetch(member)
		.then((ban) => {
			bot.channels.cache.get(process.env.JOIN_LEAVES_CHANNEL).send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('<:ban:701729757909352538> Member Banned!')
						.setDescription(`**${ban.user.username}** has been banned from Saikou by a member of staff!`)
						.setImage('https://media.giphy.com/media/H99r2HtnYs492/giphy.gif')
						.setColor(EMBED_COLOURS.red)
						.setFooter({ text: 'User banned' })
						.setTimestamp(),
				],
			});
		})
		.catch(async () => {
			return bot.channels.cache.get(process.env.ADMIN_LOG).send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('ℹ Member left!')
						.setDescription(`<@${member.user.id}> has left the server.`)
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
		});
};
