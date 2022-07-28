import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import { choose } from '../../utils/functions';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'decide',
		commandAliases: ['decide', 'choose'],
		commandDescription: 'Can’t decide between Marmite or vegemite? Well don’t you worry, our bot will decide between the two for the best of the best.',
		commandUsage: '<option1⠀|⠀option2> [extra_options]',
		serverOnly: false,
		slashCommand: true,
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
	run: async ({ message, args, interaction }) => {
		let options;

		if (!message) {
			options = args.map((choice) => `• ${choice}\n`);
		} else {
			options = args
				.join(' ')
				.split('| ')
				.filter((option) => option !== '')
				.filter((option) => option !== '|')
				.map((choice) => `• ${choice}\n`);

			if (options.length <= 1)
				return message.reply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('📋 Incorrect Usage!')
							.setDescription('Improper usage for the **decide** command, please refer below.\n\n```Usage: .decide <question1 | question2> [extra_options]\n\n<question1 | question2> is required for the command to run.```')
							.setColor(EMBED_COLOURS.red)
							.setFooter({ text: '<> - Required ● Optional - []' }),
					],
				});
		}

		const decideEmbed = new EmbedBuilder() //
			.setTitle('📝 Decide Results')
			.setDescription(`Hmmm... that's a tough one, I choose **${choose(options)?.replace('•', '')}**`)
			.addFields([{ name: 'Options', value: String(options).replace(/,/g, '') }])
			.setColor('Random');

		if (!message) {
			return interaction.followUp({ embeds: [decideEmbed] });
		}

		return message.channel
			.send({
				embeds: [decideEmbed],
			})
			.catch(() =>
				message.channel.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('Woah there!')
							.setDescription("That's too many options for us to display, chillax a little.")
							.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
							.setColor(EMBED_COLOURS.red),
					],
				})
			);
	},
};

export = command;
