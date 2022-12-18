import { Command, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, PermissionFlagsBits, ComponentType, GuildMember } from 'discord.js';
import axios from 'axios';
import moment from 'moment';

import { noUser } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

const activeInteraction = new Set();

const command: Command = {
	config: {
		commandName: 'search',
		commandAliases: ['rbxsearch', 'rbx', 'roblox', 'accscan', 'accountscan'],
		commandDescription: 'Gain information about a Roblox player.',
		commandUsage: '<roblox_username>',
		slashOptions: [
			{
				name: 'roblox-user',
				description: 'The name of the Roblox user.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ interaction, args }) => {
		const oofdBanReason: string[] = [];
		let robloxID: Number | null = 0;
		let error: any = false;
		let saikouChecks: any = '';

		function filterBans(bannedBy: string) {
			switch (bannedBy) {
				case 'SYNAPSE':
					oofdBanReason.push(`:warning: This account is a registered Synapse owner (Exploit Injector)\n`);
					break;

				case 'KRNL':
					oofdBanReason.push(`:warning: This account is a registered KRNL owner (Exploit Injector)\n`);
					break;

				default:
					oofdBanReason.push(`:warning: Previously banned for exploiting by the ${bannedBy} group\n`);
					break;
			}
		}

		/* Fetching Roblox ID */
		await axios({
			method: 'post',
			url: 'https://users.roblox.com/v1/usernames/users',
			data: {
				usernames: [args[0]],
			},
		})
			.then((response: any) => {
				robloxID = response.data.data.map((value: any) => value.id);
				if (response.data.data.length === 0) robloxID = null;
			})
			.catch((rbxError) => {
				console.error(rbxError);
			});

		/* If Player Doesn't Exist */
		if (!robloxID) {
			return noUser(interaction, false);
		}

		const infoEmbed = new EmbedBuilder() // prettier-ignore
			.setColor(EMBED_COLOURS.blurple);

		await axios.get(`https://users.roblox.com/v1/users/${robloxID}`).then(async (response: any) => {
			await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxID}&size=720x720&format=png`).then((image: any) => {
				infoEmbed.setAuthor({ name: response.data.name, iconURL: String(image.data.data.map((value: any) => value.imageUrl)), url: `https://www.roblox.com/users/${robloxID}/profile` });
			});

			await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxID}&size=720x720&format=png`).then((image: any) => {
				infoEmbed.setThumbnail(String(image.data.data.map((value: any) => value.imageUrl)));
			});

			infoEmbed.addFields([
				// prettier-ignore
				{ name: 'About Me', value: response.data.description ? response.data.description : 'None' },
				{ name: 'Display Name', value: response.data.displayName, inline: true },
				{ name: 'Banned', value: response.data.isBanned ? 'Yes' : 'No', inline: true },
				{ name: 'Last Online', value: moment(await axios.get(`https://api.roblox.com/users/${robloxID}/onlinestatus/`).then((statusResponse: any) => statusResponse.data.LastOnline)).fromNow(), inline: true },
			]);

			infoEmbed.setFooter({ text: `User ID: ${robloxID} • Join Date: ${moment(response.data.created).format('ll')}` });
		});

		if ((interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageMessages)) {
			/* IF USER HAS PROMPT OPEN */
			if (activeInteraction.has(interaction.user.id)) {
				infoEmbed.setFooter({ text: 'Exit previous search prompt to receive the option to scan.' });
				return interaction.editReply({ embeds: [infoEmbed] });
			}

			activeInteraction.add(interaction.user.id);

			const info: any = await interaction.editReply({
				embeds: [infoEmbed],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents([new ButtonBuilder().setLabel('Scan Account 📊').setStyle(ButtonStyle.Primary).setCustomId('scanAcc'), new ButtonBuilder().setLabel('Exit 🚪').setStyle(ButtonStyle.Primary).setCustomId('exit')])],
			});

			const collector = interaction.channel!.createMessageComponentCollector({ filter: (menu: any) => menu.user.id === interaction.user.id, componentType: ComponentType.Button, time: 30000 });

			collector.on('collect', async (button: ButtonInteraction): Promise<any> => {
				switch (button.customId) {
					case 'scanAcc':
						button.update({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('🔍 Fetching...')
									.setDescription('Please wait for the data to be fetched for this player.')
									.setColor(EMBED_COLOURS.blurple),
							],
							components: [],
						});

						/* OOFD BAN LIST CHECK */
						const oofdData = await axios({
							method: 'POST',
							url: 'https://oofd.net/api/ban/status/',
							data: {
								UserId: `${robloxID}`,
							},
						})
							.then((response: any) => response.data)
							.catch(() => {
								error = true;
							});

						/* ONLY GROUP IS SAIKOU CHECK */
						const saikouOnlyGroup = await axios.get(`https://groups.roblox.com/v2/users/${robloxID}/groups/roles`).then((response: any) => {
							if (response.data.data.length === 1 && response.data.data.map((groupData: any) => groupData.group.name).toString() === 'Saikou') return true;
							return false;
						});

						/* BANNED FROM SAIKOU'S GAMES CHECK */
						const saikouBanned = await axios({
							method: 'GET',
							url: `https://bans.saikouapi.xyz/v1/users/${robloxID}/banned`,
							headers: {
								'X-API-KEY': `${process.env.SAIKOU_BANS_TOKEN}`,
							},
						})
							.then((response: any) => {
								if (response.data.banned === true) return `:warning: Permanently banned from Saikou's games (Banned by ${response.data.player.Moderator})\n`;
								return false;
							})
							.catch((err) => {
								console.log(err);
								error = true;
							});

						/* CHECKING PLAYER FOR BANNED FRIENDS */
						const allBans = await axios({
							method: 'GET',
							url: 'https://bans.saikouapi.xyz/v1/bans/list-bans',
							headers: {
								'X-API-KEY': `${process.env.SAIKOU_BANS_TOKEN}`,
								'Accept-Encoding': 'gzip,deflate,compress',
							},
						})
							.then((response: any) => response.data.map((user: any) => user.RobloxID))
							.catch(() => {
								error = true;
							});

						const bannedFriends = await axios
							.get(`https://friends.roblox.com/v1/users/${robloxID}/friends`)
							.then((response: any) => {
								const bans: string[] = [];
								Object.values(response.data.data!).forEach((friend: any) => {
									allBans.forEach((bannedPlayer: any) => {
										if (friend.id === bannedPlayer) bans.push(`:warning: Friends with the banned player ${friend.name}\n`);
									});
								});

								if (bans.length === 0) return false;
								return bans;
							})
							.catch(() => {
								error = true;
							});

						if (error !== false) {
							info.edit({
								embeds: [
									new EmbedBuilder() // prettier-ignore
										.setTitle('Unable to Fetch Data!')
										.setDescription('An error occurred with an API this command relies on, please try re-running the command.')
										.setColor(EMBED_COLOURS.red),
								],
							});

							collector.stop();
							return activeInteraction.delete(interaction.user.id);
						}

						/* SENDING THE EMBED WITH DATA */
						if (oofdData.Banned === false && oofdData.AccountAge >= 182 && saikouBanned === false && bannedFriends === false && saikouOnlyGroup === false) {
							info.edit({
								embeds: [
									new EmbedBuilder() // prettier-ignore
										.setTitle('All clear!')
										.setDescription(`We did multiple checks on **${args[0]}** and found nothing of concern.`)
										.addFields([{ name: 'Passed Checks', value: "✅ Not friends with a banned player\n✅ Account age older than 6 months\n✅ Not currently serving a Saikou perm-ban\n✅ No records of being a registered exploit owner\n✅ No records of exploiting in other checkable games\n✅ In multiple groups or only joined group isn't Saikou" }])
										.setColor(EMBED_COLOURS.green)
										.setFooter({ text: `Roblox ID: ${robloxID} • Last Online: ${moment(await axios.get(`https://api.roblox.com/users/${robloxID}/onlinestatus/`).then((response: any) => response.data.LastOnline)).fromNow()}` }),
								],
							});
							collector.stop();
							return activeInteraction.delete(interaction.user.id);
						}

						const failedChecks = new EmbedBuilder() // prettier-ignore
							.setTitle('Data Fetched!')
							.setDescription(`We did multiple checks on **${args[0]}** and found some flags of concern.`)
							.setColor(EMBED_COLOURS.blurple)
							.setFooter({ text: `Roblox ID: ${robloxID} • Last Online: ${moment(await axios.get(`https://api.roblox.com/users/${robloxID}/onlinestatus/`).then((response: any) => response.data.LastOnline)).fromNow()}` });

						/* AGE CHECK */
						if (oofdData.AccountAge <= 182) {
							failedChecks.addFields([{ name: 'General Checks', value: ':warning: This account is under 6 months old.' }]);
						}

						/* EXPLOIT CHECK */
						if (oofdData.Banned === true) {
							if (oofdData.Data.length !== 0) {
								if (oofdData.Data.length > 1) {
									oofdData.Data.forEach((data: any) => {
										filterBans(data.BannedBy);
									});
								} else {
									filterBans(oofdData.Data.map((value: any) => value.BannedBy));
								}
							}
							failedChecks.addFields([{ name: 'Exploit Checks', value: String(oofdBanReason).replace(/,/g, '') }]);
						}

						/* SAIKOU ONLY GROUP CHECK */
						if (saikouOnlyGroup === true) {
							saikouChecks += ':warning: Only joined Roblox group is Saikou\n';
						}

						/* SAIKOU BAN CHECK */
						if (saikouBanned !== false) {
							saikouChecks += saikouBanned;
						}

						if (saikouChecks !== '') {
							failedChecks.addFields([{ name: 'Saikou Checks', value: saikouChecks }]);
						}

						/* FRIEND CHECK */
						if (bannedFriends !== false) {
							failedChecks.addFields([{ name: 'Friend Checks', value: String(bannedFriends).replace(/,/g, '') }]);
						}

						info.edit({ embeds: [failedChecks] });
						collector.stop();
						return activeInteraction.delete(interaction.user.id);

					case 'exit':
						await button.update({
							components: [],
						});

						collector.stop();
						activeInteraction.delete(interaction.user.id);
						break;
				}
			});

			collector.on('end', () => {
				info.edit({ components: [] });
				activeInteraction.delete(interaction.user.id);
			});
		} else {
			infoEmbed.setTimestamp();
			interaction.editReply({ embeds: [infoEmbed] });
		}
	},
};

export = command;
