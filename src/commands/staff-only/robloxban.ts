import { Command, ApplicationCommandOptionType, CommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import axios from 'axios';
import ms from 'ms';

import { noUser } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'robloxban',
		commandAliases: ['gameban', 'game'],
		commandDescription: 'Ban a Roblox user.',
		userPermissions: 'ManageMessages',
		limitedChannel: '🤖staff-cmds',
		COOLDOWN_TIME: 10,
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
			},
			{
				name: 'duration',
				description: 'Used to provide a duration.',
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	},
	run: async ({ bot, message, args, interaction }) => {
		let robloxName: any;
		let robloxID: any;
		let invalidUser = false;

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
			.catch((error) => {
				console.error(error);
			});

		if (invalidUser !== false) {
			return noUser(message, false, interaction as CommandInteraction);
		}

		/* ADDING BAN */
		if (args[3]) {
			if (!ms(args[3])) {
				return interaction.followUp({ content: 'Invalid time.' });
			}

			return axios({
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

					await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxID}&size=720x720&format=png`).then((image: any) => {
						modLog.setThumbnail(String(image.data.data.map((value: any) => value.imageUrl)));
					});

					await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxID}&size=720x720&format=png`).then((image: any) => {
						modLog.setAuthor({ name: `${args[0]} | ${ms(ms(String(args[3])), { long: true })} ban`, iconURL: String(image.data.data.map((value: any) => value.imageUrl)) });
					});

					await (bot.channels.cache.get(String(process.env.MODERATION_CHANNEL)) as TextChannel)!.send({
						embeds: [modLog],
					});

					return interaction.followUp({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setColor(EMBED_COLOURS.green)
								.setDescription(`✅ Successfully time-banned **${robloxName}**!`),
						],
					});
				})
				.catch((err) => {
					const embed = new EmbedBuilder() // prettier-ignore
						.setColor(EMBED_COLOURS.red)
						.setThumbnail('https://i.ibb.co/C5YvkJg/4-128.png');

					switch (err.response.data.errorCode) {
						case 8:
							embed.setTitle('🗄️ Player Already Banned');
							embed.setDescription("Hmmm. It appears that this player is already in our database and banned. Make sure...\n\n• The player you're trying to ban is spelt correctly\n• The player doesn't already have a moderation log");
							return interaction.followUp({ embeds: [embed] });

						case 13:
							embed.setTitle('🛡️ Invalid Staff Member');
							embed.setDescription("Oh no! Looks like the name provided doesn't appear to be a Saikou staff member. Make sure...\n\n• Your nickname is set to your Roblox username\n• You have permission to do this action");
							return interaction.followUp({ embeds: [embed] });
					}
				});
		}

		return axios({
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

				await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxID}&size=720x720&format=png`).then((image: any) => {
					modLog.setThumbnail(String(image.data.data.map((value: any) => value.imageUrl)));
				});

				await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxID}&size=720x720&format=png`).then((image: any) => {
					modLog.setAuthor({ name: `${args[0]} | Permanent ban`, iconURL: String(image.data.data.map((value: any) => value.imageUrl)) });
				});

				await (bot.channels.cache.get(String(process.env.MODERATION_CHANNEL)) as TextChannel)!.send({
					embeds: [modLog],
				});

				return interaction.followUp({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setColor(EMBED_COLOURS.green)
							.setDescription(`✅ Successfully perm-banned **${robloxName}**!`),
					],
				});
			})
			.catch((err) => {
				const embed = new EmbedBuilder() // prettier-ignore
					.setColor(EMBED_COLOURS.red)
					.setThumbnail('https://i.ibb.co/C5YvkJg/4-128.png');

				switch (err.response.data.errorCode) {
					case 8:
						embed.setTitle('🗄️ Player Already Banned');
						embed.setDescription("Hmmm. It appears that this player is already in our database and banned. Make sure...\n\n• The player you're trying to ban is spelt correctly\n• The player doesn't already have a moderation log");
						return interaction.followUp({ embeds: [embed] });

					case 13:
						embed.setTitle('🛡️ Invalid Staff Member');
						embed.setDescription("Oh no! Looks like the name provided doesn't appear to be a Saikou staff member. Make sure...\n\n• Your nickname is set to your Roblox username\n• You have permission to do this action");
						return interaction.followUp({ embeds: [embed] });

					default:
						console.error(err);
						break;
				}
			});
	},
};

export = command;
