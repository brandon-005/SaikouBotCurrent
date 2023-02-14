import { Command, Message, ActionRowBuilder, StringSelectMenuBuilder, Interaction, ComponentType, StringSelectMenuInteraction, ButtonStyle, ButtonBuilder, EmbedBuilder, ButtonInteraction, ModalBuilder, TextInputBuilder, ModalActionRowComponentBuilder, TextInputStyle, MessageCollector, AttachmentBuilder } from 'discord.js';
import urlRegex from 'url-regex';

import { EMBED_COLOURS, PROMPT_TIMEOUT, MESSAGE_TIMEOUT, VIDEO_FILE_TYPES } from '../../utils/constants';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'bugreport',
		commandAliases: ['bug', 'reportbug'],
		commandDescription: "Use this command to report bugs regarding Saikou's games or bots to the developers.",
		limitedChannel: 'bug-reports',
	},
	run: async ({ interaction }) => {
		let sentMenu: Message;

		/* IF USER HAS PROMPT OPEN */
		if (openPrompt.has(interaction.user.id))
			return interaction
				.editReply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('🗃️ Prompt already open!')
							.setDescription('You already have a report open, please either finish/cancel and try again!')
							.setColor(EMBED_COLOURS.red)
							.setFooter({ text: 'Already open prompt' }),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));

		openPrompt.add(interaction.user.id);

		try {
			sentMenu = await interaction.user.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('[1/3] Select Platform 🔎')
						.setDescription('Please select the platform the bug occurred on below.')
						.setColor(EMBED_COLOURS.blurple),
				],
				components: [
					new ActionRowBuilder<StringSelectMenuBuilder>() // prettier-ignore
						.addComponents([
							new StringSelectMenuBuilder()
								.setCustomId('platform-menu')
								.setPlaceholder('Please select a platform')
								.addOptions([
									{
										label: 'Military Warfare Tycoon',
										value: 'Military Warfare Tycoon',
										emoji: '🔫',
									},
									{
										label: 'Discord',
										value: 'Discord',
										emoji: '💬',
									},
									{
										label: 'Killstreak',
										value: 'Killstreak',
										emoji: '⚔️',
									},
								]),
						]),
				],
			});
		} catch (err) {
			openPrompt.delete(interaction.user.id);
			return interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('❌ Unable to DM!')
						.setDescription("Please ensure your DM's are enabled in order for the bot to message you the prompt.")
						.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		/* DM Sent Embed */
		await interaction
			.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription(`📬 A message has been sent to your DM's <@${interaction.user.id}>`)
						.setColor(EMBED_COLOURS.green),
				],
			})
			.then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT))
			.catch(() => {});

		/* Menu Collector */
		const dmChannel = await interaction.user.createDM();
		const menuCollector = dmChannel.createMessageComponentCollector({ filter: (msgInteraction: Interaction) => msgInteraction.user.id === interaction.user.id, componentType: ComponentType.StringSelect, time: PROMPT_TIMEOUT });

		menuCollector.on('collect', (selectMenu: StringSelectMenuInteraction) => {
			const platform = selectMenu.values;

			selectMenu.update({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('[2/3] Additional Details 🕵️')
						.setDescription('We need to know some more information regarding this bug before submitting.')
						.setColor(EMBED_COLOURS.blurple),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						// prettier-ignore
						new ButtonBuilder().setLabel('Begin Details 📑').setStyle(ButtonStyle.Primary).setCustomId('details-menu'),
						new ButtonBuilder().setLabel('Exit Prompt 👋').setStyle(ButtonStyle.Danger).setCustomId('exit'),
					]),
				],
			});

			const detailsCollector = dmChannel.createMessageComponentCollector({ filter: (msgFilter: Interaction) => msgFilter.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

			detailsCollector.on('collect', async (button: ButtonInteraction) => {
				switch (button.customId) {
					case 'exit':
						button.update({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('✅ Cancelled!')
									.setDescription('The prompt has been cancelled successfully.')
									.setThumbnail('https://i.ibb.co/kxJqM6F/mascot-Success.png')
									.setColor(EMBED_COLOURS.green),
							],
							components: [],
						});

						openPrompt.delete(interaction.user.id);
						menuCollector.stop();
						detailsCollector.stop();
						break;

					case 'details-menu':
						const modal = new ModalBuilder().setCustomId('report-form').setTitle('Saikou Report 🛡️');

						modal.addComponents([
							new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
								new TextInputBuilder() // prettier-ignore
									.setCustomId('title')
									.setMinLength(10)
									.setMaxLength(50)
									.setPlaceholder('Ex: Jeep failing to drive ')
									.setLabel('Title you would like to provide for this bug?')
									.setStyle(TextInputStyle.Short)]), // prettier-ignore

							new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
								new TextInputBuilder() // prettier-ignore
									.setCustomId('description')
									.setPlaceholder('Steps to reproduce, details etc')
									.setLabel('Please include more details for this bug')
									.setStyle(TextInputStyle.Paragraph),
							]),
						]);

						await button.showModal(modal);

						const formResponse = await button.awaitModalSubmit({ time: PROMPT_TIMEOUT, filter: (menuUser) => menuUser.user.id === interaction.user.id }).catch(() => null);

						if (formResponse === null) {
							openPrompt.delete(interaction.user.id);
							menuCollector.stop();
							return detailsCollector.stop();
						}

						const title = formResponse.fields.getTextInputValue('title');
						const description = formResponse.fields.getTextInputValue('description');

						await formResponse.update({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('[3/3] Evidence 🧾')
									.setDescription('Please input a video/photo of the bug in action.\n\nSay **done** once complete to submit your report.')
									.setColor(EMBED_COLOURS.blurple)
									.setFooter({ text: 'Input cancel to exit the prompt.' }),
							],
							components: [],
						});

						/* Gathering Attachments */
						const attachmentCollector: MessageCollector = dmChannel.createMessageCollector({ filter: (msg: Message) => msg.author.id === interaction.user.id, idle: PROMPT_TIMEOUT, max: 10 });
						const fetchedAttachments: any = [];

						attachmentCollector.on('collect', (collectedMsg: Message): any => {
							/* Cancelling */
							if (collectedMsg.content.toLowerCase() === 'cancel') {
								interaction.user.send({
									embeds: [
										new EmbedBuilder() // prettier-ignore
											.setTitle('✅ Cancelled!')
											.setDescription('The prompt has been cancelled successfully.')
											.setThumbnail('https://i.ibb.co/kxJqM6F/mascot-Success.png')
											.setColor(EMBED_COLOURS.green),
									],
								});

								openPrompt.delete(interaction.user.id);
								menuCollector.stop();
								detailsCollector.stop();
								return attachmentCollector.stop('Prompt Cancelled');
							}

							if (collectedMsg.content.toLowerCase() === 'done' && !fetchedAttachments.length) {
								return interaction.user.send({
									embeds: [
										new EmbedBuilder() // prettier-ignore
											.setTitle('📎 Provide Attachment!')
											.setDescription('You must provide at least **one** attachment or link before submitting this report.')
											.setColor(EMBED_COLOURS.red)
											.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png'),
									],
								});
							}

							if (collectedMsg.attachments.size > 5 || fetchedAttachments.length === 5) {
								return interaction.user.send({
									embeds: [
										new EmbedBuilder() // prettier-ignore
											.setTitle('🗃️ Maximum Uploads!')
											.setDescription("You have reached the maximum upload limit for this report (5 attachments).\n\n**🔎 Looking where to go next?**\nYou'll need to either `cancel` this report to upload different attachments, or say `done` to submit.")
											.setColor(EMBED_COLOURS.red)
											.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png'),
									],
								});
							}

							if (collectedMsg.content.toLowerCase() === 'done') return attachmentCollector.stop();

							if (collectedMsg.attachments.size > 0) {
								collectedMsg.attachments.forEach((attachment) => {
									fetchedAttachments.push({ content: collectedMsg.content ? collectedMsg.content : '', url: attachment.url });
								});
							}

							/* LINK DETECTION */
							if (urlRegex({ exact: true }).test(collectedMsg.content) === true) {
								fetchedAttachments.push({ linkContent: collectedMsg.content });
							}

							if (collectedMsg.attachments.size === 0 && urlRegex({ exact: true }).test(collectedMsg.content) === false) {
								return interaction.user.send('Please input a link, photo or video of the bug. If this is incorrect, please inform us!');
							}
						});

						// @ts-ignore
						attachmentCollector.on('end', async (_collected: any, response: any) => {
							if (response === 'Prompt Cancelled') return;
							if (response === 'idle') {
								return openPrompt.delete(interaction.user.id);
							}

							interaction.user.send({
								embeds: [
									new EmbedBuilder() // prettier-ignore
										.setTitle('✅ Success!')
										.setDescription('Your bug report has been posted.')
										.setColor(EMBED_COLOURS.green)
										.setTimestamp(),
								],
							});

							interaction.channel.send({
								embeds: [
									new EmbedBuilder() // prettier-ignore
										.setTitle(`🐛 Bug Reported!`)
										.setDescription(`**Platform:** ${platform}\n\n__**${title}**__\n${description}`)
										.setThumbnail(interaction.user.displayAvatarURL())
										.setFooter({ text: `Bug Report by ${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}`, iconURL: interaction.user.displayAvatarURL() })
										.setColor(EMBED_COLOURS.blurple)
										.setTimestamp(),
								],
							});

							fetchedAttachments.forEach(async (attachment: any) => {
								const attachmentEmbed = new EmbedBuilder() // prettier-ignore
									.setImage(attachment.url)
									.setColor(EMBED_COLOURS.blurple)
									.setFooter({ text: `Bug report by ${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}`, iconURL: interaction.user.displayAvatarURL() });

								if (attachment.content !== '') attachmentEmbed.setTitle(String(attachment.content));

								/* POSTING LINKS */
								if (attachment.linkContent)
									return interaction.channel.send({
										embeds: [
											new EmbedBuilder() // prettier-ignore
												.setDescription(attachment.linkContent)
												.setColor(EMBED_COLOURS.blurple),
										],
									});

								/* IF VIDEO POST WITHOUT EMBED */
								for (const fileType of VIDEO_FILE_TYPES) {
									if (attachment.url.includes(fileType)) {
										if (attachment.content !== '') return interaction.channel.send({ content: attachment.content, files: [new AttachmentBuilder(attachment.url)] });
										return interaction.channel.send({ files: [new AttachmentBuilder(attachment.url)] });
									}
								}

								/* POST IMAGE */
								interaction.channel.send({ embeds: [attachmentEmbed] });
							});

							openPrompt.delete(interaction.user.id);
							detailsCollector.stop();
							menuCollector.stop();
						});

						break;
				}
			});
		});

		/* Handling when collectors end */
		menuCollector.on('end', () => {
			sentMenu.edit({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('❌ Cancelled!')
						.setDescription("You didn't input in time, please try again.")
						.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
						.setColor(EMBED_COLOURS.red),
				],
				components: [],
			});
			openPrompt.delete(interaction.user.id);
		});
	},
};

export = command;
