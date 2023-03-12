import { Client, Role, EmbedBuilder, TextChannel, InteractionType, Interaction, GuildMember, Embed, ActionRowBuilder, ModalBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType, ButtonInteraction } from 'discord.js';

import { EMBED_COLOURS, PROMPT_TIMEOUT } from '../../utils/constants';
import axios from 'axios';

export = async (bot: Client, interaction: Interaction) => {
	if (interaction.isButton()) {
		/* Ping Role buttons */
		switch (interaction.customId) {
			case 'GetRole':
				if ((interaction.member as GuildMember).roles.cache.some((role: Role) => role.name === 'Ping')) {
					return interaction.reply({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setDescription('❌ You already have the **Ping** role.')
								.setColor(EMBED_COLOURS.red),
						],
						ephemeral: true,
					});
				}

				(interaction.member as GuildMember).roles.add(interaction.guild!.roles.cache.find((role: Role) => role.name === 'Ping')!);

				return interaction.reply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setDescription('✅ You were given the **Ping** role.')
							.setColor(EMBED_COLOURS.green),
					],
					ephemeral: true,
				});

			case 'RemoveRole':
				if (!(interaction.member as GuildMember).roles.cache.some((role: Role) => role.name === 'Ping')) {
					return interaction.reply({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setDescription(`❌ You don't have the **Ping** role.`)
								.setColor(EMBED_COLOURS.red),
						],
						ephemeral: true,
					});
				}

				(interaction.member as GuildMember).roles.remove(interaction.guild!.roles.cache.find((role: Role) => role.name === 'Ping')!);

				return interaction.reply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setDescription('✅ You were removed from the **Ping** role.')
							.setColor(EMBED_COLOURS.green),
					],
					ephemeral: true,
				});

			case 'receivedNotice':
				interaction.update({ components: [] });
				interaction.channel.send({ content: 'Thank you, your acknowledgement of this notice has been recorded!' });

				bot.guilds.cache
					.get(`${process.env.SERVER_ID}`)
					?.channels.cache.get(`${process.env.CLASSIFIED_CHANNEL}`)!
					// @ts-ignore
					.send({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('Notice Received! 📮')
								.setDescription(`${interaction.user.username} has acknowledged their punishment notice.`)
								.setColor(EMBED_COLOURS.green),
						],
					});

				break;

			case 'VerifyAccount':
				/* USERNAME PROMPT */
				await interaction.reply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('[1/2] Roblox Username 🔎')
							.setDescription('Your Roblox username is used to identify who you are in the server. Please click the button below to submit your username.')
							.setColor(EMBED_COLOURS.blurple),
					],
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents([
							new ButtonBuilder() // prettier-ignore
								.setLabel('Submit Username 📝')
								.setStyle(ButtonStyle.Primary)
								.setCustomId('submitUser'),
						]),
					],
					ephemeral: true,
				});

				const buttonCollector = interaction.channel.createMessageComponentCollector({ filter: (msgFilter: Interaction) => msgFilter.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

				buttonCollector.on('collect', async (button: ButtonInteraction) => {
					if (button.customId === 'submitUser') {
						const modal = new ModalBuilder().setCustomId('verify-form').setTitle('Saikou Verification');

						modal.addComponents([
							new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
								new TextInputBuilder() // prettier-ignore
									.setCustomId('username')
									.setMinLength(5)
									.setMaxLength(50)
									.setPlaceholder('Roblox Username')
									.setLabel('What is your Roblox username?')
									.setStyle(TextInputStyle.Short)]), // prettier-ignore
						]);

						await button.showModal(modal);

						const formResponse = await button.awaitModalSubmit({ time: PROMPT_TIMEOUT, filter: (menuUser) => menuUser.user.id === interaction.user.id }).catch(() => null);

						if (formResponse === null) {
							return buttonCollector.stop();
						}

						/* CHECKING ROBLOX USERNAME */
						const username = formResponse.fields.getTextInputValue('username');
						let robloxName = '';
						let robloxID = '';
						let invalidUser = false;

						await axios({
							method: 'post',
							url: 'https://users.roblox.com/v1/usernames/users',
							data: {
								usernames: [username],
							},
						})
							.then((response: any) => {
								robloxName = response.data.data.map((value: any) => value.name);
								robloxID = response.data.data.map((value: any) => value.id);
								if (response.data.data.length === 0) invalidUser = true;
							})
							.catch(() => {});

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

							return buttonCollector.stop();
						}

						/* UPDATE STATUS PROMPT */
						const phrase = 'apple tomato orange blue ocean';

						await formResponse.update({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('[2/2] Update About Me! 🔗')
									.setDescription(`Thanks **${robloxName}!**\n\nYou're almost there! Please update your about me to include the following words/phrases:\n\`${phrase}\`\n\nOnce complete, click the button below to finalise the verification.`)
									.setColor(EMBED_COLOURS.blurple),
							],
							components: [
								new ActionRowBuilder<ButtonBuilder>().addComponents([
									new ButtonBuilder() // prettier-ignore
										.setLabel('🔗 Complete')
										.setStyle(ButtonStyle.Primary)
										.setCustomId('completeVerification'),

									new ButtonBuilder() // prettier-ignore
										.setLabel('👋 Exit')
										.setStyle(ButtonStyle.Danger)
										.setCustomId('exitPrompt'),
								]),
							],
						});

						const finalButtonCollector = interaction.channel.createMessageComponentCollector({ filter: (msgFilter: Interaction) => msgFilter.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

						finalButtonCollector.on('collect', async (finalButton: ButtonInteraction) => {
							switch (finalButton.customId) {
								case 'exitPrompt':
									finalButton.update({
										embeds: [
											new EmbedBuilder() // prettier-ignore
												.setTitle('✅ Cancelled!')
												.setDescription('The prompt has been cancelled successfully.')
												.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-success.png')
												.setColor(EMBED_COLOURS.green),
										],
										components: [],
									});
									buttonCollector.stop();
									return finalButtonCollector.stop();

								case 'completeVerification':
									const followerRole = await axios.get(`https://groups.roblox.com/v2/users/${robloxID}/groups/roles`).then((response: any) => {
										if (response.data.data.length === 1 && response.data.data.map((groupData: any) => groupData.group.name).toString() === 'Saikou') {
											return response.data.data.map((groupRole: any) => groupRole.role.name)[0];
										}

										for (const groupInfo of response.data.data) {
											if (groupInfo.group.name.toString() === 'Saikou') {
												return groupInfo.role.name;
											}
										}

										return null;
									});

									console.log(followerRole);

									const aboutMe = await axios.get(`https://users.roblox.com/v1/users/${robloxID}`).then((response: any) => response.data.description);

									//console.log(aboutMe);
									break;
							}
						});
					}
				});

				/* Checking if user provided is a valid Roblox player */
				// if (String(platform) !== 'Discord' && String(platform) !== 'Other') {
				// 	let invalidUser = false;
				// 	await axios({
				// 		method: 'post',
				// 		url: 'https://users.roblox.com/v1/usernames/users',
				// 		data: {
				// 			usernames: [username],
				// 		},
				// 	})
				// 		.then((response: any) => {
				// 			robloxDisplayName = response.data.data.map((value: any) => value.displayName);
				// 			robloxID = response.data.data.map((value: any) => value.id);
				// 			if (response.data.data.length === 0) invalidUser = true;
				// 		})
				// 		.catch((error) => {
				// 			console.error(error);
				// 		});

				// 	if (invalidUser !== false) {
				// 		formResponse.update({
				// 			embeds: [
				// 				new EmbedBuilder() // prettier-ignore
				// 					.setTitle('Unable to find Roblox User! 🔎')
				// 					.setDescription("Please ensure you're providing a valid Roblox player to proceed.")
				// 					.setColor(EMBED_COLOURS.red)
				// 					.setTimestamp(),
				// 			],
				// 			components: [],
				// 		});

				// 		openPrompt.delete(interaction.user.id);
				// 		menuCollector.stop();
				// 		return detailsCollector.stop();
				// 	}
				// }

				break;

			default:
				break;
		}
	}

	/* HANDLING MODALS */
	if (interaction.type === InteractionType.ModalSubmit) {
		if (interaction.customId === 'intro-form') {
			const aboutMe = interaction.fields.getTextInputValue('aboutMe');
			const hobbies = interaction.fields.getTextInputValue('hobbiesInput');
			const colour = interaction.fields.getTextInputValue('colourInput');

			const introMessage = (bot.channels.cache.find((channel: any) => channel.name === '👋introductions') as TextChannel).send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle(`👋 ${bot.guilds.cache.get(process.env.SERVER_ID)?.members.cache.get(interaction.user.id)?.displayName || interaction.user.username}'s Introduction!`)
						.addFields([
							{ name: 'About Myself', value: aboutMe }, // prettier-ignore
							{ name: 'My Hobbies', value: hobbies },
							{ name: 'My Favourite Colour', value: colour },
						])
						.setThumbnail(interaction.user.avatarURL())
						.setFooter({ text: `${interaction.user.tag} (${interaction.user.id})`, iconURL: interaction.user.avatarURL() })
						.setColor(EMBED_COLOURS.blurple),
				],
			});

			(await introMessage).react('👋');

			// @ts-ignore
			interaction.update({
				components: [],
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('✅ Introduction Posted!')
						.setDescription('Your introduction has been posted in <#984067335038054451>.')
						.setColor(EMBED_COLOURS.green)
						.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-success.png'),
				],
			});
		}
	}
};
