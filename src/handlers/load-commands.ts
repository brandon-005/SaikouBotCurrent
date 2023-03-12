import { readdirSync } from 'fs';
import { redBright } from 'chalk';
import { Client } from 'discord.js';

const arrayOfSlashCommands: any = [];

export = (bot: Client) => {
	const load = (directories: string) => {
		let commands: string[] = [];

		try {
			commands = readdirSync(`${__dirname}/../commands/${directories}/`).filter((directoryFile: string) => directoryFile.endsWith('.js'));
		} catch {
			return console.error(`${redBright('ERROR!')} The command folder "${directories}" couldn't be loaded.\n${redBright('ERROR!')} Please ensure a file is added in it to be loaded.`);
		}

		for (const commandFile of commands) {
			const command = require(`${__dirname}/../commands/${directories}/${commandFile}`);

			if (!command.config) return console.error(`${redBright('ERROR!')} The command file "${commandFile}" couldn't be loaded.\n${redBright('ERROR!')} Please ensure the config options are added for it to be loaded.`);

			/* CONTEXT MENU HANDLER */
			if (command.config.type) {
				bot.slashCommands.set(command.config.commandName, command);
				arrayOfSlashCommands.push({
					name: command.config.commandName,
					type: command.config.type,
					options: command.config.slashOptions,
				});
			} else {
				/* SLASH COMMAND HANDLER */
				bot.slashCommands.set(command.config.commandName, command);

				if (!command.config.commandDescription) command.config.commandDescription = 'No Description Provided.';

				arrayOfSlashCommands.push({
					name: command.config.commandName,
					description: command.config.commandDescription.length > 100 ? `${command.config.commandDescription.substring(0, 97)}...` : command.config.commandDescription,
					options: command.config.slashOptions,
					type: command.config.type,
				});
			}
		}
	};
	['fun', 'dev-only', 'staff-only', 'information', 'context-menu', 'verification'].forEach((folder) => load(folder));

	bot.on('ready', async () => {
		if (process.env.TEST === 'true') {
			bot.guilds.cache.get('840280079536095314')!.commands.set(arrayOfSlashCommands);
		} else {
			bot.application?.commands.set(arrayOfSlashCommands);
		}
	});
};
