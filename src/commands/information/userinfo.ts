import { Command, ApplicationCommandOptionType, EmbedBuilder, Role, PermissionFlagsBits } from 'discord.js';

import moment from 'moment';
import { EMBED_COLOURS } from '../../utils/constants';
import { noUser } from '../../utils/embeds';
import verifiedUser from '../../models/verifiedUser';
import axios from 'axios';

const command: Command = {
	config: {
		commandName: 'userinfo',
		commandAliases: ['user', 'user-info', 'playerinfo', 'player', 'whois'],
		commandDescription: "If you're wondering when that one user joined, or just want some extra information about them, then the userinfo command is for you.",
		commandUsage: '[user]',
		slashOptions: [
			{
				name: 'user',
				description: 'The user who you would like to view info of.',
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ interaction }) => {
		/* If user can't be found in cache */
		if (!interaction.inCachedGuild()) return noUser(interaction, false);

		const member = interaction.options.getMember('user') || interaction.member;
		const robloxUser = await verifiedUser.findOne({ userID: member.id });

		const userinfoEmbed = new EmbedBuilder() // prettier-ignore
			.setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL({ extension: 'webp', size: 64 }) })
			.setThumbnail(member.user.displayAvatarURL({ extension: 'webp' }))
			.setDescription(member.toString())
			.addFields([
				// prettier-ignore
				{ name: 'Join Date', value: `${moment.utc(member.joinedAt).format('ll')}\n(${moment(member.joinedAt).fromNow()})`, inline: true },
				{ name: 'Register Date', value: `${moment.utc(member.user.createdAt).format('ll')}\n(${moment(member.user.createdAt).fromNow()})`, inline: true },
				{ name: 'Nickname', value: member.nickname || 'None', inline: true },
				{ name: 'Boosting', value: member.premiumSince ? 'Yes' : 'No', inline: true },
				{ name: 'Status', value: `${member.presence ? member.presence.status : 'offline'}`, inline: true },
				{ name: 'Bot', value: `${member.user.bot ? 'Yes' : 'No'}`, inline: true },
				{ name: '\u200b', value: '\u200b' },
			]);

		if (robloxUser) {
			await axios
				.get(`https://users.roblox.com/v1/users/${robloxUser.robloxID}`)
				.then((response) => {
					userinfoEmbed.addFields([
						{ name: 'Roblox Name', value: `[${robloxUser.robloxName}](https://www.roblox.com/users/${robloxUser.robloxID}/profile)`, inline: true },
						{ name: 'Display Name', value: response.data.displayName, inline: true },
						{ name: 'Creation Date', value: `${moment.utc(response.data.created).format('ll')}\n(${moment(response.data.created).fromNow()})`, inline: true },
						{ name: 'Roblox ID', value: robloxUser.robloxID, inline: true },
						{ name: 'Terminated', value: `${response.data.isBanned ? 'Yes' : 'No'}`, inline: true },
						{ name: 'Verified Badge', value: `${response.data.hasVerifiedBadge ? 'Yes' : 'No'}`, inline: true },
						{ name: '\u200b', value: '\u200b' },
					]);
				})
				.catch();
		}

		userinfoEmbed.addFields([
			{
				name: `Roles (${member.roles.cache.filter((role: Role) => role.id !== member.guild.id).size})`,
				value:
					member.roles.cache
						.filter((role: Role) => role.id !== member.guild.id)
						.sort((role1: Role, role2: Role) => role2.position - role1.position)
						.map((role: Role) => role.toString())
						.join(', ') || 'None',
			},
		]);

		userinfoEmbed.setColor(EMBED_COLOURS.blurple);
		userinfoEmbed.setFooter({ text: `User ID: ${member.id}` });
		userinfoEmbed.setTimestamp();

		if (member.permissions.has(PermissionFlagsBits.Administrator)) userinfoEmbed.addFields([{ name: 'Acknowledgements', value: 'Server Admin' }]);
		else if (member.permissions.has(PermissionFlagsBits.ManageMessages)) userinfoEmbed.addFields([{ name: 'Acknowledgements', value: 'Server Moderator' }]);

		interaction.editReply({ embeds: [userinfoEmbed] });
	},
};

export = command;
