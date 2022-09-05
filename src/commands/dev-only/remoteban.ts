import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import ms from 'ms';

import { noUser } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'remoteban',
		commandAliases: ['addrbxban'],
		commandDescription: 'DEVELOPER ONLY - Bypasses Modlog for rbxban',
		limitedChannel: 'None',
		developerOnly: true,
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
	run: async ({ message, args, interaction }) => {
		let robloxName: any;
		let robloxID: any;
		let invalidUser = false;

		if (!message) {
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
						Moderator: 'SaikouDev',
						Reason: String(args[2]),
						Duration: ms(args[3]),
						Place: args[0],
					},
					headers: {
						'X-API-KEY': String(process.env.SAIKOU_BANS_TOKEN),
					},
				})
					.then(async () =>
						interaction.followUp({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setColor(EMBED_COLOURS.green)
									.setDescription(`✅ Successfully time-banned **${robloxName}**!`),
							],
						})
					)
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
					Moderator: 'SaikouDev',
					Reason: String(args[2]),
					Place: args[0],
				},
				headers: {
					'X-API-KEY': String(process.env.SAIKOU_BANS_TOKEN),
				},
			})
				.then(async () =>
					interaction.followUp({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setColor(EMBED_COLOURS.green)
								.setDescription(`✅ Successfully perm-banned **${robloxName}**!`),
						],
					})
				)
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

		return message.channel.send('❌ **Please Use Slash Commands**\n\nThis command relies on slash commands to work, please type /remoteban to get started.');
	},
};

export = command;
