import { Command, Message, ActionRowBuilder, StringSelectMenuBuilder, Interaction, ComponentType, StringSelectMenuInteraction, ButtonStyle, ButtonBuilder, EmbedBuilder, ButtonInteraction, ModalBuilder, TextInputBuilder, ModalActionRowComponentBuilder, TextInputStyle, MessageCollector, AttachmentBuilder } from 'discord.js';
import axios from 'axios';
import urlRegex from 'url-regex-safe';

import { EMBED_COLOURS, PROMPT_TIMEOUT, MESSAGE_TIMEOUT, VIDEO_FILE_TYPES } from '../../utils/constants';
import reportData from '../../models/reports';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'report',
		commandAliases: ['userreport', 'playerreport'],
		commandDescription: "Report players who are in breach of Saikou's rules through this command, make sure you grab some proof to go with it!",
		limitedChannel: 'report-abuse',
	},
	run: async ({ interaction }) => {
		let sentMenu: Message;
		let robloxDisplayName = '';
		let robloxID = '';

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
						.setDescription('Please select the platform the offence occurred on below.')
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
										label: 'Saikou Group',
										value: 'Saikou Group',
										emoji: '🏟️',
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
			return interaction
				.editReply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('❌ Unable to DM!')
							.setDescription("Please ensure your DM's are enabled in order for the bot to message you the prompt.")
							.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
							.setColor(EMBED_COLOURS.red),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
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
						.setDescription('Ensure you have the correct name and reason before proceeding!')
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
									.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-success.png')
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
									.setCustomId('username')
									.setMinLength(5)
									.setMaxLength(50)
									.setPlaceholder('Username')
									.setLabel('What is the username of the offender?')
									.setStyle(TextInputStyle.Short)]), // prettier-ignore

							new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
								new TextInputBuilder() // prettier-ignore
									.setCustomId('reason')
									.setMaxLength(200)
									.setPlaceholder('Reason')
									.setLabel('Why are you reporting this user?')
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

						const username = formResponse.fields.getTextInputValue('username');
						const reason = formResponse.fields.getTextInputValue('reason');

						/* Checking if user provided is a valid Roblox player */
						if (String(platform) !== 'Discord' && String(platform) !== 'Other') {
							let invalidUser = false;
							await axios({
								method: 'post',
								url: 'https://users.roblox.com/v1/usernames/users',
								data: {
									usernames: [username],
								},
							})
								.then((response: any) => {
									robloxDisplayName = response.data.data.map((value: any) => value.displayName);
									robloxID = response.data.data.map((value: any) => value.id);
									if (response.data.data.length === 0) invalidUser = true;
								})
								.catch((error) => {
									console.error(error);
								});

							if (invalidUser !== false) {
								formResponse.update({
									embeds: [
										new EmbedBuilder() // prettier-ignore
											.setTitle('Unable to find Roblox User! 🔎')
											.setDescription("Please ensure you're providing a valid Roblox player to proceed.")
											.setColor(EMBED_COLOURS.red)
											.setTimestamp(),
									],
									components: [],
								});

								openPrompt.delete(interaction.user.id);
								menuCollector.stop();
								return detailsCollector.stop();
							}
						}

						await formResponse.update({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('[3/3] Evidence 🧾')
									.setDescription('Please input a video/photo of the offence in action.\n\nSay **done** once complete to submit your report.')
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
											.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-success.png')
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
											.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png'),
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
											.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png'),
									],
								});
							}

							if (collectedMsg.content.toLowerCase() === 'done') return attachmentCollector.stop();

							if (collectedMsg.attachments.size > 0) {
								collectedMsg.attachments.forEach((attachment) => {
									if (attachment.size >= 100000000) {
										interaction.user.send({
											embeds: [
												new EmbedBuilder() // prettier-ignore
													.setTitle('🗃️ Maximum File Size!')
													.setDescription("You are posting files that are too large for SaikouBot to re-upload.\n\n**🔎 Looking where to go next?**\nYou'll need to submit files that are below 100MB in order for them to be posted.")
													.setColor(EMBED_COLOURS.red)
													.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png'),
											],
										});
									} else {
										fetchedAttachments.push({ content: collectedMsg.content ? collectedMsg.content : '', url: attachment.url });
									}
								});
							}

							/* LINK DETECTION */
							if (urlRegex({ exact: true }).test(collectedMsg.content) === true) {
								fetchedAttachments.push({ linkContent: collectedMsg.content });
							}

							if (collectedMsg.attachments.size === 0 && urlRegex({ exact: true }).test(collectedMsg.content) === false) {
								return interaction.user.send('Please input a link, photo or video of the offence. If this is incorrect, please inform us!');
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
										.setDescription('Your report has been posted.')
										.setColor(EMBED_COLOURS.green)
										.setTimestamp(),
								],
							});

							const embed = new EmbedBuilder() // prettier-ignore
								.setTitle(`🛡 New report!`)
								.setDescription(`**Platform:** ${platform}\n**Reported User:** ${username}\n**Reason**: ${reason}`)
								.setThumbnail(interaction.user.displayAvatarURL())
								.setFooter({ text: `Reported by ${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}`, iconURL: interaction.user.displayAvatarURL() })
								.setColor(EMBED_COLOURS.blurple)
								.setTimestamp();

							if (robloxDisplayName !== '') embed.setDescription(`**Platform:** ${platform}\n**Reported User:** [${username}](https://www.roblox.com/users/${robloxID}/profile) [${robloxDisplayName}]\n**Reason**: ${reason}`);

							const reportEmbed = await interaction.channel.send({ embeds: [embed] });

							await reportData.create({
								messageID: reportEmbed.id,
								userID: interaction.user.id,
							});

							fetchedAttachments.forEach(async (attachment: any) => {
								const attachmentEmbed = new EmbedBuilder() // prettier-ignore
									.setImage(attachment.url)
									.setColor(EMBED_COLOURS.blurple)
									.setFooter({ text: `Reported by ${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}`, iconURL: interaction.user.displayAvatarURL() });

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
						.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
						.setColor(EMBED_COLOURS.red),
				],
				components: [],
			});
			openPrompt.delete(interaction.user.id);
		});
	},
};

export = command;
