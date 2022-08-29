import { Command, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, Embed } from 'discord.js';

import { EMBED_COLOURS, GAME_FACTS } from '../../utils/constants';
import { choose } from '../../utils/functions';

const activeInteraction = new Set();

const command: Command = {
	config: {
		commandName: 'gamefact',
		commandAliases: ['gfact'],
		commandDescription: "Gain some information on Saikou's games through this fact command!",
	},
	run: async ({ interaction }) => {
		const gamefactEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('ℹ Game fact')
			.setThumbnail('https://i.ibb.co/FqgT3fp/Group-1.png')
			.setColor(EMBED_COLOURS.blurple)
			.setFooter({ text: `Requested by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

		/* IF USER HAS PROMPT OPEN */
		if (activeInteraction.has(interaction.user.id)) {
			gamefactEmbed.setFooter({ text: 'To get buttons to change facts, wait for timeout (60s).' });
			gamefactEmbed.setDescription(`**Fact:** ${choose(GAME_FACTS)}`);
			return interaction.followUp({ embeds: [gamefactEmbed] });
		}

		activeInteraction.add(interaction.user.id);

		gamefactEmbed.setDescription(`**Fact:** ${choose(GAME_FACTS)}`);
		const sentEmbed = await interaction.followUp({
			embeds: [gamefactEmbed],
			components: [
				new ActionRowBuilder().addComponents([
					// prettier-ignore
					new ButtonBuilder().setLabel('New Fact 🗃️').setStyle(ButtonStyle.Primary).setCustomId('newFact'),
				]),
			],
		});

		const collector = interaction.channel!.createMessageComponentCollector({ filter: (menu: any) => menu.user.id === interaction.user.id, componentType: ComponentType.Button, time: 60000 });

		collector.on('collect', async (button: ButtonInteraction) => {
			let newFact = `**Fact:** ${choose(GAME_FACTS)}`;

			if (button.customId === 'newFact') {
				/* get new fact if its the same as the old one */
				if (gamefactEmbed.data.description === newFact) newFact = `**Fact:** ${choose(GAME_FACTS)}`;

				gamefactEmbed.setDescription(newFact);
				return button.update({
					embeds: [gamefactEmbed],
				});
			}
		});

		collector.on('end', () => {
			// @ts-ignore
			sentEmbed.edit({
				components: [],
			});

			activeInteraction.delete(interaction.user.id);
		});
	},
};

export = command;
