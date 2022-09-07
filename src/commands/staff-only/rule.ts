import { Command, ApplicationCommandOptionType } from 'discord.js';
import { RULE_CHOICES } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'rule',
		commandAliases: ['serverRule'],
		commandDescription: 'Recites a rule within the server.',
		userPermissions: 'ManageMessages',
		commandUsage: '<rule-number> [user]',
		limitedChannel: 'None',
		slashOptions: [
			{
				name: 'rule-number',
				description: 'The rule number to be recited by the bot.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: RULE_CHOICES,
			},
			{
				name: 'user',
				description: 'The user the rule is directed towards.',
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ args, interaction }) => {
		/* If unable to get user */
		if (!interaction.inCachedGuild()) return interaction.followUp({ content: `${args[0]}` });

		let member = interaction.options.getMember('user');
		if (!member) member = null;

		return interaction.followUp({ content: `${member ? `<@${member.id}>,` : ''} ${args[0]}` });
	},
};

export = command;
