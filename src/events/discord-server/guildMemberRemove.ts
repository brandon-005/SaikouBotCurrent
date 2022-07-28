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
						.setDescription(`**${ban.user.tag}** has been banned from Saikou by a member of staff!`)
						.setImage('https://media.giphy.com/media/H99r2HtnYs492/giphy.gif')
						.setColor(EMBED_COLOURS.red)
						.setFooter({ text: 'User banned' })
						.setTimestamp(),
				],
			});
		})
		.catch(async () => {
			const leaveEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle('👋 Member left!')
				.setColor(EMBED_COLOURS.red)
				.setFooter({ text: 'User left' })
				.setTimestamp();

			switch (member.roles.cache.map((role: Role) => role.name)[0]) {
				case 'Dedicated Follower':
					leaveEmbed.setDescription(`**${member.user.username}** has left Saikou. We'll miss you!`);
					break;

				case 'Ultimate Follower':
					leaveEmbed.setDescription(`**${member.user.username}** has said their farewells and left Saikou. We appreciated your support towards us!`);
					break;

				case 'Supreme Follower':
					leaveEmbed.setDescription(`**${member.user.username}** has abandoned Saikou. Thank you for dedication and support, this server wouldn't be what it is without you.`);
					break;

				case 'Legendary Follower':
					leaveEmbed.setDescription(`**${member.user.username}** has abandoned Saikou. After such a long time, you deserve a bit of rest. You will always be remembered as the legend you are.`);
					break;

				case 'Omega Follower':
					leaveEmbed.setDescription(`**${member.user.username}** has abandoned Saikou. Thank you for sticking with us this long. We appreciate it ❤`);
					break;

				default:
					leaveEmbed.setDescription(`**${member.user.username}** has abandoned Saikou. Goodbye!`);
			}

			bot.channels.cache.get(process.env.JOIN_LEAVES_CHANNEL).send({ embeds: [leaveEmbed] });

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
