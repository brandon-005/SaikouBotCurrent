/* eslint-disable no-restricted-globals */
import { Command, Message, EmbedBuilder } from 'discord.js';

import triviaData from '../../models/trivias';
import { EMBED_COLOURS, PROMPT_TIMEOUT } from '../../utils/constants';
import { interactiveSetup } from '../../utils/embeds';

const command: Command = {
	config: {
		commandName: 'addtrivia',
		commandAliases: ['addquestion'],
		commandDescription: 'Used for adding new trivia questions for the .trivia command.',
		developerOnly: true,
		limitedChannel: 'None',
	},
	run: async ({ bot, message }) => {
		//	let noOption = false;

		function cancel(userMessage: Message) {
			if (userMessage.content.toLowerCase() === 'cancel') {
				return message!.channel.send('Cancelled!');
			}
		}

		interactiveSetup(message!, bot, false, '1/4', '❓ **What is the trivia question?**');

		const fetchQuestion = await message.channel.awaitMessages({ filter: (msg: Message) => msg.author.id === message.author.id, time: PROMPT_TIMEOUT, max: 1 });
		const questionContent = fetchQuestion.first();

		if (cancel(questionContent!)) return;

		interactiveSetup(message, bot, false, '2/4', '❓ **Which options should be a choosable answer? Please separate the options with a `|`.**');

		const fetchOptions = await message.channel.awaitMessages({ filter: (msg: Message) => msg.author.id === message.author.id, time: PROMPT_TIMEOUT, max: 1 });
		const optionsContent = fetchOptions.first();
		const optionArray = optionsContent
			.toString()
			.split('|')
			.map((option: string) => option.trim());

		if (cancel(optionsContent!)) return;

		interactiveSetup(
			message,
			bot,
			false,
			'4/4',
			`❓ **Which option do you want the answer to be? Please reply with the answer to the question.\n\n__Options__\n${optionsContent!
				.toString()
				.split('|')
				.map((option: string, number: number) => `${number}) ${option}\n`)
				.join('')}**`
		);

		const fetchAnswer = await message.channel.awaitMessages({ filter: (msg: Message) => msg.author.id === message.author.id, time: PROMPT_TIMEOUT, max: 1 });
		const answerContent = fetchAnswer.first();

		if (cancel(answerContent!)) return;

		// optionArray.forEach((option: string, count: number) => {
		// 	console.log(`Inputted: ${answerContent.toString()}\nOption: ${option.toString()}`)
		// 	if (answerContent.toString() !== option.toString() && count + 1 === optionArray.length) {
		// 		noOption = true;
		// 	}
		// });

		// if (noOption !== false) return message.channel.send('That is not a valid option to choose from.');

		interactiveSetup(message, bot, false, '3/4', `❓ **How many points would you like to award for this question?**`);

		const fetchPoints = await message.channel.awaitMessages({ filter: (msg: Message) => msg.author.id === message.author.id, time: PROMPT_TIMEOUT, max: 1 });
		const pointsContent = fetchPoints.first();

		if (cancel(pointsContent!)) return;
		if (isNaN(Number(pointsContent!.toString()))) return message.channel.send('Not a number.');

		const confirm = await message.channel.send({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('Are you sure?')
					.setDescription(
						`Please confirm this final prompt to add the question.\n\n❓ **Are the following fields correct for the question?**\n\n• \`Question Title\` - **${questionContent.toString()}**\n• \`Options\` - **${optionsContent
							.toString()
							.split('|')
							.map((option: string) => `${option} | `)
							.join('')
							.slice(0, -2)}**\n• \`Answer\` - **${answerContent.toString()}**\n• \`Points\` - **${pointsContent.toString()}**\n\nIf the fields above look correct you can add this question by reacting with a ✅ or cancel with ❌ if these fields don't look right.`
					)
					.setFooter({ text: `Setup by ${message.author.tag} | Prompt will timeout in 2 mins`, iconURL: message.author.displayAvatarURL() })
					.setColor(EMBED_COLOURS.red),
			],
		});
		confirm.react('✅');
		confirm.react('❌');

		const collectingConfirmation = await confirm.awaitReactions({ filter: (reaction: any, user: any) => ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
		const confirmationResult = collectingConfirmation.first()?.emoji.name;

		if (confirmationResult === '✅') {
			await triviaData.create({
				question: questionContent.toString(),
				options: optionArray,
				answer: answerContent!.toString(),
				points: parseInt(pointsContent.content, 10),
			});

			return message.channel.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('✅ Question Added')
						.setDescription('The new question has been successfully added to the trivia.')
						.setColor(EMBED_COLOURS.green)
						.setFooter({ text: `Setup by ${message.author.tag} | Prompt will timeout in 2 mins`, iconURL: message.author.displayAvatarURL() }),
				],
			});
		}

		return message.channel.send('Cancelled.');
	},
};

export = command;
