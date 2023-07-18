import { Client, Role, EmbedBuilder, TextChannel, InteractionType, Interaction, GuildMember, ActionRowBuilder, ModalBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType, ButtonInteraction, WebhookClient } from 'discord.js';
import axios from 'axios';

import { EMBED_COLOURS, PROMPT_TIMEOUT, VERIFICATION_PHRASES, WELCOME_MESSAGES } from '../../utils/constants';
import verifiedUser from '../../models/verifiedUser';
import { checkAboutMe, checkFollowerRoles, choose, fetchRobloxUser } from '../../utils/functions';
import moment from 'moment';

const webhookClient: WebhookClient = new WebhookClient({ id: `1084843431454576726`, token: 'v6U2CuOFklrEIrSJgD_roQmZU0hehvv3s7pqmhGVDADOJDFGIaOjmgwVy-YYDBpTlUR5' });

const openPrompt = new Set();

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
				const activeVerification = await verifiedUser.findOne({ userID: interaction.user.id });
				const phrase = choose(VERIFICATION_PHRASES);

				const outOfTimeEmbed = new EmbedBuilder() // prettier-ignore
					.setTitle('⏱ Out of time!')
					.setDescription('You ran out of time to input the prompt response, please re-run the command and answer within a timely manner.')
					.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
					.setColor(EMBED_COLOURS.red);

				const apiErrorEmbed = new EmbedBuilder() // prettier-ignore
					.setTitle('❌ API Error!')
					.setDescription('Uh oh! Looks like the Roblox API is currently down, please try re-running the prompt later.')
					.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
					.setColor(EMBED_COLOURS.red);

				/* IF USER IS ALREADY VERIFIED */
				if (activeVerification) {
					const member = interaction.guild.members.cache.get(interaction.user.id);

					/* Setting Roblox nickname */
					member.setNickname(activeVerification.robloxName).catch(() => {});

					/* Giving Follower roles */
					if (activeVerification.roleName !== 'Follower') {
						await member.roles.add(interaction.guild.roles.cache.find((discordRole) => discordRole.name === 'Follower')).catch(() => {});
					}
					await member.roles.add(interaction.guild.roles.cache.find((discordRole) => discordRole.name === activeVerification.roleName)).catch(() => {});

					return interaction.reply({ content: `👋 Welcome to **Saikou**, ${activeVerification.robloxName}! Your roles and username have been updated successfully.`, ephemeral: true });
				}

				/* IF USER HAS PROMPT OPEN */
				if (openPrompt.has(interaction.user.id)) {
					webhookClient.send({ content: `**${interaction.user.username}** failed the verification - Open Prompt` });

					return interaction.reply({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('🗃️ Open Prompt!')
								.setDescription('You already have a verification prompt open, please either finish/cancel and try again! If you have dismissed the message, you will need to wait a maximum of:\n\n• Username Prompt - 20 Seconds\n• About Me Prompt - 5 Minutes')
								.setColor(EMBED_COLOURS.red),
						],
						ephemeral: true,
					});
				}

				openPrompt.add(interaction.user.id);

				/* USERNAME PROMPT */
				await interaction.reply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('[1/2] Roblox Username 🔎')
							.setDescription('Your Roblox username is used to identify who you are in the server. Please click the button below to submit your username.')
							.setColor(EMBED_COLOURS.blurple),
					],
					components: [new ActionRowBuilder<ButtonBuilder>().addComponents([new ButtonBuilder().setLabel('Submit Username 📝').setStyle(ButtonStyle.Primary).setCustomId('submitUser')])],
					ephemeral: true,
				});

				const usernameCollector = interaction.channel.createMessageComponentCollector({ filter: (msgFilter: Interaction) => msgFilter.user.id === interaction.user.id, componentType: ComponentType.Button, time: 20000 });

				usernameCollector.on('collect', async (clickedButton: ButtonInteraction) => {
					if (clickedButton.customId === 'submitUser') {
						const modal = new ModalBuilder().setCustomId('verify-form').setTitle('Saikou Verification');

						modal.addComponents([
							new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
								new TextInputBuilder() // prettier-ignore
									.setCustomId('username')
									.setMinLength(3)
									.setMaxLength(20)
									.setPlaceholder('Roblox Username')
									.setLabel('What is your Roblox username?')
									.setStyle(TextInputStyle.Short)]), // prettier-ignore
						]);

						await clickedButton.showModal(modal);

						/* LISTENING FOR FORM RESPONSE */
						const formResponse: any = await clickedButton.awaitModalSubmit({ time: 60000, filter: (menuUser) => menuUser.user.id === interaction.user.id }).catch(() => {
							webhookClient.send({ content: `**${interaction.user.username}** failed the verification - Username Form Timeout` });
							clickedButton.editReply({ embeds: [outOfTimeEmbed], components: [] });
							openPrompt.delete(interaction.user.id);
							usernameCollector.stop();
							return;
						});

						if (!formResponse) return;

						const robloxUser = await fetchRobloxUser(formResponse.fields.getTextInputValue('username'));

						/* IF PLAYER IS INVALID */
						if (robloxUser.invalid === true) {
							webhookClient.send({ content: `**${interaction.user.username}** failed the verification - Invalid Roblox Username` });
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
							usernameCollector.stop();
							return;
						}

						/* IF ROBLOX API ERROR */
						if (robloxUser.error === true) {
							webhookClient.send({ content: `**${interaction.user.username}** failed the verification - Roblox API Error` });
							formResponse.update({ embeds: [apiErrorEmbed], components: [] });
							openPrompt.delete(interaction.user.id);
							usernameCollector.stop();
							return;
						}

						/* IF USER IS ALREADY VERIFIED */
						if (await verifiedUser.findOne({ robloxID: robloxUser.robloxID })) {
							webhookClient.send({ content: `**${interaction.user.username}** failed the verification - Already Linked Account` });
							formResponse.update({
								embeds: [
									new EmbedBuilder() // prettier-ignore
										.setTitle('Already Linked! 🔗')
										.setDescription('This account is aleady linked to a Discord user, you must change accounts or remove it before proceeding.')
										.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
										.setColor(EMBED_COLOURS.red),
								],
								components: [],
							});
							openPrompt.delete(interaction.user.id);
							usernameCollector.stop();
							return;
						}

						/* UPDATING ABOUT ME */
						await formResponse.update({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('[2/2] Update Roblox About Me! 🔗')
									.setDescription(`Thanks **${robloxUser.robloxName}!**\n\nYou're almost there! Please update your [Roblox About Me](https://www.roblox.com/users/${robloxUser.robloxID}/profile) to include the following words/phrases:\n\`${phrase}\`\n\nOnce complete, click the button below to finalise the verification.`)
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

						const aboutMeCollector = interaction.channel.createMessageComponentCollector({ filter: (msgFilter: Interaction) => msgFilter.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

						aboutMeCollector.on('collect', async (buttonResponse: ButtonInteraction) => {
							switch (buttonResponse.customId) {
								case 'exitPrompt':
									webhookClient.send({ content: `**${interaction.user.username}** failed the verification - Manually Exited (Update About Me)` });
									buttonResponse.update({
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
									usernameCollector.stop();
									aboutMeCollector.stop();
									return;

								case 'completeVerification':
									const aboutMeResult = await checkAboutMe(robloxUser.robloxID, phrase);
									const followerRoles = await checkFollowerRoles(robloxUser.robloxID);

									if (aboutMeResult.error || followerRoles.error) {
										webhookClient.send({ content: `**${interaction.user.username}** failed the verification - Roblox API Error (Update About Me Section)` });
										buttonResponse.update({ embeds: [apiErrorEmbed], components: [] });
										openPrompt.delete(interaction.user.id);
										usernameCollector.stop();
										aboutMeCollector.stop();
										return;
									}

									if (aboutMeResult.correctPhrase === true) {
										let gameBanned;
										let banData: any;

										await axios({
											method: 'GET',
											url: `https://bans.saikouapi.xyz/v1/users/${robloxUser.robloxID}/banned`,
											headers: {
												'X-API-KEY': `${process.env.SAIKOU_BANS_TOKEN}`,
											},
										}).then((response: any) => {
											if (response.data.banned === true && response.data.type === 'permban') {
												gameBanned = true;
												banData = response.data;
											}
										});

										/* IF PLAYER IS BANNED FROM THE GAME PERMANENTLY */
										if (gameBanned === true) {
											const bannedMember = interaction.guild.members.cache.get(interaction.user.id);

											await bannedMember
												.send({
													embeds: [
														new EmbedBuilder() // prettier-ignore
															.setTitle('Game Banned! 🎮')
															.setDescription(`Hey, **${robloxUser.robloxName}**!\n\nIt appears that you're currently permanently banned from one of Saikou's affiliated games. We take these punishments seriously, and as a result we ban players from the Saikou Discord who have committed serious offences within our other platforms.\n\nIf you believe this punishment is unjustified or incorrect, we encourage you to submit an [appeal](https://forms.gle/L98zfzbC8fuAz5We6) for the offence. Please note that if you were correctly punished, this will not warrant a removal of your punishment and it will be ignored.`)
															.addFields({ name: 'Ban Details', value: `Account [${robloxUser.robloxName}](https://www.roblox.com/users/${robloxUser.robloxID}/profile) was permanently banned on ${moment.utc(banData.player.Date).format('ll')}\n(${moment(banData.player.Date).fromNow()}) from ${banData.player.Place}.\n\n__Moderator Reason__\n${banData.player.Reason}` })
															.setColor(EMBED_COLOURS.red)
															.setFooter({ text: 'THIS IS AN AUTOMATED MESSAGE' })
															.setTimestamp(),
													],
												})
												.catch(() => {});
											await bannedMember.ban({ reason: `Account ${robloxUser.robloxName} permanently banned from ${banData.Place}.` });
											webhookClient.send({ content: `**${interaction.user.username}** (**${robloxUser.robloxName}**) was flagged during verification for being banned ❌🎮` });

											/* Sending AutoMod Log */
											(bot.channels.cache.find((channel: any) => channel.name === '🤖auto-mod') as TextChannel).send({
												embeds: [
													new EmbedBuilder() // prettier-ignore
														.setAuthor({ name: 'Saikou Discord | Auto Moderation', iconURL: bot.user.displayAvatarURL() })
														.setDescription(`**Account <@${interaction.user.id}> was flagged <t:${parseInt(String(Date.now() / 1000))}:R> during verification.**`)
														.addFields([
															{ name: 'Triggered Reason', value: `User verified with Roblox account **[${robloxUser.robloxName}](https://www.roblox.com/users/${robloxUser.robloxID}/profile)** which is permanently banned from ${banData.player.Place} since ${moment.utc(banData.player.Date).format('ll')}\n(${moment(banData.player.Date).fromNow()}).` },
															{ name: 'Action', value: 'Permanent Ban' },
														])
														.setFooter({ text: `Discord Ban • User ID: ${interaction.user.id}` })
														.setColor(EMBED_COLOURS.red),
												],
											});
										} else {
											webhookClient.send({ content: `**${interaction.user.username}** passed the verification with account **${robloxUser.robloxName}** ✅` });
											await verifiedUser.create({
												robloxName: robloxUser.robloxName,
												robloxID: robloxUser.robloxID,
												roleName: followerRoles.followerRole || 'Follower',
												userID: interaction.user.id,
											});

											const member = interaction.guild.members.cache.get(interaction.user.id);

											/* Setting Roblox nickname */
											await member.setNickname(robloxUser.robloxName).catch(() => {});

											if (followerRoles.followerRole) {
												if (followerRoles.followerRole !== 'Follower') {
													await member.roles.add(interaction.guild.roles.cache.find((discordRole) => discordRole.name === 'Follower')).catch(() => {});
												}
												await member.roles.add(interaction.guild.roles.cache.find((discordRole) => discordRole.name === followerRoles.followerRole)).catch(() => {});

												if (member.roles.cache.some((role) => role.name === 'Unverified')) {
													member.roles.remove(interaction.guild.roles.cache.find((discordRole) => discordRole.name === 'Unverified')).catch(() => {});
												}
											} else {
												await member.roles.add(interaction.guild.roles.cache.find((discordRole) => discordRole.name === 'Follower')).catch(() => {});
											}

											buttonResponse.update({
												content: `👋 Welcome to **Saikou**, ${robloxUser.robloxName}! Looking to change your account? Use the /reverify command.`,
												embeds: [],
												components: [],
											});

											const joinEmbed = new EmbedBuilder() // prettier-ignore
												.setTitle('👋 Welcome to the **Saikou Discord**!')
												.setDescription(`**[${robloxUser.robloxName}](https://www.roblox.com/users/${robloxUser.robloxID}/profile)** ${choose(WELCOME_MESSAGES)}`)
												.setColor(EMBED_COLOURS.green)
												.setFooter({ text: 'User joined' })
												.setTimestamp();

											await axios
												.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUser.robloxID}&size=720x720&format=png`)
												.then((image: any) => {
													joinEmbed.setThumbnail(String(image.data.data.map((value: any) => value.imageUrl)));
												})
												.catch(() => joinEmbed.setThumbnail('https://saikou.dev/assets/images/discord-bot/broken-avatar.png'));

											// @ts-ignore
											bot.channels.cache.get(process.env.JOIN_LEAVES_CHANNEL).send({
												embeds: [joinEmbed],
											});

											openPrompt.delete(interaction.user.id);
											usernameCollector.stop();
											aboutMeCollector.stop();
											return;
										}
									}

									webhookClient.send({ content: `**${interaction.user.username}** failed the verification - Incorrect About Me` });
									buttonResponse.update({
										embeds: [
											new EmbedBuilder() // prettier-ignore
												.setTitle('❌ Incorrect About Me!')
												.setDescription("Uh oh! Looks like you didn't input the correct phrase provided. Make sure you are updating the right place, as shown below:")
												.setImage('https://saikou.dev/assets/images/discord-bot/verify-help.png')
												.setColor(EMBED_COLOURS.red)
												.setFooter({ text: 'Re-run the prompt and provide the correct phrase.' }),
										],
										components: [],
									});

									openPrompt.delete(interaction.user.id);
									usernameCollector.stop();
									aboutMeCollector.stop();
									return;
							}
						});

						aboutMeCollector.on('end', async (collectedResult) => {
							/* IF NO RESPONSE WAS PROVIDED */
							if (collectedResult.size === 0) {
								webhookClient.send({ content: `**${interaction.user.username}** failed the verification - About Me Timeout` });
								interaction.editReply({
									embeds: [outOfTimeEmbed],
									components: [],
								});
								openPrompt.delete(interaction.user.id);
								usernameCollector.stop();
								aboutMeCollector.stop();
								return;
							}
							openPrompt.delete(interaction.user.id);
						});
					}
				});

				usernameCollector.on('end', async (collectedContent) => {
					/* IF NO RESPONSE WAS PROVIDED */
					if (collectedContent.size === 0) {
						webhookClient.send({ content: `**${interaction.user.username}** failed the verification - Username Prompt Timeout` });
						interaction.editReply({
							embeds: [outOfTimeEmbed],
							components: [],
						});
						openPrompt.delete(interaction.user.id);
						usernameCollector.stop();
						return;
					}
					openPrompt.delete(interaction.user.id);
				});

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
