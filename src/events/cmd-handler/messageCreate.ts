import { Client, Message, EmbedBuilder, ChannelType, WebhookClient } from 'discord.js';
import { readdirSync } from 'fs';
import { redBright, bold } from 'chalk';
import ms from 'ms';
import urlRegex from 'url-regex';
import blacklisted from '../../models/blacklistedUsers';

import { DISCORD_PERMISSIONS, EMBED_COLOURS, MESSAGE_TIMEOUT } from '../../utils/constants';
import { choose } from '../../utils/functions';

const webhookClient: WebhookClient = new WebhookClient({ id: `${BigInt(String(process.env.WEBHOOK_ID))}`, token: String(process.env.WEBHOOK_TOKEN) });

export = async (bot: Client, message: any) => {
	let prefix: string = process.env.PREFIX || '.';

	if (message.author.bot || message.interaction) return;

	if (message.content.startsWith(`<@${bot.user!.id}>`) || message.content.startsWith(`<@!${bot.user!.id}>`)) {
		prefix = `<@!${bot.user!.id}>`;
	}

	if (message.content === `<@${bot.user!.id}>` || message.content === `<@!${bot.user!.id}>`) {
		return message.channel.send({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setDescription(`You can use **${process.env.PREFIX || '.'}help** to view all of Saikou's commands.`)
					.setColor(EMBED_COLOURS.green),
			],
		});
	}

	if (message.channel.type === ChannelType.GuildText && message.channel.parent!.name === '🔖 | Feedback & reports') {
		/* DELETING MESSAGES IN CERTAIN CHANNEL */
		try {
			setTimeout(() => message.delete(), 500);
		} catch (err) {
			return;
		}
	}

	if (message.channel.type === ChannelType.GuildText && message.channel.name === '👋introductions') {
		try {
			setTimeout(() => message.delete(), 500);
		} catch (err) {
			return;
		}
	}

	if ((message.channel.type === ChannelType.GuildText && message.channel.name.match('memes')) || (message.channel.type === ChannelType.GuildText && message.channel.name.match('art'))) {
		if (!(message.attachments.size > 0 || urlRegex({ exact: false }).test(message.content))) {
			return message.delete().catch(() => {});
		}

		if (message.attachments.size > 0 && message.attachments.first().height < 5 && message.attachments.first().width < 5) {
			return message.delete().catch(() => {});
		}
	}

	const commandArguments: string[] = message.content.slice(prefix.length).trim().split(/ +/g);
	const inputtedCommand: string = commandArguments.shift()!.toLowerCase();

	if (message.content.startsWith(prefix)) {
		const commandFile = bot.commands.get(inputtedCommand) || bot.commands.get(`${bot.aliases.get(inputtedCommand)}`);

		if (!commandFile) return;

		const { commandName, developerOnly, userPermissions, commandUsage, limitedChannel, serverOnly } = commandFile.config;

		if (message.channel.type === ChannelType.DM && serverOnly !== false) return;

		/* --- COOLDOWN CONFIGURATION --- */
		let { COOLDOWN_TIME } = commandFile.config;

		if (bot.cooldowns.has(`${message.author.id}-${commandName}`)) {
			const titleOptions = ['🐌 Woah there, slow down!', '🦥 Way too fast there!'];

			return message
				.reply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle(String(choose(titleOptions)))
							.setDescription(`You must wait **${ms(bot.cooldowns.get(`${message.author.id}-${commandName}`)! - Date.now(), { long: true })}** before re-using the **${commandName}** command.\nThe default cooldown is \`${COOLDOWN_TIME || 5}s\`. `)
							.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
							.setColor(EMBED_COLOURS.red),
					],
					failIfNotExists: false,
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
		}

		if (!COOLDOWN_TIME) COOLDOWN_TIME = 5;

		bot.cooldowns.set(`${message.author.id}-${commandName}`, Date.now() + COOLDOWN_TIME * 1000);
		setTimeout(async () => {
			bot.cooldowns.delete(`${message.author.id}-${commandName}`);
		}, COOLDOWN_TIME * 1000);

		/* --- DEVELOPER ONLY CONFIGURATION --- */
		if (!developerOnly && readdirSync('dist/commands/dev-only').indexOf(`${commandName}.js`) > -1) {
			return console.error(`${redBright('ERROR!')} DevOnly config option not found in command "${commandName}".\n${redBright('ERROR!')} Add the following to your config options... ${bold('developerOnly: true/false')}`);
		}

		if (developerOnly === true && message.author.id !== '229142187382669312') {
			return message.channel.send('Developer only command.');
		}

		/* --- USER PERMISSIONS CONFIGURATION --- */
		if (!userPermissions && readdirSync('dist/commands/staff-only').indexOf(`${commandName}.js`) > -1) {
			return console.error(`${redBright('ERROR!')} UserPermissions config not found in command "${commandName}".\n${redBright('ERROR!')} Add the following to your config options... \nUserPermissions: ${DISCORD_PERMISSIONS}`);
		}

		if (userPermissions && !message.member?.permissions.has(userPermissions)) {
			return message
				.reply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('🔐 Incorrect Permissions')
							.setDescription(`**Command Name:** ${commandName}\n**Permissions Needed:** ${userPermissions}`)
							.setColor('#f94343')
							.setFooter({ text: 'Missing required permissions' }),
					],
					failIfNotExists: false,
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
		}

		/* --- LIMITED CHANNEL CONFIGURATION --- */
		if (message.channel.type === ChannelType.GuildText && limitedChannel && limitedChannel.toLowerCase() !== 'none') {
			if (message.channel.name.match(limitedChannel) === null) {
				return message
					.reply({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle("📌 Can't use this channel!")
								.setDescription(
									`The **${commandName}** command is limited to the **${message
										.guild!.channels.cache.filter((channel: any) => channel.name.match(limitedChannel))
										.map((channel: any) => channel.toString())
										.join(' or ')}** channel. Try relocating to that channel and trying again!`
								)
								.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
								.setColor(EMBED_COLOURS.red),
						],
						failIfNotExists: false,
					})
					.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT))
					.catch((err: Error) => console.log(`Caught Error: ${err}`));
			}
		}

		if (message.channel.type === ChannelType.GuildText && !limitedChannel && !message.member.permissions.has('ManageMessages')) {
			if (message.channel.name.match('🤖bot-commands') === null) {
				return message
					.reply({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle("📌 Can't use this channel!")
								.setDescription(`The **${commandName}** command is limited to the **${message.guild!.channels.cache.filter((channel: any) => channel.name.match('🤖bot-commands')).map((channel: any) => channel.toString())}** channel. Try relocating to that channel and trying again!`)
								.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
								.setColor(EMBED_COLOURS.red),
						],
						failIfNotExists: false,
					})
					.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
			}
		}

		/* --- COMMAND USAGES CONFIGURATION --- */
		if (commandUsage) {
			const usageArray = commandUsage.split(/[ ]+/);
			const usageObject: any = {};

			for (const eachUsage of usageArray) {
				if (eachUsage.startsWith('<') && eachUsage.endsWith('>')) usageObject[eachUsage] = true;
				else if (eachUsage.startsWith('[') && eachUsage.endsWith(']')) usageObject[eachUsage] = false;
				else return console.error(`${redBright('ERROR!')} usage config argument is neither required <> or optional []\n${redBright('ERROR!')} Usage argument content: "${eachUsage}"`);
			}

			if (commandArguments.length < commandUsage.length) {
				if (Object.values(usageObject)[commandArguments.length] === true) {
					if (prefix === `<@!${bot.user!.id}>`) prefix = '@Saikou ';
					return message
						.reply({
							embeds: [
								new EmbedBuilder() //
									.setTitle('📋 Incorrect Usage!')
									.setDescription(`Improper usage for the **${commandName}** command, please refer below.\n\n\`\`\`Usage: ${prefix}${commandName} ${commandUsage}\n\n${Object.keys(usageObject)[commandArguments.length]} is required for the command to run.\`\`\``)
									.setColor(EMBED_COLOURS.red)
									.setFooter({ text: '<> - Required ● Optional - []' }),
							],
							failIfNotExists: false,
						})
						.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
				}
			}
		}

		/* BLACKLISTED USERS */
		if (await blacklisted.findOne({ userID: message.author.id })) {
			message.delete();
			return message.channel
				.send({
					embeds: [
						new EmbedBuilder()
							.setTitle('🚫 Blacklisted!') // prettier-ignore
							.setDescription(`Uh oh! Looks like you are blacklisted from using SaikouBot. This can be a result of... \n\n• Inappropriate content through commands.\n• Abusing glitches for personal gain.`)
							.setThumbnail('https://i.ibb.co/C5YvkJg/4-128.png')
							.setColor(EMBED_COLOURS.red),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), 15000));
		}

		try {
			await commandFile.run({ bot, message, args: commandArguments });
		} catch (errorMessage: any) {
			console.error(errorMessage);

			message.channel.send({
				embeds: [
					new EmbedBuilder()
						.setTitle('❌ Something went wrong!') // prettier-ignore
						.setDescription(`Uh oh! Looks like Kaiou has hit some of the wrong buttons, causing an error. You can try... \n\n• Coming back later and trying again\n• Checking out Saikou's social medias whilst you wait 😏`)
						.setThumbnail('https://i.ibb.co/C5YvkJg/4-128.png')
						.setColor(EMBED_COLOURS.red),
				],
			});

			webhookClient.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle(`❌ ${errorMessage.name}`)
						.setDescription(`**Error in the ${commandName} command**\n${errorMessage}`)
						.setFooter({ text: `Error Occured • ${bot.user!.username}` })
						.setColor(EMBED_COLOURS.red)
						.setTimestamp(),
				],
			});
		}
	}
};
