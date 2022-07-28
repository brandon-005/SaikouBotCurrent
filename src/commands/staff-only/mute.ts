/* eslint-disable prefer-destructuring */
import { Command, ApplicationCommandOptionType, CommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Types } from 'mongoose';
import ms from 'ms';

import { getMember } from '../../utils/functions';
import { noUser, equalPerms, moderationDmEmbed, moderationEmbed } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

import warnData from '../../models/warnings';

const command: Command = {
	config: {
		commandName: 'mute',
		commandAliases: ['timedMute', 'nospeak'],
		commandDescription: 'Mutes a user within the server.',
		userPermissions: 'ManageMessages',
		commandUsage: '<user> <time> <reason>',
		limitedChannel: 'None',
		slashCommand: true,
		slashOptions: [
			{
				name: 'user',
				description: 'The user who you would like to mute.',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'time',
				description: 'The time you would like to mute the user for.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'reason',
				description: 'The reason for the mute.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ bot, message, args, interaction }) => {
		let member: any;
		let time: any;
		let reason: any;

		if (!message) {
			member = interaction.options.getMember('user');
			time = args[1];
			reason = args[2];

			if (!member) return noUser(message, false, interaction as CommandInteraction);
		} else {
			member = getMember(message, String(args[0]), true);
			time = args[1];
			reason = args.slice(2).join(' ');

			if (!member) return noUser(message);
		}

		const userWarns = await warnData.findOne({ userID: member.id });

		if (member.permissions && member.permissions.has(PermissionFlagsBits.ManageMessages)) return equalPerms(message, 'Manage Messages');

		if (member.isCommunicationDisabled() === true) {
			const alreadyMutedEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle('❌ Already Muted!')
				.setDescription(`**${member.displayName}** is currently serving a mute.`)
				.setColor(EMBED_COLOURS.red);

			if (!message) {
				return interaction.followUp({ embeds: [alreadyMutedEmbed] });
			}

			return message.channel.send({ embeds: [alreadyMutedEmbed] });
		}

		if (!time || !ms(time)) {
			const noTime = new EmbedBuilder() // prettier-ignore
				.setTitle('⏱️ Supply a time!')
				.setDescription('Please supply a correct time for the command.')
				.setFooter({ text: 'H - Hours ● D - Days' })
				.setColor(EMBED_COLOURS.red);

			if (!message) {
				return interaction.followUp({ embeds: [noTime] });
			}

			return message.channel.send({ embeds: [noTime] });
		}

		member.timeout(ms(time), reason);

		const successEmbed = new EmbedBuilder() // prettier-ignore
			.setDescription(`✅ **${member.displayName} has been muted for ${ms(ms(time))}.**`)
			.setColor(EMBED_COLOURS.green);

		if (!message) {
			interaction.followUp({ embeds: [successEmbed] });
		} else {
			message.channel.send({ embeds: [successEmbed] });
		}

		// -- Adding warning to user
		if (!userWarns) {
			await warnData.create({
				userID: member.id,
				warnings: [{ _id: new Types.ObjectId(), date: new Date(), moderator: message ? message.author.id : interaction.user.id, reason: `**[${ms(ms(time))} mute]** ${reason}` }],
			});
		} else {
			userWarns.warnings.push({ _id: new Types.ObjectId(), date: new Date(), moderator: message ? message.author.id : interaction.user.id, reason: `**[${ms(ms(time))} mute]** ${reason}` });
			await userWarns.save();
		}

		await moderationDmEmbed(member, `Mute`, `Hello **${member.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a **${ms(ms(time))} mute** on our Discord Server.\n\nIf you continue to break the rules, your account will receive further penalties. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, reason);
		await moderationEmbed(message, bot, `${ms(ms(time))} Mute`, member, reason, false, interaction as CommandInteraction);
	},
};

export = command;
