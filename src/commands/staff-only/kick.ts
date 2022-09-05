import { Command, ApplicationCommandOptionType, CommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Types } from 'mongoose';

import { noUser, equalPerms, moderationDmEmbed, moderationEmbed } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

import warnData from '../../models/warnings';

const command: Command = {
	config: {
		commandName: 'kick',
		commandAliases: ['tempremove'],
		commandDescription: 'Removes a user from the Discord server.',
		userPermissions: 'KickMembers',
		commandUsage: '<user> <reason>',
		limitedChannel: 'None',
		COOLDOWN_TIME: 30,
		slashOptions: [
			{
				name: 'user',
				description: 'The user who you would like to kick.',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'reason',
				description: 'The reason for the kick.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ bot, message, args, interaction }) => {
		const member = interaction.options.getMember('user');
		const reason = args[1];

		if (!member) return noUser(interaction, false);
		if (member.permissions && member.permissions.has(PermissionFlagsBits.KickMembers)) return equalPerms(interaction, 'Kick Members');

		await moderationDmEmbed(member, 'Kick', `Hello **${member.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a kick from the Saikou Discord.\n\nIf you continue to break the rules, your account will be permanently banned from accessing the Discord server. To learn more about our rules, visit <#397797150840324115>.\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, reason);

		member.kick(reason);

		interaction.followUp({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setDescription(`✅ **${member.displayName ? member.displayName : member.username} has been kicked.**`)
					.setColor(EMBED_COLOURS.green),
			],
		});

		const userWarns = await warnData.findOne({ userID: member.id });

		// -- Adding warning to user
		if (!userWarns) {
			await warnData.create({
				userID: member.id,
				warnings: [{ _id: new Types.ObjectId(), date: new Date(), moderator: interaction.user.id, reason: `**[kick]** ${reason}` }],
			});
		} else {
			userWarns.warnings.push({ _id: new Types.ObjectId(), date: new Date(), moderator: interaction.user.id, reason: `**[kick]** ${reason}` });
			await userWarns.save();
		}

		await moderationEmbed(message, bot, 'Kick', member, reason, false, interaction as CommandInteraction);
	},
};

export = command;
