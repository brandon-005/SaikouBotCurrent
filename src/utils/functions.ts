import { GuildMember, Client, TextChannel, AutoModerationActionExecution } from 'discord.js';
import { Types } from 'mongoose';
import axios from 'axios';

import QuestionNumber from '../models/count';
import QotdQuestion from '../models/qotd';
import WyrQuestion from '../models/wyrQuestion';
import WeeklyTrivia from '../models/weeklyTrivia';
import TriviaUsers from '../models/correctTrivia';
import warnData from '../models/warnings';
import { autoModDmEmbed, moderationEmbed } from './embeds';
import { WarningTypes } from '../TS/interfaces';

/* Get a random number */
export function getRandomInt(min: number, max: number) {
	const minimumNumber = Math.ceil(min);

	return Math.floor(Math.random() * (Math.floor(max) - minimumNumber) + minimumNumber);
}

/* Choose a result in an array */
export function choose(inputtedArray: Array<string>) {
	return inputtedArray[getRandomInt(inputtedArray.length, 0)];
}

/* Get server member */
export function getMember(message: any, inputtedUser: string, moderation?: Boolean) {
	const inputtedUserLowerCase = inputtedUser.toLowerCase();
	const userIDMatch = inputtedUserLowerCase.match(/\d{17,19}/);

	if (userIDMatch) {
		const FoundUserByID = message.guild!.members.cache.get(userIDMatch[0]);
		if (FoundUserByID) return FoundUserByID;
	}

	if (inputtedUserLowerCase) {
		const FoundUserByName = message.guild.members.cache.find((member: GuildMember) => member.displayName.toLowerCase().includes(inputtedUserLowerCase) || member.user.tag.toLowerCase().includes(inputtedUserLowerCase));
		if (FoundUserByName) return FoundUserByName;
	}

	if (moderation && moderation === true) return null;

	return message.member;
}

export async function sendQuestion(bot: Client, WYR?: boolean) {
	const questionCounter = await QuestionNumber.findOne({ id: 1 });
	const currentQuestion: any = WYR ? await WyrQuestion.find({}) : await QotdQuestion.find({});
	const sendQuestionChannel = bot.channels.cache.find((channel: any) => channel.name === `${WYR ? '🤔would-you-rather' : '❔question-of-the-day'}`) as TextChannel;

	/* Send Question If Counter Doesn't Exist */
	if (!questionCounter) {
		QuestionNumber.create({
			id: 1,
			count: 0,
		});

		if (!WYR || WYR !== true) {
			return sendQuestionChannel.send({ content: '<@&692394198451748874>\n**Question of the day: What is one app that you hate but still use anyways?**\nSubmit your answer in <#398237638492160000> and keep up to date with our next question tomorrow!' });
		}

		return sendQuestionChannel.send({ content: '<@&692394198451748874>\n**Would You Rather**\nA: Eat a sandwich made with moldy bread\nB: Eat a sandwich made with stale bread' }).then(async (msg) => {
			await msg.react('🅰️');
			await msg.react('🅱️');
		});
	}

	/* Send Question If Counter Exists */
	questionCounter.count += 1;
	await questionCounter.save();

	if (!WYR || WYR !== true) {
		return sendQuestionChannel.send({ content: `<@&692394198451748874>\n${currentQuestion[questionCounter.count].question}\nSubmit your answer in <#398237638492160000> and keep up to date with our next question tomorrow!` });
	}

	return sendQuestionChannel.send({ content: `<@&692394198451748874>\n**Would You Rather**\n${currentQuestion[questionCounter.count].optionA}\n${currentQuestion[questionCounter.count].optionB}` }).then(async (msg) => {
		await msg.react('🅰️');
		await msg.react('🅱️');
	});
}

