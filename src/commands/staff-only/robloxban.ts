import { Command, ApplicationCommandOptionType, EmbedBuilder, TextChannel } from 'discord.js';
import axios from 'axios';
import ms from 'ms';

import { noUser } from '../../utils/embeds';
import { EMBED_COLOURS, ROBLOXBAN_CHOICES } from '../../utils/constants';
import verifiedUser from '../../models/verifiedUser';
import moment from 'moment';

const command: Command = {
	config: {
		commandName: 'robloxban',
		commandAliases: ['gameban', 'game'],
		commandDescription: 'Ban a Roblox user.',
		commandUsage: '<game> <player> <reason> [duration]',
		userPermissions: 'ManageMessages',
		limitedChannel: '🤖staff-cmds',
		COOLDOWN_TIME: 60,
		slashOptions: [
			{
				name: 'game',
				description: 'The game where the offence happened.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: 'Military Warfare Tycoon',
						value: 'Military Warfare Tycoon',
					},
					{
						name: 'Killstreak',
						value: 'Killstreak',
					},
				],
			},
			{
				name: 'roblox-user',
				description: 'The Roblox player to ban',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'reason',
				description: 'The reason for the ban.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: ROBLOXBAN_CHOICES,
			},
			{
				name: 'duration',
				description: 'Used to provide a duration.',
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	},
	run: async ({ bot, interaction, args }) => {
		let robloxName: any;
		let robloxID: any;
		let invalidUser = false;
		let apiError;

		/* CHECKING IF ROBLOX NAME IS VALID */
		await axios({
			method: 'post',
			url: 'https://users.roblox.com/v1/usernames/users',
			data: {
				usernames: [args[1]],
			},
		})
			.then((response: any) => {
				robloxName = response.data.data.map((value: any) => value.name);
				robloxID = response.data.data.map((value: any) => value.id);
				if (response.data.data.length === 0) invalidUser = true;
			})
			.catch(() => {});

		if (invalidUser !== false) {
			return noUser(interaction, false);
		}

		const verified = await verifiedUser.findOne({ robloxID });

		/* ADDING BAN */
		if (args[3]) {
			if (!ms(args[3])) {
				return interaction.editReply({ content: 'Invalid time.' });
			}

			await axios({
				url: 'https://bans.saikouapi.xyz/v1/timebans/create-new',
				method: 'POST',
				data: {
					RobloxUsername: String(robloxName),
					RobloxID: Number(robloxID),
					Moderator: String(interaction.guild?.members.cache.get(interaction.user.id)?.displayName),
					Reason: String(args[2]),
					Duration: ms(args[3]),
					Place: args[0],
				},
				headers: {
					'X-API-KEY': String(process.env.SAIKOU_BANS_TOKEN),
				},
			})
				.then(async () => {
					/* MOD LOG EMBED */
					const modLog = new EmbedBuilder() //
						.setAuthor({ name: `${args[0]} | ${ms(ms(String(args[3])), { long: true })} ban`, iconURL: `https://www.roblox.com/bust-thumbnail/image?userId=${robloxID}&width=48&height=48&format=png` })
						.addFields([
							// prettier-ignore
							{ name: 'User:', value: `[${robloxName}](https://www.roblox.com/users/${robloxID}/profile)`, inline: true},
							{ name: 'Moderator:', value: `${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}`, inline: true },
							{ name: 'Reason:', value: `${args[2]}` },
						])
						.setColor(EMBED_COLOURS.green)
						.setFooter({ text: `${args[0]} • ${ms(ms(String(args[3])))} ban` })
						.setTimestamp();

					await axios
						.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxID}&size=720x720&format=png`)
						.then((image: any) => {
							modLog.setThumbnail(String(image.data.data.map((value: any) => value.imageUrl)));
						})
						.catch(() => modLog.setThumbnail('https://saikou.dev/assets/images/discord-bot/broken-avatar.png'));

					await axios
						.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxID}&size=720x720&format=png`)
						.then((image: any) => {
							modLog.setAuthor({ name: `${args[0]} | ${ms(ms(String(args[3])), { long: true })} ban`, iconURL: String(image.data.data.map((value: any) => value.imageUrl)) });
						})
						.catch(() => modLog.setAuthor({ name: `${args[0]} | ${ms(ms(String(args[3])), { long: true })} ban`, iconURL: 'https://saikou.dev/assets/images/discord-bot/broken-avatar.png' }));

					await (bot.channels.cache.get(String(process.env.MODERATION_CHANNEL)) as TextChannel)!.send({
						embeds: [modLog],
					});

					return interaction.editReply({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setColor(EMBED_COLOURS.green)
								.setDescription(`✅ Successfully time-banned **[${robloxName}](https://www.roblox.com/users/${robloxID}/profile)**!`),
						],
					});
				})
				.catch((err) => {
					apiError = true;
					const embed = new EmbedBuilder() // prettier-ignore
						.setColor(EMBED_COLOURS.red)
						.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-sad.png');

					if (!err.response) {
						embed.setTitle('❌ Unknown Error!');
						embed.setDescription("Uh oh! Looks like something's not working quite right. Please try re-running the command.");
						return interaction.editReply({ embeds: [embed] });
					}

					switch (err.response.data.errorCode) {
						case 8:
							embed.setTitle('🗄️ Player Already Banned');
							embed.setDescription("Hmmm. It appears that this player is already in our database and banned. Make sure...\n\n• The player you're trying to ban is spelt correctly\n• The player doesn't already have a moderation log");
							return interaction.editReply({ embeds: [embed] });

						case 13:
							embed.setTitle('🛡️ Invalid Staff Member');
							embed.setDescription("Oh no! Looks like the name provided doesn't appear to be a Saikou staff member. Make sure...\n\n• Your nickname is set to your Roblox username\n• You have permission to do this action");
							return interaction.editReply({ embeds: [embed] });

						default:
							console.error(err);
							embed.setTitle('❌ Unknown Error!');
							embed.setDescription("Uh oh! Looks like something's not working quite right. Please try re-running the command.");
							return interaction.editReply({ embeds: [embed] });
					}
				});

			if (verified && !apiError) {
				const member = interaction.guild.members.cache.get(verified.userID);

				await member
					.send({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('Temporary Game Ban! 🎮')
								.setDescription(`Hey, **${robloxName}**!\n\nIt appears that you've received a temporary ban from one of Saikou's affiliated games. We take these punishments seriously, and if you continue to break the rules, we may choose to permanently ban you.\n\nIf you believe this punishment is unjustified or incorrect, we encourage you to submit an [appeal](https://forms.gle/L98zfzbC8fuAz5We6) for the offence. Please note that if you were correctly punished, this will not warrant a removal of your punishment and it will be ignored.`)
								.addFields({ name: 'Ban Details', value: `Account [${robloxName}](https://www.roblox.com/users/${robloxID}/profile) was temporarily banned on ${moment.utc(new Date()).format('ll')}\n(${moment(new Date()).fromNow()}) from ${args[0]}. The ban is due to expire in ${ms(ms(String(args[3])), { long: true })}.\n\n__Moderator Reason__\n${args[2]}` })
								.setColor(EMBED_COLOURS.red)
								.setFooter({ text: 'THIS IS AN AUTOMATED MESSAGE' })
								.setTimestamp(),
						],
					})
					.catch();

				(bot.channels.cache.find((channel: any) => channel.name === '🤖auto-mod') as TextChannel).send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setAuthor({ name: 'Saikou Discord | Auto Moderation', iconURL: bot.user.displayAvatarURL() })
							.setDescription(`**Account <@${verified.userID}> was flagged <t:${parseInt(String(Date.now() / 1000))}:R> for a temporary ban in a Saikou game.**`)
							.addFields([
								{ name: 'Triggered Reason', value: `User linked with Roblox Account **[${robloxName}](https://www.roblox.com/users/${robloxID}/profile)** was temporarily banned just now.` },
								{ name: 'Action', value: 'Automatic Notice' },
							])
							.setFooter({ text: `Automated Notice • User ID: ${verified.userID}` })
							.setColor(EMBED_COLOURS.yellow),
					],
				});
			}

			return;
		}

		await axios({
			url: 'https://bans.saikouapi.xyz/v1/bans/create-new',
			method: 'POST',
			data: {
				RobloxUsername: String(robloxName),
				RobloxID: Number(robloxID),
				Moderator: String(interaction.guild?.members.cache.get(interaction.user.id)?.displayName),
				Reason: String(args[2]),
				Place: args[0],
			},
			headers: {
				'X-API-KEY': String(process.env.SAIKOU_BANS_TOKEN),
			},
		})
			.then(async () => {
				const modLog = new EmbedBuilder() //
					.addFields([
						// prettier-ignore
						{ name: 'User:', value: `[${robloxName}](https://www.roblox.com/users/${robloxID}/profile)`, inline: true},
						{ name: 'Moderator:', value: `${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}`, inline: true },
						{ name: 'Reason:', value: `${args[2]}` },
					])
					.setColor(EMBED_COLOURS.green)
					.setFooter({ text: `${args[0]} • Permanent ban` })
					.setTimestamp();

				await axios
					.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxID}&size=720x720&format=png`)
					.then((image: any) => {
						modLog.setThumbnail(String(image.data.data.map((value: any) => value.imageUrl)));
					})
					.catch(() => modLog.setThumbnail('https://saikou.dev/assets/images/discord-bot/broken-avatar.png'));

				await axios
					.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxID}&size=720x720&format=png`)
					.then((image: any) => {
						modLog.setAuthor({ name: `${args[0]} | Permanent ban`, iconURL: String(image.data.data.map((value: any) => value.imageUrl)) });
					})
					.catch(() => modLog.setAuthor({ name: `${args[0]} | Permanent ban`, iconURL: 'https://saikou.dev/assets/images/discord-bot/broken-avatar.png' }));

				await (bot.channels.cache.get(String(process.env.MODERATION_CHANNEL)) as TextChannel)!.send({
					embeds: [modLog],
				});

				return interaction.editReply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setColor(EMBED_COLOURS.green)
							.setDescription(`✅ Successfully perm-banned **[${robloxName}](https://www.roblox.com/users/${robloxID}/profile)**!`),
					],
				});
			})
			.catch((err) => {
				const embed = new EmbedBuilder() // prettier-ignore
					.setColor(EMBED_COLOURS.red)
					.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-sad.png');

				if (!err.response) {
					embed.setTitle('❌ Unknown Error!');
					embed.setDescription("Uh oh! Looks like something's not working quite right. Please try re-running the command.");
					return interaction.editReply({ embeds: [embed] });
				}

				switch (err.response.data.errorCode) {
					case 8:
						embed.setTitle('🗄️ Player Already Banned');
						embed.setDescription("Hmmm. It appears that this player is already in our database and banned. Make sure...\n\n• The player you're trying to ban is spelt correctly\n• The player doesn't already have a moderation log");
						return interaction.editReply({ embeds: [embed] });

					case 13:
						embed.setTitle('🛡️ Invalid Staff Member');
						embed.setDescription("Oh no! Looks like the name provided doesn't appear to be a Saikou staff member. Make sure...\n\n• Your nickname is set to your Roblox username\n• You have permission to do this action");
						return interaction.editReply({ embeds: [embed] });

					default:
						console.error(err);
						embed.setTitle('❌ Unknown Error!');
						embed.setDescription("Uh oh! Looks like something's not working quite right. Please try re-running the command.");
						return interaction.editReply({ embeds: [embed] });
				}
			});

		if (verified && !apiError) {
			const member = interaction.guild.members.cache.get(verified.userID);

			await member
				.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('Game Banned! 🎮')
							.setDescription(`Hey, **${robloxName}**!\n\nIt appears that you're currently permanently banned from one of Saikou's affiliated games. We take these punishments seriously, and as a result we ban players from the Saikou Discord who have committed serious offences within our other platforms.\n\nIf you believe this punishment is unjustified or incorrect, we encourage you to submit an [appeal](https://forms.gle/L98zfzbC8fuAz5We6) for the offence. Please note that if you were correctly punished, this will not warrant a removal of your punishment and it will be ignored.`)
							.addFields({ name: 'Ban Details', value: `Account [${robloxName}](https://www.roblox.com/users/${robloxID}/profile) was permanently banned on ${moment.utc(new Date()).format('ll')}\n(${moment(new Date()).fromNow()}) from ${args[0]}.\n\n__Moderator Reason__\n${args[2]}` })
							.setColor(EMBED_COLOURS.red)
							.setFooter({ text: 'THIS IS AN AUTOMATED MESSAGE' })
							.setTimestamp(),
					],
				})
				.catch(() => {});

			await member.ban({ reason: `Account ${robloxName} permanently banned from ${args[0]}.` }).catch();

			(bot.channels.cache.find((channel: any) => channel.name === '🤖auto-mod') as TextChannel).send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setAuthor({ name: 'Saikou Discord | Auto Moderation', iconURL: bot.user.displayAvatarURL() })
						.setDescription(`**Account <@${verified.userID}> was flagged <t:${parseInt(String(Date.now() / 1000))}:R> for a ban in a Saikou game.**`)
						.addFields([
							{ name: 'Triggered Reason', value: `User linked with Roblox Account **[${robloxName}](https://www.roblox.com/users/${robloxID}/profile)** was permanently banned from ${args[0]}.` },
							{ name: 'Action', value: 'Discord Ban' },
						])
						.setFooter({ text: `Permanent Ban • User ID: ${verified.userID}` })
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		return;
	},
};

export = command;
