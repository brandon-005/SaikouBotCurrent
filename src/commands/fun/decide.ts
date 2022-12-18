import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import { choose } from '../../utils/functions';

const command: Command = {
	config: {
		commandName: 'decide',
		commandAliases: ['decide', 'choose'],
		commandDescription: 'Can’t decide between Marmite or vegemite? Well don’t you worry, our bot will decide between the two for the best of the best.',
		commandUsage: '<option1⠀|⠀option2> [extra_options]',
		slashOptions: [
			{
				name: 'first-option',
				description: 'The first option for the bot to choose from.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'second-option',
				description: 'The second option for the bot to choose from.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'third-option',
				description: 'The third option for the bot to choose from.',
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	},
	run: async ({ interaction, args }) => {
		const options = args.map((choice) => `• ${choice}\n`);

		return interaction.editReply({
			embeds: [
				new EmbedBuilder() //
					.setTitle('📝 Decide Results')
					.setDescription(`Hmmm... that's a tough one, I choose **${choose(options)?.replace('•', '')}**`)
					.addFields([{ name: 'Options', value: String(options).replace(/,/g, '') }])
					.setColor('Random'),
			],
		});
	},
};

export = command;