export async function awardRole(bot: Client, weekly?: boolean) {
	const topUser = weekly ? await WeeklyTrivia.find({}, '-_id').sort({ answersCorrect: -1 }).limit(1) : await TriviaUsers.find({}, '-_id').sort({ answersCorrect: -1 }).limit(1);

	if (!topUser.length) return;

	const server = bot.guilds.cache.get(`${BigInt(String(process.env.SERVER_ID))}`);
	const kingUsers = server.roles.cache.find((role: any) => role.name === `${weekly ? 'Weekly Champion 🌅' : 'Trivia King 👑'}`)!.members.map((member: GuildMember) => member.user.id);
	const topUserInServer = server.members.cache.get(`${BigInt(Object.values(topUser)[0]!.userID)}`);

	if (kingUsers.length === 0 && topUserInServer) {
		topUserInServer.roles.add(server.roles.cache.find((role: any) => role.name === `${weekly ? 'Weekly Champion 🌅' : 'Trivia King 👑'}`)!, 'New Leaderboard King!');
		(bot.channels.cache.get(process.env.OFFTOPIC_CHANNEL) as TextChannel).send({
			content: weekly ? `<@${Object.values(topUser)[0]!.userID}> is the new weekly trivia champion! 🌅` : `<@${Object.values(topUser)[0]!.userID}> is the new trivia leaderboard king! 👑`,
		});
	}

	kingUsers.forEach(async (userID: string) => {
		const oldTopUserInServer = server.members.cache.get(`${BigInt(userID)}`);

		if (topUserInServer && oldTopUserInServer) {
			if (String(userID) !== String(Object.values(topUser)[0]!.userID)) {
				/* Removing Role from old leaderboard king */
				oldTopUserInServer.roles.remove(server.roles.cache.find((role: any) => role.name === `${weekly ? 'Weekly Champion 🌅' : 'Trivia King 👑'}`)!, 'New Leaderboard King!').catch(() => {});

				/* Adding Role to new leaderboard king */
				topUserInServer.roles.add(server.roles.cache.find((role: any) => role.name === `${weekly ? 'Weekly Champion 🌅' : 'Trivia King 👑'}`)!, 'New Leaderboard King!').catch(() => {});

				(bot.channels.cache.get(process.env.OFFTOPIC_CHANNEL) as TextChannel).send({
					content: weekly ? `<@${Object.values(topUser)[0]!.userID}> is the new weekly trivia champion! 🌅` : `<@${Object.values(topUser)[0]!.userID}> is the new trivia leaderboard king! 👑`,
				});
			}
		}
	});
}

export async function fetchRobloxUser(username: string) {
	let robloxName = '';
	let robloxID = '';
	let invalidUser = false;
	let error = false;

	await axios({
		method: 'post',
		url: 'https://users.roblox.com/v1/usernames/users',
		data: {
			usernames: [username],
		},
	})
		.then((response: any) => {
			robloxName = response.data.data.map((value: any) => value.name);
			robloxID = response.data.data.map((value: any) => value.id);
			if (response.data.data.length === 0) invalidUser = true;
		})
		.catch(() => (error = true));

	return { robloxName: robloxName.toString(), robloxID: robloxID.toString(), invalid: invalidUser, error };
}

export async function checkAboutMe(robloxID: string, phrase: string) {
	let error = false;
	let correctPhrase = false;
	const aboutMe = await axios
		.get(`https://users.roblox.com/v1/users/${robloxID}`)
		.then((response: any) => response.data.description)
		.catch(() => (error = true));

	if (aboutMe.toLowerCase().includes(phrase.toLowerCase())) {
		correctPhrase = true;
	}

	return { correctPhrase, error };
}

export async function checkFollowerRoles(robloxID: string) {
	let error = false;
	let followerRole: string | null = null;

	await axios
		.get(`https://groups.roblox.com/v2/users/${robloxID}/groups/roles`)
		.then((response: any) => {
			if (response.data.data.length === 1 && response.data.data.map((groupData: any) => groupData.group.name).toString() === 'Saikou') {
				followerRole = response.data.data.map((groupRole: any) => groupRole.role.name)[0];
			}

			for (const groupInfo of response.data.data) {
				if (groupInfo.group.name.toString() === 'Saikou') {
					followerRole = groupInfo.role.name;
				}
			}
		})
		.catch(() => (error = true));

	return { followerRole, error };
}

