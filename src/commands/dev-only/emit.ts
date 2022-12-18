import { Command, ApplicationCommandOptionType } from 'discord.js';

const command: Command = {
	config: {
		commandName: 'emit',
		commandAliases: ['botban'],
		commandDescription: 'DEVELOPER ONLY - Emitting events.',
		limitedChannel: 'None',
		developerOnly: true,
		slashOptions: [
			{
				name: 'event',
				description: 'Which event you would like to emit.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: 'guildMemberAdd',
						value: 'guildMemberAdd',
					},
					{
						name: 'guildMemberRemove',
						value: 'guildMemberRemove',
					},
				],
			},
			{
				name: 'user',
				description: 'User to emit event with.',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
		],
	},
	run: async ({ bot, interaction, args }) => {
		bot.emit(args[0], interaction.options.getMember('user'));

		return interaction.editReply({ content: `Successfully emitted the **${args[0]}** event.` });
	},
};

export = command;
