import { Client, CommandInteraction, Interaction, EmbedBuilder, ChannelType, WebhookClient, PermissionFlagsBits, Role, GuildMember } from 'discord.js';
import { readdirSync } from 'fs';
import { redBright, bold } from 'chalk';
import ms from 'ms';
import blacklisted from '../../models/blacklistedUsers';

import { errorEmbed } from '../../utils/embeds';
import { choose } from '../../utils/functions';
import { EMBED_COLOURS, MESSAGE_TIMEOUT, LOWER_COOLDOWN_COMMANDS } from '../../utils/constants';

const webhookClient: WebhookClient = new WebhookClient({ id: `${BigInt(String(process.env.WEBHOOK_ID))}`, token: String(process.env.WEBHOOK_TOKEN) });

export = async (bot: Client, interaction: Interaction) => {
	/* HANDLING SLASH COMMANDS */
	if (interaction.isChatInputCommand()) {
		await interaction.deferReply().catch(() => {});

		if (!interaction.inGuild()) return (interaction as CommandInteraction).followUp({ content: 'Slash commands can only be ran in the server.' });

		const commandFile = bot.slashCommands.get(interaction.commandName);
		const args: any = [];

		if (!commandFile) return errorEmbed(interaction);

		/* GETTING ARGS */
		interaction.options.data.map((argument: any) => args.push(argument.value.length > 1024 ? `${argument.value.substring(0, 1021)}...` : argument.value));

		const { commandName, developerOnly, userPermissions, limitedChannel } = commandFile.config;

		/* --- USER PERMISSIONS CONFIGURATION --- */
		// @ts-ignore
		if (userPermissions && !interaction.member.permissions.has(userPermissions)) {
			return interaction
				.followUp({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('🔐 Incorrect Permissions')
							.setDescription(`**Command Name:** ${commandName}\n**Permissions Needed:** ${userPermissions}`)
							.setColor('#f94343')
							.setFooter({ text: 'Missing required permissions' }),
					],
				})
				.then(() => setTimeout(() => interaction.deleteReply(), MESSAGE_TIMEOUT));
		}

		/* --- LIMITED CHANNEL CONFIGURATION --- */
		if (interaction.channel!.type === ChannelType.GuildText && limitedChannel && limitedChannel.toLowerCase() !== 'none') {
			if (interaction.channel!.name.match(limitedChannel) === null) {
				return interaction
					.followUp({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle("📌 Can't use this channel!")
								.setDescription(
									`The **${commandName}** command is limited to the **${interaction
										.guild!.channels.cache.filter((channel: any) => channel.name.match(limitedChannel))
										.map((channel: any) => channel.toString())
										.join(' or ')}** channel. Try relocating to that channel and trying again!`
								)
								.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
								.setColor(EMBED_COLOURS.red),
						],
					})
					.then(() => setTimeout(() => interaction.deleteReply(), MESSAGE_TIMEOUT))
					.catch((err: Error) => console.log(`Caught Error: ${err}`));
			}
		}

		// @ts-ignore
		if (interaction.channel!.type === ChannelType.GuildText && !limitedChannel && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
			if (interaction.channel!.name.match('🤖bot-commands') === null) {
				return interaction
					.followUp({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle("📌 Can't use this channel!")
								.setDescription(`The **${commandName}** command is limited to the **${interaction.guild!.channels.cache.filter((channel: any) => channel.name.match('🤖bot-commands')).map((channel: any) => channel.toString())}** channel. Try relocating to that channel and trying again!`)
								.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
								.setColor(EMBED_COLOURS.red),
						],
					})
					.then(() => setTimeout(() => interaction.deleteReply(), MESSAGE_TIMEOUT));
			}
		}

		/* --- DEVELOPER ONLY CONFIGURATION --- */
		if (!developerOnly && readdirSync('dist/commands/dev-only').indexOf(`${commandName}.js`) > -1) {
			return console.error(`${redBright('ERROR!')} DevOnly config option not found in command "${commandName}".\n${redBright('ERROR!')} Add the following to your config options... ${bold('developerOnly: true/false')}`);
		}

		if (developerOnly === true && interaction.user.id !== '229142187382669312') {
			return interaction.followUp('Developer only command.');
		}

		/* BLACKLISTED USERS */
		if (await blacklisted.findOne({ userID: interaction.user.id })) {
			return interaction
				.followUp({
					embeds: [
						new EmbedBuilder()
							.setTitle('🚫 Blacklisted!') // prettier-ignore
							.setDescription(`Uh oh! Looks like you are blacklisted from using SaikouBot. This can be a result of... \n\n• Inappropriate content through commands.\n• Abusing glitches for personal gain.`)
							.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-sad.png')
							.setColor(EMBED_COLOURS.red),
					],
				})
				.then(() => setTimeout(() => interaction.deleteReply(), 15000));
		}

		/* --- COOLDOWN CONFIGURATION --- */
		let { COOLDOWN_TIME } = commandFile.config;

		if (bot.cooldowns.has(`${interaction.user.id}-${commandName}`)) {
			const titleOptions = ['🐌 Woah there, slow down!', '🦥 Way too fast there!'];
			const cooldownEmbed = new EmbedBuilder() // prettier-ignore
				.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
				.setColor(EMBED_COLOURS.red)
				.setTitle(String(choose(titleOptions)));

			if (LOWER_COOLDOWN_COMMANDS.indexOf(commandName) > -1 === true) {
				if ((interaction.member as GuildMember).roles.cache.find((role: Role) => role.name === 'Omega Follower')) {
					cooldownEmbed.setDescription(`You must wait **${ms(bot.cooldowns.get(`${interaction.user.id}-${commandName}`)! - Date.now(), { long: true })}** before re-using the **${commandName}** command.\n\nThe default cooldown is \`${COOLDOWN_TIME || 5}s\`, but since you're an **Omega Follower** you only have to wait \`${Math.round(COOLDOWN_TIME - COOLDOWN_TIME / 4) || 5}s\`! `);
				} else {
					cooldownEmbed.setDescription(`You must wait **${ms(bot.cooldowns.get(`${interaction.user.id}-${commandName}`)! - Date.now(), { long: true })}** before re-using the **${commandName}** command.\nThe default cooldown is \`${COOLDOWN_TIME || 5}s\`.\n\nLooking to run commands faster? Become an **Omega Follower** and only have to wait \`${Math.round(COOLDOWN_TIME - COOLDOWN_TIME / 4) || 5}s\`! `);
				}
			} else {
				cooldownEmbed.setDescription(`You must wait **${ms(bot.cooldowns.get(`${interaction.user.id}-${commandName}`)! - Date.now(), { long: true })}** before re-using the **${commandName}** command.\nThe default cooldown is \`${COOLDOWN_TIME || 5}s\`.`);
			}

			return interaction
				.followUp({
					embeds: [cooldownEmbed],
				})
				.then(() => setTimeout(() => interaction.deleteReply(), MESSAGE_TIMEOUT));
		}

		if (!COOLDOWN_TIME) COOLDOWN_TIME = 5;

		if (LOWER_COOLDOWN_COMMANDS.indexOf(commandName) > -1 === true) {
			if ((interaction.member as GuildMember).roles.cache.find((role: Role) => role.name === 'Omega Follower')) {
				COOLDOWN_TIME -= COOLDOWN_TIME / 4;
			}
		}

		bot.cooldowns.set(`${interaction.user.id}-${commandName}`, Date.now() + COOLDOWN_TIME * 1000);
		setTimeout((): void => {
			bot.cooldowns.delete(`${interaction.user.id}-${commandName}`);
		}, Math.round(COOLDOWN_TIME) * 1000);

		commandFile.run({ bot, args, interaction }).catch((errorMessage: Error) => {
			console.error(errorMessage);
			errorEmbed(interaction);

			webhookClient.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle(`❌ ${errorMessage.name}`)
						.setDescription(`**Error in the ${commandName} command (slash command)**\n${errorMessage}`)
						.setFooter({ text: `Error Occured • ${bot.user!.username}` })
						.setColor(EMBED_COLOURS.red)
						.setTimestamp(),
				],
			});
		});
	}

	/* HANDLING CONTEXT MENUS */
	if (interaction.isContextMenuCommand()) {
		await interaction.deferReply({ ephemeral: true }).catch(() => {});

		if (!interaction.inGuild()) return (interaction as CommandInteraction).followUp({ content: 'Slash commands can only be ran in the server.' });

		const commandFile = bot.slashCommands.get(interaction.commandName);
		const args: any = [];

		if (!commandFile) return errorEmbed(interaction);

		/* GETTING ARGS */
		interaction.options.data.map((argument) => args.push(argument.value));

		commandFile.run({ bot, args, interaction });
	}
};
