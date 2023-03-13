import { GuildMember, EmbedBuilder } from 'discord.js';
import moment from 'moment';

import { WELCOME_MESSAGES, EMBED_COLOURS } from '../../utils/constants';
import { choose } from '../../utils/functions';
import verifiedUser from '../../models/verifiedUser';

export = async (bot: any, member: GuildMember) => {
	const activeVerification = await verifiedUser.findOne({ userID: member.user.id });

	if (activeVerification) {
		/* Setting Roblox nickname */
		member.setNickname(activeVerification.robloxName).catch(() => {});

		/* Giving Follower roles */
		if (activeVerification.roleName !== 'Follower') {
			await member.roles.add(member.guild.roles.cache.find((discordRole) => discordRole.name === 'Follower')).catch(() => {});
		}
		await member.roles.add(member.guild.roles.cache.find((discordRole) => discordRole.name === activeVerification.roleName)).catch(() => {});

		member.send({ content: `👋 Welcome to **Saikou**, ${activeVerification.robloxName}! Your roles and username have been updated successfully.` });
	} else {
		member.send({ content: `Hey **${member.user.username}!** 👋\n\nThanks for joining Saikou! In order to receive access to the entire server, you'll need to verify your Roblox account with your Discord account.\n\nFor instructions on how to do this with SaikouBot, you can follow our tutorial in the <#700757354697719915> channel.\n\nWe hope you enjoy your stay with us!` }).catch(() => {});
	}

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
