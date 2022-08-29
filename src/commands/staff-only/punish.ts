import { ButtonInteraction, Command, Message, ActionRowBuilder, ButtonBuilder, EmbedBuilder, SelectMenuBuilder, SelectMenuInteraction, ButtonStyle, PermissionFlagsBits, Role, GuildMember, ComponentType } from 'discord.js';
import { Types } from 'mongoose';
import moment from 'moment';

import { EMBED_COLOURS, PROMPT_TIMEOUT, PUNISHMENT_OPTIONS } from '../../utils/constants';
import staffStrikes from '../../models/staffStrikes';

const activeInteraction = new Set();

const command: Command = {
	config: {
		commandName: 'punish',
		commandAliases: ['staffPunish'],
		commandDescription: 'Punish a staff member through a strike system.',
		userPermissions: 'Administrator',
		limitedChannel: 'None',
	},
	run: async ({ message, interaction }) => {
		const menuOptions: any = [];

		/* Fetching users with staff role and adding them to select menu */

		interaction.guild?.roles.cache
			.find((role: Role) => role.name === 'Staff')
			?.members.forEach((fetchedStaff: GuildMember) => {
				/* Ignoring staff with ADMINISTRATOR permissions */
				if (interaction.guild?.members.cache.get(fetchedStaff.user.id)?.permissions.has(PermissionFlagsBits.Administrator)) return;

				menuOptions.push({
					label: `${interaction.guild?.members.cache.get(fetchedStaff.user.id)?.displayName || fetchedStaff.user.username}`,
					value: `${fetchedStaff.user.id}`,
					emoji: '🛡️',
				});
			});

		/* IF USER HAS PROMPT OPEN */
		if (activeInteraction.has(interaction.user.id)) {
			return interaction.followUp({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('Prompt Open! 📂')
						.setDescription('You already have an active prompt, please exit to gain options.')
						.setColor(EMBED_COLOURS.red)
						.setThumbnail('https://i.ibb.co/C5YvkJg/4-128.png'),
				],
			});
		}

		activeInteraction.add(interaction.user.id);

		/* Select option */
		const setupEmbed = await interaction.followUp({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('Select Option 🗃️')
					.setDescription('Please use the corresponding buttons below to select your option.')
					.setColor(EMBED_COLOURS.blurple),
			],
			components: [
				new ActionRowBuilder().addComponents([
					// prettier-ignore
					new ButtonBuilder().setLabel('Punish 📝').setStyle(ButtonStyle.Danger).setCustomId('punishStaff'),
					new ButtonBuilder().setLabel('View Strikes 🔍').setStyle(ButtonStyle.Primary).setCustomId('viewStrikes'),
					new ButtonBuilder().setLabel('Exit 🚪').setStyle(ButtonStyle.Success).setCustomId('exit'),
				]),
			],
		});

		const collector = interaction.channel!.createMessageComponentCollector({ filter: (msgFilter: any) => msgFilter.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

		collector.on('collect', async (button: ButtonInteraction) => {
			switch (button.customId) {
				case 'exit':
					await button.update({
						components: [],
					});

					collector.stop();
					activeInteraction.delete(interaction.user.id);
					break;

				case 'viewStrikes':
					await button.update({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('Select Staff 🔎')
								.setDescription('Please select a staff member from the menu below that you would like to view strikes of.')
								.setColor(EMBED_COLOURS.blurple),
						],
						components: [
							new ActionRowBuilder<SelectMenuBuilder>() // prettier-ignore
								.addComponents([new SelectMenuBuilder().setCustomId('viewStrikes-menu').setPlaceholder('Please select a Staff Member').addOptions(menuOptions)]),
						],
					});

					const chosenStaff = interaction.channel!.createMessageComponentCollector({ filter: (interactionFilter: any) => interactionFilter.user.id === interaction.user.id, componentType: ComponentType.SelectMenu, time: PROMPT_TIMEOUT });

					chosenStaff.on('collect', async (staffMember: any) => {
						const [userID] = staffMember.values;
						const staffUser = await interaction.guild?.members.fetch(`${userID}`)!;
						const staffData = await staffStrikes.findOne({ userID });

						if (!staffData || !staffData.strikeInfo.length) {
							staffMember.update({
								embeds: [
									new EmbedBuilder() // prettier-ignore
										.setDescription('ℹ️ This user has no strikes.')
										.setColor(EMBED_COLOURS.blurple),
								],
								components: [],
							});
							chosenStaff.stop();
							collector.stop();
							activeInteraction.delete(interaction.user.id);
						} else {
							const strikesEmbed = new EmbedBuilder() // prettier-ignore
								.setColor(EMBED_COLOURS.blurple);

							strikesEmbed.setAuthor({ name: `${staffUser.user.username} has ${staffData.strikeInfo.length} Strikes`, iconURL: staffUser.displayAvatarURL() });

							staffData.strikeInfo.forEach((strike: any, count: any) => {
								strikesEmbed.addFields([{ name: `Strike: ${count + 1} | Date: ${moment(strike.date).format('MMMM Do YYYY')}`, value: `${strike.strikeReason}` }]);
							});

							staffMember.update({
								embeds: [strikesEmbed],
								components: [],
							});
							chosenStaff.stop();
							collector.stop();
							activeInteraction.delete(interaction.user.id);
						}
					});
					break;

				case 'punishStaff':
					await button.update({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('Select Staff 🔎')
								.setDescription('Please select a staff member from the menu below that you would like to punish.')
								.setColor(EMBED_COLOURS.blurple),
						],
						components: [
							new ActionRowBuilder<SelectMenuBuilder>() // prettier-ignore
								.addComponents([new SelectMenuBuilder().setCustomId('punishStaff-menu').setPlaceholder('Please select a Staff Member').addOptions(menuOptions)]),
						],
					});

					const punishStaffCollector = interaction.channel!.createMessageComponentCollector({ filter: (interactionFilter: any) => interactionFilter.user.id === interaction.user.id, componentType: ComponentType.SelectMenu, time: PROMPT_TIMEOUT });

					punishStaffCollector.on('collect', async (selectedStaff: SelectMenuInteraction) => {
						const [userID] = selectedStaff.values;
						const staffMember = await interaction.guild?.members.fetch(`${userID}`)!;
						const strikes = await staffStrikes.findOne({ userID });

						/* REASON SUMMARY PROMPT */
						selectedStaff.update({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('Reason Summary 🛡️')
									.setDescription('Please select an option below that correlates to the unsatisfactory actions. You can select multiple options.')
									.setColor(EMBED_COLOURS.blurple),
							],
							components: [
								new ActionRowBuilder<SelectMenuBuilder>() // prettier-ignore
									.addComponents([new SelectMenuBuilder().setCustomId('reason-menu').setPlaceholder('Please select a reason').addOptions(PUNISHMENT_OPTIONS).setMinValues(1).setMaxValues(PUNISHMENT_OPTIONS.length)]),
							],
						});

						const reasonSummary = interaction.channel!.createMessageComponentCollector({ filter: (reasonOptionsMenu: any) => reasonOptionsMenu.user.id === interaction.user.id, componentType: ComponentType.SelectMenu, time: PROMPT_TIMEOUT });

						reasonSummary.on('collect', async (options: SelectMenuInteraction) => {
							let reasonOptions: string = '';
							let detailedReason: any;
							let correctiveAction: any;
							let reviewDate: any;
							let strikeCount: any;

							options.values.forEach((value) => {
								reasonOptions += `${value}\n`;
							});

							try {
								/* DETAILED REASON PROMPT */
								options.update({
									embeds: [
										new EmbedBuilder() // prettier-ignore
											.setTitle('Detailed Reason 📝')
											.setDescription('Please provide the details of unsatisfactory behaviour/actions.')
											.setColor(EMBED_COLOURS.blurple),
									],
									components: [],
								});

								const collectedDetailedReason = await interaction.channel!.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === interaction.user.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
								detailedReason = collectedDetailedReason.first()!.content;

								collectedDetailedReason.first()!.delete();

								/* CORRECTIVE ACTION PROMPT */
								setupEmbed.edit({
									embeds: [
										new EmbedBuilder() // prettier-ignore
											.setTitle('Corrective Action 📝')
											.setDescription('Please provide the immediate and sustained corrective action that must be taken by the employee.')
											.setColor(EMBED_COLOURS.blurple),
									],
									components: [],
								});

								const collectedAction = await interaction.channel!.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === interaction.user.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
								correctiveAction = collectedAction.first()!.content;

								collectedAction.first()!.delete();

								/* CORRECTIVE ACTION PROMPT */
								setupEmbed.edit({
									embeds: [
										new EmbedBuilder() // prettier-ignore
											.setTitle('Follow-up Review ⏳')
											.setDescription('Please provide the date when the employee will be re-reviewed on their actions.')
											.setColor(EMBED_COLOURS.blurple),
									],
									components: [],
								});

								const collectedDate = await interaction.channel!.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === interaction.user.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
								reviewDate = collectedDate.first()!.content;

								collectedDate.first()!.delete();
							} catch (err) {
								setupEmbed.edit({
									embeds: [
										new EmbedBuilder() // prettier-ignore
											.setDescription(`❌ **You ran out of time to input the prompt.**`)
											.setColor(EMBED_COLOURS.red),
									],
									components: [],
								});
								activeInteraction.delete(interaction.user.id);
								reasonSummary.stop();
								collector.stop();
							}

							/* CONFIRMATION */
							const confirmEmbed = new EmbedBuilder() // prettier-ignore
								.setTitle('Are you sure?')
								.addFields([
									// prettier-ignore
									{ name: 'Punishment Summary', value: `${reasonOptions}` },
									{ name: 'Detailed Reason', value: `${detailedReason}` },
									{ name: 'Corrective Action', value: `${correctiveAction}` },
									{ name: 'Review Date', value: `${reviewDate}` },
								])
								.setFooter({ text: 'Indicate your response via the buttons below.' })
								.setColor(EMBED_COLOURS.red);

							if (!strikes) {
								confirmEmbed.setDescription("By issuing this punishment, the following will happen:\n\n• A strike will be permanently tied to the staff member\n• A **formal warning** will be sent in DM's\n• Further strikes will warrant heavier penalities");
							} else {
								switch (strikes.strikeInfo.length) {
									case 1:
										confirmEmbed.setDescription("By issuing this punishment, the following will happen:\n\n• A second strike will be permanently tied to the staff member\n• A **formal warning** will be sent in DM's\n• Further strikes will warrant a termination");
										break;

									case 2:
										confirmEmbed.setDescription("By issuing this punishment, the following will happen:\n\n• A **termination** notice will be sent in DM's\n• All associated staff roles will be removed");
										break;
								}
							}

							setupEmbed.edit({
								embeds: [confirmEmbed],
								components: [
									new ActionRowBuilder().addComponents([
										// prettier-ignore
										new ButtonBuilder().setLabel('Confirm').setStyle(ButtonStyle.Danger).setCustomId('confirm'),
										new ButtonBuilder().setLabel('Exit').setStyle(ButtonStyle.Success).setCustomId('exit'),
									]),
								],
							});

							const confirmCollector = interaction.channel!.createMessageComponentCollector({ filter: (menu: any) => menu.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

							confirmCollector.on('collect', async (confirmBtn: ButtonInteraction) => {
								if (confirmBtn.customId === 'confirm') {
									confirmBtn.update({
										embeds: [
											new EmbedBuilder() // prettier-ignore
												.setDescription(`✅ **The staff member has been successfully punished.**`)
												.setColor(EMBED_COLOURS.green),
										],
										components: [],
									});

									if (!strikes) {
										strikeCount = '🟥⬜⬜ [1/3]';
									} else {
										switch (strikes.strikeInfo.length) {
											case 1:
												strikeCount = '🟥🟥⬜ [2/3]';
												break;

											case 2:
												strikeCount = '🟥🟥🟥 [3/3]';
												break;
										}
									}

									const dmEmbed = new EmbedBuilder() // prettier-ignore
										.setTitle('EMPLOYEE WARNING NOTICE')
										.addFields([
											// prettier-ignore
											{ name: 'Employee Name:', value: staffMember.user.username, inline: true },
											{ name: 'Date:', value: `${moment(Date.now()).format('ll')}`, inline: true },
											{ name: 'Strikes:', value: `${strikeCount}` },
											{ name: '1. Your behaviour/actions have been found unsatisfactory for the following reasons:', value: `${reasonOptions}` },
											{ name: 'Details of unsatisfactory behaviour/actions:', value: `${detailedReason}` },
											{ name: '2. The following immediate and sustained corrective action must be taken by the employee. Failure to do so will result in further disciplinary action:', value: `${correctiveAction}` },
											{ name: '3. Follow-up performance review will be held on:', value: `${reviewDate}` },
											{ name: '\u200b', value: "Please use the corresponding button below to acknowledge the notice. Your acknowledgement of this form means that you have received this notice, it doesn't necessarily mean you agree that the infraction occurred." },
										])
										.setColor(EMBED_COLOURS.red)
										.setFooter({ text: 'Saikou Development • Sent by Management' });

									/* PUNISHMENTS */
									if ((strikes && strikes.strikeInfo.length !== 2) || !strikes) {
										staffMember.send({
											embeds: [dmEmbed],
											components: [
												new ActionRowBuilder().addComponents([
													// prettier-ignore
													new ButtonBuilder().setLabel('Acknowledged').setStyle(ButtonStyle.Success).setCustomId('receivedNotice'),
												]),
											],
										});

										const strikesDataObj = {
											_id: new Types.ObjectId(),
											date: new Date(),
											strikeReason: reasonOptions,
										};

										if (!strikes) {
											await staffStrikes.create({
												userID,
												strikeInfo: [strikesDataObj],
											});
										} else {
											strikes.strikeInfo.push(strikesDataObj);
											await strikes.save();
										}
									} else {
										staffMember.send({
											embeds: [
												new EmbedBuilder() // prettier-ignore
													.setTitle('EMPLOYEE TERMINATION NOTICE')
													.addFields([
														// prettier-ignore
														{ name: 'Employee Name:', value: staffMember.user.username, inline: true },
														{ name: 'Date:', value: `${moment(Date.now()).format('ll')}`, inline: true },
														{ name: 'Strikes:', value: `${strikeCount}` },
														{ name: '1. Your behaviour/actions have been found unsatisfactory for the following reasons:', value: `${reasonOptions}` },
														{ name: 'Details of unsatisfactory behaviour/actions:', value: `${detailedReason}` },
														{ name: '\u200b', value: 'In accordance with Article 2F, we still require your full compliance in not leaking staff conversations, topics, or channels. Doing so will result in an immediate removal from the associated platform.' },
														{ name: '\u200b', value: "Please use the corresponding button below to acknowledge the notice. Your acknowledgement of this form means that you have received this notice, it doesn't necessarily mean you agree that the infraction occurred." },
													])
													.setColor(EMBED_COLOURS.red)
													.setFooter({ text: 'Saikou Development • Sent by Management' }),
											],
											components: [
												new ActionRowBuilder().addComponents([
													// prettier-ignore
													new ButtonBuilder().setLabel('Acknowledged').setStyle(ButtonStyle.Success).setCustomId('receivedNotice'),
												]),
											],
										});

										/* Remove all roles */
										staffMember.roles.set([]);

										/* Give omega follower */
										staffMember.roles.add(interaction.guild!.roles.cache.find((role: Role) => role.name === 'Omega Follower')!);
									}

									activeInteraction.delete(interaction.user.id);
									confirmCollector.stop();
									reasonSummary.stop();
									collector.stop();
								} else {
									activeInteraction.delete(interaction.user.id);
									collector.stop();
									confirmCollector.stop();
									reasonSummary.stop();
								}
							});
						});

						punishStaffCollector.stop();
					});
					break;
			}
		});

		collector.on('end', () => {
			setupEmbed.edit({
				components: [],
			});
			activeInteraction.delete(interaction.user.id);
		});
	},
};

export = command;
