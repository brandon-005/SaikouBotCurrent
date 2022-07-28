import { Client } from 'discord.js';
import { redBright } from 'chalk';
import { readdirSync } from 'fs';

export = (bot: Client) => {
	const load = (directories: string) => {
		let events: string[] = [];

		try {
			events = readdirSync(`${__dirname}/../events/${directories}/`).filter((directoryFile: string) => directoryFile.endsWith('.js'));
		} catch {
			return console.error(`${redBright('ERROR!')} The event folder "${directories}" couldn't be loaded.\n${redBright('ERROR!')} Please ensure a file is added in it to be loaded.`);
		}

		for (const eventFile of events) {
			const event = require(`${__dirname}/../events/${directories}/${eventFile}`);
			const eventName: any = eventFile.split('.')[0];

			try {
				bot.on(eventName, event.bind(null, bot));
			} catch {
				return console.error(`${redBright('ERROR!')} The event file "${eventFile}" couldn't be loaded.\n${redBright('ERROR!')} Please ensure an export is included within the file.`);
			}
		}
	};
	['bot', 'cmd-handler', 'discord-server'].forEach((folder) => load(folder));
};
