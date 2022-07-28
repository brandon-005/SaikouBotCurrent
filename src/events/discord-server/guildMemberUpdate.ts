import { GuildMember } from 'discord.js';

export = async (bot: any, oldMember: GuildMember, newMember: GuildMember) => {
	/* Booster Message + Posting Discord nickname in specified channel */
	if (!oldMember.premiumSince && newMember.premiumSince) {
		bot.channels.cache.get('397791696315875333').send({ content: `Thanks for the boost, <@!${newMember.id}>! Our team has been notified and will give you the weapons soon; please allow up to 12 hours to receive them. We appreciate your support!` });
		return bot.channels.cache.get('773631885086556160').send({ content: `<@&818161643531796501>, <@&397792959766069249>\n__**New Boost!**__\nMention: <@!${newMember.id}>\n\`:boost ${newMember.displayName}\`` });
	}
};