export async function autoPunish(data: AutoModerationActionExecution, actionReason: string, autoModFilter: string, bot: any) {
	const warningObj = {
		_id: new Types.ObjectId(),
		date: new Date(),
		moderator: 'SaikouDev',
		reason: `${actionReason} [AUTOMATIC]`,
	};

	const userWarns = await warnData.findOne({ userID: data.user.id });

	if (!userWarns) {
		await warnData.create({
			userID: data.user.id,
			warnings: [warningObj],
		});

		return autoModDmEmbed(
			data, // prettier-ignore
			data.member,
			'Warning',
			`Hello **${data.user.username}**,\n\nYour account has recently been flagged by a staff member for breaching Saikou's Community Rules.\n\nTo learn more about our server rules, visit <#397797150840324115>\n\nWe take these actions seriously. If you continue to break the rules, we may need to take additional action against your account, which could result in a permanent ban from the Saikou Discord.\n\nPlease check the attached moderator note below for more details.`,
			`${actionReason} [AUTOMATIC]`,
			`<@${data.user.id}>, You have been automatically warned for breaking Saikou's rules.\n\n**Infraction:** ${actionReason}`
		);
	}

	userWarns!.warnings.push(warningObj);
	await userWarns!.save();

	switch (userWarns!.warnings.length) {
		case 3:
			if (data.member!.isCommunicationDisabled() === true) {
				await autoModDmEmbed(
					data, // prettier-ignore
					data.member,
					'Warning',
					`Hello **${data.user.username}**,\n\nYour account has recently been flagged by a staff member for breaching Saikou's Community Rules.\n\nTo learn more about our server rules, visit <#397797150840324115>\n\nWe take these actions seriously. If you continue to break the rules, we may need to take additional action against your account, which could result in a permanent ban from the Saikou Discord.\n\nPlease check the attached moderator note below for more details.`,
					`${actionReason} [AUTOMATIC]`,
					`<@${data.user.id}>, You have been automatically warned for breaking Saikou's rules.\n\n**Infraction:** ${actionReason}`
				);
			} else {
				await data.member?.timeout(10800000, 'Reached 3 warnings.');

				await autoModDmEmbed(
					data, // prettier-ignore
					data.member,
					'Mute',
					`Hello **${data.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a **3h mute** on our Discord Server.\n\nIf you continue to break the rules, your account will receive further penalties. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`,
					`${actionReason} [AUTOMATIC]`,
					`<@${data.user.id}>, You have been automatically muted for 3 hours for breaking Saikou's rules (Reached 3 warnings).\n\n**Infraction:** ${actionReason}`
				);

				await moderationEmbed(null, bot, '3h Mute', data.member, `User triggered SaikouBot's auto moderation for ${autoModFilter}. (Reached 3 warnings)`, false, null, 'SaikouDev');
				bot.channels.cache.find((channel: TextChannel) => channel.name === '📂moderation').send({ content: `**<t:${Math.floor(Date.now() / 1000)}:F> | ${data.user.username}**\nContent: ${data.content}` });
			}
			break;

		case 4:
			if (data.member!.isCommunicationDisabled() === true) {
				await autoModDmEmbed(
					data, // prettier-ignore
					data.member,
					'Warning',
					`Hello **${data.user.username}**,\n\nYour account has recently been flagged by a staff member for breaching Saikou's Community Rules.\n\nTo learn more about our server rules, visit <#397797150840324115>\n\nWe take these actions seriously. If you continue to break the rules, we may need to take additional action against your account, which could result in a permanent ban from the Saikou Discord.\n\nPlease check the attached moderator note below for more details.`,
					`${actionReason} [AUTOMATIC]`,
					`<@${data.user.id}>, You have been automatically warned for breaking Saikou's rules.\n\n**Infraction:** ${actionReason}`
				);
			} else {
				await data.member?.timeout(259200000, 'Reached 4 warnings.');
				await autoModDmEmbed(
					data, // prettier-ignore
					data.member,
					'Mute',
					`Hello **${data.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a **3d mute** on our Discord Server.\n\nIf you continue to break the rules, your account will receive further penalties. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`,
					`${actionReason} [AUTOMATIC]`,
					`<@${data.user.id}>, You have been automatically muted for 3 days for breaking Saikou's rules (Reached 4 warnings).\n\n**Infraction:** ${actionReason}`
				);

				await moderationEmbed(null, bot, '3d Mute', data.member, `User triggered SaikouBot's auto moderation for ${autoModFilter}. (Reached 4 warnings)`, false, null, 'SaikouDev');
				bot.channels.cache.find((channel: TextChannel) => channel.name === '📂moderation').send({ content: `**<t:${Math.floor(Date.now() / 1000)}:F> | ${data.user.username}**\nContent: ${data.content}` });
			}
			break;

		case 5:
			await autoModDmEmbed(
				data, // prettier-ignore
				data.member,
				'Kick',
				`Hello **${data.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a kick from our Discord Server.\n\nIf you continue to break the rules, your account will be permanently banned from accessing the Discord Server. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`,
				`${actionReason} [AUTOMATIC]`,
				`<@${data.user.id}>, You have been automatically kicked for breaking Saikou's rules (Reached 5 warnings).\n\n**Infraction:** ${actionReason}`
			);

			await moderationEmbed(null, bot, 'Kick', data.member, `User triggered SaikouBot's auto moderation for ${autoModFilter}. (Reached 5 warnings)`, false, null, 'SaikouDev');
			bot.channels.cache.find((channel: TextChannel) => channel.name === '📂moderation').send({ content: `**<t:${Math.floor(Date.now() / 1000)}:F> | ${data.user.username}**\nContent: ${data.content}` });

			data.member!.kick('Reached 5 warnings.');
			break;

		case 6:
			await autoModDmEmbed(
				data, // prettier-ignore
				data.member,
				'Ban',
				`Hello **${data.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules for the final time. Because of this, your account has been permanently banned from the Saikou Discord.\n\nIf you believe this is a mistake, submit an appeal by visiting\nhttps://forms.gle/L98zfzbC8fuAz5We6\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`,
				`${actionReason} [AUTOMATIC]`,
				`<@${data.user.id}>, You have been automatically banned for breaking Saikou's rules (Reached 6 warnings).\n\n**Infraction:** ${actionReason}`
			);

			await moderationEmbed(null, bot, 'Ban', data.member, `User triggered SaikouBot's auto moderation for ${autoModFilter}. (Reached 6 warnings)`, false, null, 'SaikouDev');
			bot.channels.cache.find((channel: TextChannel) => channel.name === '📂moderation').send({ content: `**<t:${Math.floor(Date.now() / 1000)}:F> | ${data.user.username}**\nContent: ${data.content}` });

			data.member!.ban({ deleteMessageSeconds: 604800, reason: 'Reached 6 warnings.' });
			break;
		default:
			await autoModDmEmbed(
				data, // prettier-ignore
				data.member,
				'Warning',
				`Hello **${data.user.username}**,\n\nYour account has recently been flagged by a staff member for breaching Saikou's Community Rules.\n\nTo learn more about our server rules, visit <#397797150840324115>\n\nWe take these actions seriously. If you continue to break the rules, we may need to take additional action against your account, which could result in a permanent ban from the Saikou Discord.\n\nPlease check the attached moderator note below for more details.`,
				`${actionReason} [AUTOMATIC]`,
				`<@${data.user.id}>, You have been automatically warned for breaking Saikou's rules.\n\n**Infraction:** ${actionReason}`
			);
			break;
	}
}

export async function punishmentLevel(warnInfo: WarningTypes) {
	/* Determining Moderation Action */
	let modAction = '';

	if (!warnInfo) {
		modAction = 'Warning (1 Warn)';
	} else {
		switch (warnInfo.warnings.length) {
			case 0:
				modAction = 'Warning (1 warn)';
				break;
			case 1:
				modAction = 'Warning (2 warns)';
				break;
			case 2:
				modAction = '3 Hour Timeout (3 warns)';
				break;
			case 3:
				modAction = '3 Day Timeout (4 warns)';
				break;
			case 4:
				modAction = 'Server Kick (5 warns)';
				break;
			case 5:
				modAction = 'Server Ban (6 warns)';
				break;
			default:
				modAction = `Warning (${warnInfo.warnings.length + 1} warns)`;
		}
	}

	return modAction;
}
