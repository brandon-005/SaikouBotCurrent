import { ButtonInteraction, Command, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { EMBED_COLOURS, PROMPT_TIMEOUT } from '../../utils/constants';

const activeInteraction = new Set();

const command: Command = {
	config: {
		commandName: 'botstats',
		commandAliases: ['bot', 'status', 'uptime', 'ping'],
		commandDescription: "Looking to find SaikouBot's statistics? Well you're in the right place!",
		slashCommand: true,
	},
	run: async ({ bot, message, interaction }) => {
		const botLatency = bot.ws.ping;
		const memoryUsage = process.memoryUsage();
		const memoryPercentage = ((memoryUsage.heapTotal - memoryUsage.heapUsed) / memoryUsage.heapTotal) * 100;
		let statusMsg = '';
		let memoryMsg = '';

		function duration(ms: number) {
			const sec = Math.floor((ms / 1000) % 60).toString();
			const min = Math.floor((ms / (1000 * 60)) % 60).toString();
			const hrs = Math.floor((ms / (1000 * 60 * 60)) % 60).toString();
			return `${hrs.padStart(2, '0')} hrs, ${min.padStart(2, '0')} mins, ${sec.padStart(2, '0')} secs `;
		}

		const status = new EmbedBuilder()
			.setTitle('Saikou Bot Status')
			.setDescription(`**${bot.user!.username}** has been running for \`${duration(Number(bot.uptime))}\`\nDown below lists some statistics.\n\n**Bot Latency:** \`${botLatency}ms\`\n**Version:** \`v4.0.0\`\n**Memory Usage:** \`${Math.round(memoryPercentage)}%\` `)
			.setThumbnail(bot.user!.displayAvatarURL());

		// Memory Usage
		if (memoryPercentage > 0 && memoryPercentage < 30) memoryMsg = '✅ Normal memory usage.';
		else if (memoryPercentage > 29 && memoryPercentage < 50) memoryMsg = '⚠️ Higher than average memory usage.';
		else if (memoryPercentage > 49) memoryMsg = '❗ Extremely high memory usage.';
		else memoryMsg = '✅ Normal memory usage.';

		// Bot latency
		if (botLatency > 399 && botLatency < 600) {
			status.setColor(EMBED_COLOURS.yellow);
			statusMsg = '⚠️ Higher than average bot latency.';
		} else if (botLatency > 0 && botLatency < 200) {
			status.setColor(EMBED_COLOURS.green);
			statusMsg = '✅ Normal bot latency.';
		} else if (botLatency > 599 && botLatency < 999999999) {
			status.setColor(EMBED_COLOURS.red);
			statusMsg = '❗ Extremely high bot latency.';
		} else {
			status.setColor(EMBED_COLOURS.green);
			statusMsg = '✅ Normal bot latency.';
		}

		status.addFields([{ name: 'Acknowledgements', value: `${statusMsg}\n${memoryMsg}` }]);

		/* Restart Button */
		if (message ? message.member!.id === '229142187382669312' : interaction.user.id === '229142187382669312') {
			/* IF USER HAS PROMPT OPEN */
			if (activeInteraction.has(message ? message.author.id : interaction.user.id)) {
				status.setFooter({ text: 'Exit previous uptime prompt to receive the option to restart.' });
				return message ? message.channel.send({ embeds: [status] }) : interaction.followUp({ embeds: [status] });
			}

			activeInteraction.add(message ? message.author.id : interaction.user.id);

			const uptimeEmbed: any = message
				? await message.channel.send({
						embeds: [status],
						components: [
							new ActionRowBuilder<ButtonBuilder>() // prettier-ignore
								.addComponents([
									new ButtonBuilder() // prettier-ignore
										.setLabel('Restart 🔁')
										.setStyle(ButtonStyle.Danger)
										.setCustomId('restart'),

									new ButtonBuilder() // prettier-ignore
										.setLabel('Exit 🚪')
										.setStyle(ButtonStyle.Primary)
										.setCustomId('exit-prompt'),
								]),
						],
				  })
				: await interaction.followUp({
						embeds: [status],
						components: [
							new ActionRowBuilder() // prettier-ignore
								.addComponents([
									new ButtonBuilder() // prettier-ignore
										.setLabel('Restart')
										.setStyle(ButtonStyle.Danger)
										.setCustomId('restart'),

									new ButtonBuilder() // prettier-ignore
										.setLabel('Exit')
										.setStyle(ButtonStyle.Primary)
										.setCustomId('exit-prompt'),
								]),
						],
				  });

			const collector = message ? message.channel.createMessageComponentCollector({ filter: (msgFilter) => msgFilter.user.id === message.author.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT }) : interaction.channel!.createMessageComponentCollector({ filter: (menu: any) => menu.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

			collector.on('collect', async (button: ButtonInteraction) => {
				switch (button.customId) {
					case 'exit-prompt':
						uptimeEmbed.edit({ components: [] });
						collector.stop();
						activeInteraction.delete(message ? message.author.id : interaction.user.id);
						break;

					case 'restart':
						await uptimeEmbed.edit({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('Restarting Application!')
									.setDescription('SaikouBot will force shutdown and attempt to restart.')
									.setColor(EMBED_COLOURS.green),
							],
							components: [],
						});

						collector.stop();
						activeInteraction.delete(message ? message.author.id : interaction.user.id);

						// eslint-disable-next-line no-process-exit
						return process.exit();
				}
			});
		} else {
			return message ? message.channel.send({ embeds: [status] }) : interaction.followUp({ embeds: [status] });
		}
	},
};

export = command;
