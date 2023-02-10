import { GuildMember, Client, TextChannel } from 'discord.js';

import QuestionNumber from '../models/count';
import QotdQuestion from '../models/qotd';
import WyrQuestion from '../models/wyrQuestion';

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
