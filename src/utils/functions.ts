import { GuildMember, Client, TextChannel } from 'discord.js';

import QuestionNumber from '../models/count';
import QotdQuestion from '../models/qotd';
import WyrQuestion from '../models/wyrQuestion';
import WeeklyTrivia from '../models/weeklyTrivia';
import TriviaUsers from '../models/correctTrivia';
import axios from 'axios';

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
