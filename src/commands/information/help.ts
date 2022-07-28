import { Command, EmbedBuilder, Message, ActionRowBuilder, SelectMenuBuilder, SelectMenuInteraction, PermissionFlagsBits, ComponentType } from 'discord.js';
import { readdirSync } from 'fs';
import { resolve } from 'path';

import { EMBED_COLOURS, MESSAGE_TIMEOUT, PROMPT_TIMEOUT } from '../../utils/constants';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'help',
		commandAliases: ['cmds', 'commands'],
		commandDescription: "Hey this is the command you're using now! As you may of realised, this grabs all of SaikouBot's commands ready for your next powerful move.",
	},
	run: async ({ bot, message }) => {
		const prefix = process.env.PREFIX;
		let funCommands: string = '';
		let infoCommands: string = '';
		let modCommands: string = '';
		let devCommands: string = '';
		let sentMsg: any;

		const menuOptions = [
			{
				label: 'Fun Commands',
				value: 'fun',
				description: 'List of fun commands SaikouBot offers.',
				emoji: '🎲',
			},
			{
				label: 'Information Commands',
				value: 'information',
				description: 'List of information commands SaikouBot offers.',
				emoji: 'ℹ️',
			},
		];

		if (message.author.id === '229142187382669312') {
			menuOptions.push({
				label: 'Development Commands',
				value: 'development',
				description: 'List of development commands SaikouBot offers.',
				emoji: '🔨',
			});
		}

		if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
			menuOptions.push({
				label: 'Moderation Commands',
				value: 'moderation',
				description: 'List of moderation commands SaikouBot offers.',
				emoji: '<:ban:701729757909352538>',
			});
		}

		/* IF USER HAS PROMPT OPEN */
		if (openPrompt.has(message.author.id))
			return message.channel
				.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('🗃️ Prompt already open!')
							.setDescription('You already have a help prompt open, you can still use it until it expires!')
							.setColor(EMBED_COLOURS.red)
							.setFooter({ text: 'Already open prompt' }),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));

		openPrompt.add(message.author.id);

		try {
			sentMsg = await message.author.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle(`:book: ${bot.user!.username} Commands`)
						.setDescription(`The prefix for ${bot.user!.username} is \`${process.env.PREFIX}\` \nCurrently featuring ${bot.commands.size} chat commands and ${bot.slashCommands.size} slash commands!`)
						.setColor(EMBED_COLOURS.blurple),
				],
				components: [
					new ActionRowBuilder<SelectMenuBuilder>() // prettier-ignore
						.addComponents([new SelectMenuBuilder().setCustomId('help-menu').setPlaceholder('Please select a category').addOptions(menuOptions)]),
				],
			});
		} catch (err) {
			openPrompt.delete(message.author.id);
			return message.channel.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription("Unable to send DM, please make sure your DM's are enabled.")
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		message.channel.send({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setDescription(`📬 A message has been sent to your DM's <@${message.author.id}>`)
					.setColor(EMBED_COLOURS.green),
			],
		});

		const collector = (await message.author.createDM()).createMessageComponentCollector({ filter: (interaction) => interaction.user.id === message.author.id, componentType: ComponentType.SelectMenu, time: PROMPT_TIMEOUT });

		collector.on('collect', (interaction: SelectMenuInteraction) => {
			const [category] = interaction.values;

			switch (category) {
				case `fun`:
					readdirSync(resolve(__dirname, '../fun/')).forEach((file) => {
						if (!file.endsWith('.js')) return;
						const commandFile = bot.commands.get(file.replace('.js', ''));
						funCommands += `**${prefix}${commandFile.config.commandName} ${commandFile.config.commandUsage ? commandFile.config.commandUsage : ''}** - [${commandFile.config.commandAliases.join(', ')}]\n${commandFile.config.commandDescription}\n\n`;
					});

					interaction.update({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('🎲 Fun Commands')
								.setDescription(String(funCommands))
								.setColor(EMBED_COLOURS.blurple),
						],
					});
					funCommands = '';
					break;

				case `information`:
					readdirSync(resolve(__dirname, '../information/')).forEach((file) => {
						if (!file.endsWith('.js')) return;
						const commandFile = bot.commands.get(file.replace('.js', ''));
						infoCommands += `**${prefix}${commandFile.config.commandName} ${commandFile.config.commandUsage ? commandFile.config.commandUsage : ''}** - [${commandFile.config.commandAliases.join(', ')}]\n${commandFile.config.commandDescription}\n\n`;
					});

					interaction.update({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('ℹ️ Information Commands')
								.setDescription(String(infoCommands))
								.setColor(EMBED_COLOURS.blurple),
						],
					});
					infoCommands = '';
					break;

				case `moderation`:
					readdirSync(resolve(__dirname, '../staff-only/')).forEach((file) => {
						if (!file.endsWith('.js')) return;
						const commandFile = bot.commands.get(file.replace('.js', ''));
						modCommands += `**${prefix}${commandFile.config.commandName} ${commandFile.config.commandUsage ? commandFile.config.commandUsage : ''}** - [${commandFile.config.commandAliases.join(', ')}]\n${commandFile.config.commandDescription}\n\n`;
					});

					interaction.update({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('<:ban:701729757909352538> Moderation Commands')
								.setDescription(String(modCommands))
								.setColor(EMBED_COLOURS.blurple),
						],
					});
					modCommands = '';
					break;

				case `development`:
					readdirSync(resolve(__dirname, '../dev-only/')).forEach((file) => {
						if (!file.endsWith('.js')) return;
						const commandFile = bot.commands.get(file.replace('.js', ''));
						devCommands += `**${prefix}${commandFile.config.commandName} ${commandFile.config.commandUsage ? commandFile.config.commandUsage : ''}** - [${commandFile.config.commandAliases.join(', ')}]\n${commandFile.config.commandDescription}\n\n`;
					});

					interaction.update({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('🔨 Development Commands')
								.setDescription(String(devCommands))
								.setColor(EMBED_COLOURS.blurple),
						],
					});
					devCommands = '';
					break;

				default:
					break;
			}
		});

		collector.on('end', () => {
			openPrompt.delete(message.author.id);
			sentMsg.edit({ components: [] });
		});
	},
};

export = command;
