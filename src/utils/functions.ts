import { GuildMember } from 'discord.js';

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
