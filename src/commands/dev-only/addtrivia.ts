import { Command, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ComponentType, Interaction, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';

import { EMBED_COLOURS, PROMPT_TIMEOUT } from '../../utils/constants';
import trivias from '../../models/trivias';
import { getRandomInt } from '../../utils/functions';

const command: Command = {
	config: {
		commandName: 'addtrivia',
		commandAliases: ['newtrivia'],
		commandDescription: 'Use this command to add new trivia questions.',
		developerOnly: true,
		slashOptions: [
			{
				name: 'question',
				description: 'The trivia question.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'choice-1',
				description: 'The first choice to choose from.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'choice-2',
				description: 'The second choice to choose from.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'choice-3',
				description: 'The third choice to choose from.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'difficulty',
				description: 'The question difficulty.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: '😎 Easy',
						value: 'Easy',
					},
					{
						name: '🤔 Medium',
						value: 'Medium',
					},
					{
						name: '😨 Hard',
						value: 'Hard',
					},
					{
						name: '😱 Very Hard',
						value: 'Very Hard',
					},
				],
			},
			{
				name: 'choice-4',
				description: 'The fourth choice to choose from.',
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	},
	run: async ({ interaction, args }) => {
		const choices = [args[1], args[2], args[3]];
		const selectMenuOptions: any = [];

		if (args[5]) choices.push(args[5]);

		choices.forEach((option) => {
			selectMenuOptions.push({
				label: option,
				value: option,
				emoji: '🔢',
			});
		});

		interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('Select Answer 🔎')
					.setDescription('Please select the answer for the trivia question below.')
					.setColor(EMBED_COLOURS.blurple),
			],
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>() // prettier-ignore
					.addComponents([new StringSelectMenuBuilder().setCustomId('answer-menu').setPlaceholder('Please select an answer').addOptions(selectMenuOptions)]),
			],
		});

		const menuCollector = interaction.channel.createMessageComponentCollector({ filter: (msgInteraction: Interaction) => msgInteraction.user.id === interaction.user.id, componentType: ComponentType.StringSelect, time: PROMPT_TIMEOUT });

		menuCollector.on('collect', async (selectMenu: StringSelectMenuInteraction) => {
			const finalAnswer = selectMenu.values;
			let finalPoints = 0;

			switch (args[4]) {
				case 'Easy':
					finalPoints = getRandomInt(1, 2);
					break;

				case 'Medium':
					finalPoints = getRandomInt(2, 3);
					break;

				case 'Hard':
					finalPoints = getRandomInt(3, 4);
					break;

				case 'Very Hard':
					finalPoints = getRandomInt(4, 5);
					break;
			}

			await trivias.create({
				question: args[0],
				options: choices,
				answer: finalAnswer.toString(),
				points: finalPoints,
				difficulty: args[4],
			});

			selectMenu.update({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('✅ Success!')
						.setDescription('Your question has been added.')
						.setColor(EMBED_COLOURS.green)
						.setTimestamp(),
				],
				components: [],
			});

			menuCollector.stop();
		});
	},
};

export = command;
