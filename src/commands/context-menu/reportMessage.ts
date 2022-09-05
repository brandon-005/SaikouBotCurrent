import { ApplicationCommandType, ContextMenu, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ComponentType, SelectMenuInteraction, Message, TextChannel } from 'discord.js';
import { generateFromMessages } from 'discord-html-transcripts';

import reportData from '../../models/reports';
import { EMBED_COLOURS, PROMPT_TIMEOUT } from '../../utils/constants';

const cooldown = new Set();

const menu: ContextMenu = {
	config: {
		commandName: 'Report Message',
		type: ApplicationCommandType.Message,
	},
	run: async ({ bot, interaction }) => {
		// @ts-ignore
		const selectedMessage = interaction.options.getMessage('message');

		/* IF USER HAS PROMPT OPEN */
		if (cooldown.has(interaction.user.id)) {
			return interaction.followUp({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('🐌 Whoah there! Slow down.')
						.setDescription(`You can only report someone every 60 seconds, please try again later.`)
						.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		const reportedMsgsEmbed = await interaction.followUp({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('Reporting Messages 🔎')
					.setDescription(`How many messages from **${bot.guilds.cache.get(process.env.SERVER_ID)?.members.cache.get(selectedMessage.author.id)?.displayName || selectedMessage.author.username}** would you like to report?`)
					.setColor(EMBED_COLOURS.blurple),
			],
			components: [
				new ActionRowBuilder<SelectMenuBuilder>() // prettier-ignore
					.addComponents([
						new SelectMenuBuilder()
							.setCustomId('reportedMsgs-menu')
							.setPlaceholder('Select the amount of messages to report')
							.addOptions([
								{
									label: 'Last Message',
									value: '1',
									emoji: '🛡️',
								},
								{
									label: 'Last 3 Messages',
									value: '3',
									emoji: '🛡️',
								},
								{
									label: 'Last 5 Messages',
									value: '5',
									emoji: '🛡️',
								},
								{
									label: 'Last 10 Messages',
									value: '10',
									emoji: '🛡️',
								},
							]),
					]),
			],
			ephemeral: true,
		});

		const collector = interaction.channel.createMessageComponentCollector({ filter: (menuInteraction: any) => menuInteraction.user.id === interaction.user.id, componentType: ComponentType.SelectMenu, time: PROMPT_TIMEOUT });

		collector.on('collect', async (selectMenuCollector: SelectMenuInteraction) => {
			const [menuValues] = selectMenuCollector.values;
			const messageCount = parseInt(menuValues);
			const userMessages = await interaction.channel?.messages.fetch();

			const attachment = await generateFromMessages(userMessages.filter((msg: Message) => msg.author.id === selectedMessage.author.id).first(messageCount), interaction.channel, {
				returnType: 'attachment',
				fileName: 'Reported Messages.html',
				minify: true,
				saveImages: false,
				useCDN: true,
			});

			(bot.channels.cache.find((channel: any) => channel.name === '📝report-abuse') as TextChannel)
				.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle(`🛡 New report!`)
							.setDescription(`**Platform:** Discord\n**Reported User:** ${selectedMessage.author.tag}\n**Reason**: Infringing Server Rules`)
							.setThumbnail(interaction.user.displayAvatarURL())
							.setFooter({ text: `Reported by ${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}`, iconURL: interaction.user.displayAvatarURL() })
							.setColor(EMBED_COLOURS.blurple)
							.setTimestamp(),
					],
				})
				.then(async (reportMsg) => {
					await reportData.create({
						messageID: reportMsg.id,
						userID: interaction.user.id,
					});

					reportMsg.channel.send({
						files: [attachment],
					});
				});

			selectMenuCollector.update({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('✅ Success!')
						.setDescription('Your report has been posted in <#675459553122451456>.')
						.setColor(EMBED_COLOURS.green)
						.setTimestamp(),
				],
				components: [],
			});
		});

		collector.on('end', () => {
			reportedMsgsEmbed.edit({ components: [] }).catch(() => {});
		});

		cooldown.add(interaction.user.id);

		setTimeout(() => {
			cooldown.delete(interaction.user.id);
		}, 60000);
	},
};

export = menu;
