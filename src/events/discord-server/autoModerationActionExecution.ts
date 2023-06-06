import { AutoModerationActionExecution, EmbedBuilder, TextChannel } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';
import { autoPunish, punishmentLevel } from '../../utils/functions';
import warnings from '../../models/warnings';

export = async (bot: any, data: AutoModerationActionExecution) => {
	const warnInfo = await warnings.findOne({ userID: data.user.id });
	const modAction = await punishmentLevel(warnInfo);
	let autoModEmbedReason = '';

	switch (data.ruleTriggerType) {
		case 4:
			autoModEmbedReason = 'PROFANITY/SEXUAL';
			await autoPunish(data, '`1.3` - Swearing, bypassing the bot filter in any way, and all NSFW content is strictly forbidden.', 'PROFANITY/SEXUAL', bot);
			break;
		case 5:
			autoModEmbedReason = 'MASS_MENTION';
			await autoPunish(data, '`1.6` - Spam of all kinds (emojis, *pings*, and chats), chat flooding, and text walls are not allowed.', 'MASS_MENTION', bot);
	}

	/* Sending AutoMod Log */
	bot.channels.cache
		.find((channel: TextChannel) => channel.name === '🤖auto-mod')
		.send({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setAuthor({ name: 'Saikou Discord | Auto Moderation', iconURL: bot.user.displayAvatarURL() })
					.setDescription(`**A message by <@${data.userId}> has been blocked <t:${parseInt(String(Date.now() / 1000))}:R> in <#${data.channelId}>**.`)
					.addFields([
						{ name: 'Triggered Content', value: `${data.content}` },
						{ name: 'Action', value: `${modAction}` },
					])
					.setFooter({ text: `${autoModEmbedReason} • User ID: ${data.user.id}` })
					.setColor(EMBED_COLOURS.red),
			],
		});
};
