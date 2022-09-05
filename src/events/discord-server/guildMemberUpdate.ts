import { GuildMember, TextChannel } from 'discord.js';
import tokenData from '../../models/weaponTokens';

export = async (bot: any, oldMember: GuildMember, newMember: GuildMember) => {
	/* Booster Message + Posting Discord nickname in specified channel */
	if (!oldMember.premiumSince && newMember.premiumSince) {
		(bot.channels.cache.find((channel: any) => channel.name === '💬roblox-topic') as TextChannel).send({ content: `Thanks for the boost, <@!${newMember.id}>! You have received a weapon token, you can use this with our \`/redeem\` command to receive the Military Warfare Tycoon booster weapons.` });

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
};
