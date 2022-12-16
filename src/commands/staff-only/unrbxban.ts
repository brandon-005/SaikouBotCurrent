import { Command, ApplicationCommandOptionType, EmbedBuilder, TextChannel } from 'discord.js';
import axios from 'axios';

import { noUser } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'unrbxban',
		commandAliases: ['removebanrbx'],
		commandDescription: 'unban a Roblox user.',
		commandUsage: '<player>',
		userPermissions: 'ManageMessages',
		limitedChannel: '🤖staff-cmds',
		COOLDOWN_TIME: 30,
		slashOptions: [
			{
				name: 'roblox-user',
				description: 'The Roblox player to unban.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ bot, interaction, args }) => {
		let robloxName: any;
		let robloxID: any;
		let invalidUser = false;

		/* CHECKING IF ROBLOX NAME IS VALID */
		await axios({
			method: 'post',
			url: 'https://users.roblox.com/v1/usernames/users',
			data: {
				usernames: [args[0]],
			},
		})
			.then((response: any) => {
				robloxName = response.data.data.map((value: any) => value.name);
				robloxID = response.data.data.map((value: any) => value.id);
				if (response.data.data.length === 0) invalidUser = true;
			})
			.catch((error: Error) => {
				console.error(error);
			});

		if (invalidUser !== false) {
			return noUser(interaction, false);
		}

		return axios({
			url: `https://bans.saikouapi.xyz/v1/bans/delete/${robloxID}`,
			method: 'DELETE',
			headers: {
				'X-API-KEY': String(process.env.SAIKOU_BANS_TOKEN),
			},
		})
			.then(async () => {
				const modLog = new EmbedBuilder() //
					.addFields([
						// prettier-ignore
						{ name: 'User:', value: `[${robloxName}](https://www.roblox.com/users/${robloxID}/profile)`, inline: true },
						{ name: 'Moderator:', value: `${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}`, inline: true },
						{ name: 'Additional Info:', value: `Unbanned at <t:${Math.floor(Date.now() / 1000)}:F>` },
					])
					.setColor(EMBED_COLOURS.green)
					.setFooter({ text: `${robloxName} • Unbanned` })
					.setTimestamp();

				await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxID}&size=720x720&format=png`).then((image: any) => {
					modLog.setThumbnail(String(image.data.data.map((value: any) => value.imageUrl)));
				});

				await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxID}&size=720x720&format=png`).then((image: any) => {
					modLog.setAuthor({ name: `${robloxName} | Unbanned`, iconURL: String(image.data.data.map((value: any) => value.imageUrl)) });
				});

				await (bot.channels.cache.get(String(process.env.MODERATION_CHANNEL)) as TextChannel)!.send({
					embeds: [modLog],
				});

				return interaction.editReply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setColor(EMBED_COLOURS.green)
							.setDescription(`✅ Successfully removed the Roblox ban for **${robloxName}**!`),
					],
				});
			})
			.catch((err: Error) => interaction.editReply({ content: `❌ Error!\n\nLooks like the API request was unsucessful, please make sure they are banned and the correct name was provided.\n\n__Developer Info__\n${err}` }));
	},
};

export = command;
