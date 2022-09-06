import { PermissionsString, Client, Message, CommandInteraction, ContextMenuInteraction, Collection, Command, ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';

declare module 'discord.js' {
	export interface Channel {
		name: any;
	}

	export interface Command {
		config: {
			commandName: string;
			commandAliases: string[];
			commandDescription: string;
			COOLDOWN_TIME?: number;
			developerOnly?: boolean;
			userPermissions?: PermissionsString;
			commandUsage?: string;
			limitedChannel?: string;
			slashOptions?: { name: string; description: string; type: ApplicationCommandOptionType; required: boolean; choices?: { name: string; value: string }[] }[];
		};
		run: ({ bot, message, args, interaction }: { bot: Client; message?: Message; args?: string[]; interaction?: CommandInteraction }) => Promise<any>;
	}

	export interface ContextMenu {
		config: {
			commandName: string;
			type: ApplicationCommandType;
		};
		run: ({ bot, args, interaction }: { bot: Client; args?: string[]; interaction?: ContextMenuInteraction }) => Promise<any>;
	}
}

declare module 'discord.js' {
	export interface Client {
		[key: string];
		cooldowns: Collection<string, number>;
		slashCommands: Collection<string, Command>;
	}
}
