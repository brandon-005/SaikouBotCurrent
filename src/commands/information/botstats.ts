import { ButtonInteraction, Command, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { connection } from 'mongoose';
import { EMBED_COLOURS, PROMPT_TIMEOUT } from '../../utils/constants';

// eslint-disable-next-line import/no-commonjs
const packageJson = require('../../../package.json');

const activeInteraction = new Set();

const command: Command = {
	config: {
		commandName: 'botstats',
		commandAliases: ['bot', 'status', 'uptime', 'ping'],
		commandDescription: "Looking to find SaikouBot's statistics? Well you're in the right place!",
		slashCommand: true,
	},
	run: async ({ bot, message, interaction }) => {
		// Loading Message
		const loadingEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('Loading...')
			.setDescription('Calculating latency, hold tight!')
			.setColor(EMBED_COLOURS.blurple);

		const loadingMsg = message ? await message.channel.send({ embeds: [loadingEmbed] }) : await interaction.followUp({ embeds: [loadingEmbed] });

		const memoryPercentage = Math.round(((process.memoryUsage().heapTotal - process.memoryUsage().heapUsed) / process.memoryUsage().heapTotal) * 100);
		const botLatency = loadingMsg.createdTimestamp - (message ? message.createdTimestamp : interaction.createdTimestamp);
		let memoryMsg = '';
		let latencyMsg = '';

		// Calculating Database State
		function databaseState(readyState: number) {
			let status = '';

			switch (readyState) {
				case 0:
					status = `\`🔴 Offline\``;
					break;

				case 1:
					status = `\`🟢 Operational\``;
					break;

				case 2:
					status = `\`🟠 Connecting\``;
					break;

				case 3:
					status = `\`🟣 Disconnecting\``;
					break;
			}

			return status;
		}

		// Calculating Memory Usage Acknowledgement
		switch (true) {
			case memoryPercentage > 0 && memoryPercentage < 30:
				memoryMsg = '✅ Normal memory usage.';
				break;

			case memoryPercentage > 29 && memoryPercentage < 50:
				memoryMsg = '⚠️ Higher than average memory usage.';
				break;

			case memoryPercentage > 49:
				memoryMsg = '❗ Extremely high memory usage.';
				break;

			default:
				memoryMsg = '✅ Normal memory usage.';
				break;
		}

		// Calculating Latency Acknowledgement
		switch (true) {
			case botLatency > 0 && botLatency < 200:
				latencyMsg = '✅ Normal bot latency.';
				break;

			case botLatency > 399 && botLatency < 600:
				latencyMsg = '⚠️ Higher than average bot latency.';
				break;

			case botLatency > 599:
				latencyMsg = '❗ Extremely high bot latency.';
				break;

			default:
				latencyMsg = '✅ Normal bot latency.';
				break;
		}

		const statusEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('SaikouBot Status 🛠️')
			.setDescription(`The **${bot.user.username}** service has been operational since <t:${parseInt(String(bot.readyTimestamp / 1000))}:R>.`)
			.addFields(
				{
					name: '🧭 Bot Version',
					value: `\`${packageJson.version}\``,
					inline: true,
				},
				{
					name: '🏓 Bot Latency',
					value: `\`${botLatency}ms\``,
					inline: true,
				},
				{
					name: '📊 Memory Usage',
					value: `\`${memoryPercentage}%\``,
					inline: true,
				},
				{
					name: '🕔 API Latency',
					value: `\`${bot.ws.ping}ms\``,
					inline: true,
				},
				{
					name: '🔎 Discord.js Version',
					value: `\`${packageJson.dependencies['discord.js']}\``,
					inline: true,
				},
				{
					name: '🗄️ Bot Database',
					value: `${databaseState(connection.readyState)}`,
					inline: true,
				},
				{
					name: 'Acknowledgements',
					value: `${latencyMsg}\n${memoryMsg}`,
				}
			)
			.setColor(EMBED_COLOURS.blurple);

		/* Restart Button */
		if (message ? message.member!.id === '229142187382669312' : interaction.user.id === '229142187382669312') {
			/* IF USER HAS PROMPT OPEN */
			if (activeInteraction.has(message ? message.author.id : interaction.user.id)) {
				statusEmbed.setFooter({ text: 'Exit previous uptime prompt to receive the option to restart.' });
				return loadingMsg.edit({ embeds: [statusEmbed] });
			}

			activeInteraction.add(message ? message.author.id : interaction.user.id);

			loadingMsg.edit({
				embeds: [statusEmbed],
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
			});

			const collector = message ? message.channel.createMessageComponentCollector({ filter: (msgFilter) => msgFilter.user.id === message.author.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT }) : interaction.channel!.createMessageComponentCollector({ filter: (menu: any) => menu.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

			collector.on('collect', async (button: ButtonInteraction) => {
				switch (button.customId) {
					case 'exit-prompt':
						loadingMsg.edit({ components: [] });
						collector.stop();
						activeInteraction.delete(message ? message.author.id : interaction.user.id);
						break;

					case 'restart':
						await loadingMsg.edit({
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

			collector.on('end', () => {
				loadingMsg.edit({ components: [] });
			});
		} else {
			return loadingMsg.edit({ embeds: [statusEmbed] });
		}
	},
};

export = command;
