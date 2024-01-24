import { Command, EmbedBuilder } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'enablemod',
		commandAliases: ['automod'],
		commandDescription: 'Enable/disable auto moderation filters.',
		developerOnly: true,
		limitedChannel: 'None',
	},
	run: async ({ interaction }) => {
		let failedFilters = '';

		await interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setColor(EMBED_COLOURS.blurple)
					.setTitle('Loading...')
					.setDescription('⏱️ Please wait for the filters to be enabled.'),
			],
		});

		await interaction.guild.autoModerationRules
			.create({
				name: 'SaikouBot - Profanity/NSFW AutoMod',
				eventType: 1,
				triggerType: 4,
				enabled: true,
				reason: 'SaikouBot Auto moderation enabled!',
				exemptRoles: [interaction.guild.roles.cache.find((role) => role.name === 'Staff')],
				triggerMetadata: {
					presets: [1, 2, 3],
				},
				actions: [
					{
						type: 1,
						metadata: {
							channel: '863382746155450378',
							customMessage: 'Infraction: 1.3 - Swearing, bypassing the bot filter in any way, and all NSFW content is strictly forbidden.',
						},
					},
				],
			})
			.catch(async () => {
				failedFilters += '❌ Profanity/NSFW\n';
			});

		await interaction.guild.autoModerationRules
			.create({
				name: 'SaikouBot - Mention Spam',
				eventType: 1,
				triggerType: 5,
				enabled: true,
				reason: 'SaikouBot Auto moderation enabled!',
				exemptRoles: [interaction.guild.roles.cache.find((role) => role.name === 'Staff')],
				triggerMetadata: {
					presets: [3],
					mentionTotalLimit: 4,
				},
				actions: [
					{
						type: 1,
						metadata: {
							channel: '863382746155450378',
							customMessage: 'Infraction: 1.6 - Spam of all kinds (emojis, *pings*, and chats), chat flooding, and text walls are not allowed.',
						},
					},
				],
			})
			.catch(async () => {
				failedFilters += '❌ Mention Spam\n';
			});

		if (failedFilters === '') failedFilters = '✅ None';
		await interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setColor(EMBED_COLOURS.blurple)
					.setTitle('Loaded AutoMod!')
					.setDescription('The auto moderation filters have loaded, view below for failed filters.')
					.addFields({ name: 'Failed:', value: `**${failedFilters}**`, inline: false }),
			],
		});
	},
};

export = command;
