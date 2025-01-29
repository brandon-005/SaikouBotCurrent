import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import triviaData from '../../models/correctTrivia';
import tokenData from '../../models/weaponTokens';
import { EMBED_COLOURS } from '../../utils/constants';
import { noUser } from '../../utils/embeds';

const command: Command = {
	config: {
		commandName: 'saikousay',
		commandAliases: ['saikoubotsay'],
		commandDescription: 'Make a post that SaikouBot says.',
		limitedChannel: 'None',
		userPermissions: 'ManageChannels',
		commandUsage: '<channel> <message>',
		slashOptions: [
			{
				name: 'channel',
				description: 'The channel you would like the message posted in.',
				type: ApplicationCommandOptionType.Channel,
				required: true,
			},
			{
				name: 'message',
				description: 'The message you would like to post in the channel.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ interaction, args }) => {
		console.log(args[0], 'args2', args[1]);

		interaction.editReply({ content: 'success' });
	},
};

export = command;
