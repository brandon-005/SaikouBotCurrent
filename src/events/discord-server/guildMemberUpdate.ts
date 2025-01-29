import { GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { EMBED_COLOURS, WELCOME_MESSAGES } from '../../utils/constants';
import tokenData from '../../models/weaponTokens';
import { choose } from '../../utils/functions';

export = async (bot: any, oldMember: GuildMember, newMember: GuildMember) => {
	/* Booster Message + Posting Discord nickname in specified channel */
	if (newMember.premiumSinceTimestamp !== oldMember.premiumSinceTimestamp && newMember.roles.cache.find((role) => role.name === 'Server Booster')) {
		(bot.channels.cache.find((channel: any) => channel.name === '💬roblox-topic') as TextChannel).send({
			content: `<@${newMember.id}>`,
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('🎉 Token Received!')
					.setDescription('Thanks for boosting! You have received a weapon token to receive the Military Warfare Tycoon booster weapons.\n\n**🔎 Looking for how to redeem?**\nWhen tokens are awarded, they can be used in conjunction with our </redeem:1016682656123080723> command to receive the in-game perks.')
					.setColor(EMBED_COLOURS.blurple)
					.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-happy.png')
					.setTimestamp(),
			],
		});

		const tokensUser = await tokenData.findOne({ userID: newMember.id });

		if (!tokensUser) {
			return tokenData.create({
				userID: newMember.id,
				tokens: 1,
			});
		}

		tokensUser.tokens += 1;
		return tokensUser.save();
	}

	if (newMember.roles.cache.find((role) => role.name === 'Follower')) {
			bot.channels.cache.get(process.env.JOIN_LEAVES_CHANNEL).send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('👋 Welcome to the **Saikou Discord**!')
						.setDescription(`**${newMember.nickname ? newMember.user.username : newMember.nickname}** ${choose(WELCOME_MESSAGES)}`)
						.setColor(EMBED_COLOURS.green)
						.setThumbnail(oldMember.displayAvatarURL({ extension: 'webp' }))
						.setFooter({ text: 'User joined' })
						.setTimestamp()
				],
			});
	}
};
