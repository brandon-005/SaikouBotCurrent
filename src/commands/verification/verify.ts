import { Command, ApplicationCommandOptionType } from 'discord.js';

const command: Command = {
	config: {
		commandName: 'verify',
		commandAliases: ['verifyacc'],
		commandDescription: 'Link your Roblox account to your Discord account and gain full access to Saikou.',
		commandUsage: '[user]',
		slashOptions: [
			{
				name: 'user',
				description: "The user who's avatar you would like to view.",
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ interaction }) => interaction.editReply({ content: 'Coming Soon!' }),
};

export = command;
