import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import { EMBED_COLOURS, EIGHTBALL_REPLIES } from '../../utils/constants';
import { choose } from '../../utils/functions';

const command: Command = {
	config: {
		commandName: '8ball',
		commandAliases: ['question', '8b', 'ask'],
		commandDescription: "Have a burning question but don't know who to ask? Introducing 8ball, the only answer to your problem you'll ever need.",
		commandUsage: '<question>',
		serverOnly: false,
		slashCommand: true,
		slashOptions: [
			{
				name: 'question',
				description: '8ball question',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ message, args, interaction }) => {
		const noQuestion = new EmbedBuilder() // prettier-ignore
			.setTitle('✍️ No question asked!')
			.setDescription('Please input a question for the 8ball to answer.')
			.setColor(EMBED_COLOURS.red)
			.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png');

		const ballEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('🎱 8ball Results')
			.addFields([
				// prettier-ignore
				{ name: 'Question', value: args.join(' ') },
				{ name: 'Answer', value: `${choose(EIGHTBALL_REPLIES)}` },
			])

			.setThumbnail(message ? message.author.displayAvatarURL({ size: 512 }) : interaction.user.displayAvatarURL({ size: 512 }))
			.setFooter({ text: `Asked by ${message ? message.guild?.members.cache.get(message.author!.id)?.displayName : interaction.guild?.members.cache.get(interaction.user!.id)?.displayName}`, iconURL: message ? message.author.displayAvatarURL({ size: 64 }) : interaction.user.displayAvatarURL({ size: 64 }) })
			.setTimestamp()
			.setColor(EMBED_COLOURS.blurple);

		if (message) {
			if (!args[1]) return message.channel.send({ embeds: [noQuestion] });
			return message.channel.send({ embeds: [ballEmbed] });
		}

		return interaction.followUp({ embeds: [ballEmbed] });
	},
};

export = command;
