import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import { EMBED_COLOURS, EIGHTBALL_REPLIES } from '../../utils/constants';
import { choose } from '../../utils/functions';

const command: Command = {
	config: {
		commandName: '8ball',
		commandAliases: ['question', '8b', 'ask'],
		commandDescription: "Have a burning question but don't know who to ask? Introducing 8ball, the only answer to your problem you'll ever need.",
		commandUsage: '<question>',
		slashOptions: [
			{
				name: 'question',
				description: '8ball question',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ interaction, args }) =>
		interaction.followUp({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('🎱 8ball Results')
					.addFields([
						// prettier-ignore
						{ name: 'Question', value: args.join(' ') },
						{ name: 'Answer', value: `${choose(EIGHTBALL_REPLIES)}` },
					])

					.setThumbnail(interaction.user.displayAvatarURL({ size: 512 }))
					.setFooter({ text: `Asked by ${interaction.guild?.members.cache.get(interaction.user!.id)?.displayName}`, iconURL: interaction.user.displayAvatarURL({ size: 64 }) })
					.setTimestamp()
					.setColor(EMBED_COLOURS.blurple),
			],
		}),
};

export = command;
