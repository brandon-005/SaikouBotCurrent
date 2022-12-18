import { Command, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, Embed } from 'discord.js';

import { EMBED_COLOURS, MWT_MISSIONS } from '../../utils/constants';
import { choose } from '../../utils/functions';

const activeInteraction = new Set();

const command: Command = {
	config: {
		commandName: 'mission',
		commandAliases: ['mwtmission'],
		commandDescription: 'Looking for a new challenge? Let the mission command decide your next adventure.',
	},
	run: async ({ interaction }) => {
		const missionEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('🪖 Your Mission!')
			.setThumbnail('https://i.ibb.co/FqgT3fp/Group-1.png')
			.setColor(EMBED_COLOURS.blurple)
			.setFooter({ text: `Requested by: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

		/* IF USER HAS PROMPT OPEN */
		if (activeInteraction.has(interaction.user.id)) {
			missionEmbed.setFooter({ text: 'To get buttons to change missions, wait for timeout (60s).' });
			missionEmbed.setDescription(`${choose(MWT_MISSIONS)}`);
			return interaction.editReply({ embeds: [missionEmbed] });
		}

		activeInteraction.add(interaction.user.id);

		missionEmbed.setDescription(`${choose(MWT_MISSIONS)}`);
		const sentEmbed = await interaction.editReply({
			embeds: [missionEmbed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					// prettier-ignore
					new ButtonBuilder().setLabel('New Mission 🎮').setStyle(ButtonStyle.Primary).setCustomId('newMission'),
				]),
			],
		});

		const collector = interaction.channel!.createMessageComponentCollector({ filter: (menu: any) => menu.user.id === interaction.user.id, componentType: ComponentType.Button, time: 60000 });

		collector.on('collect', async (button: ButtonInteraction) => {
			let newMission = `${choose(MWT_MISSIONS)}`;

			if (button.customId === 'newMission') {
				/* get new fact if its the same as the old one */
				if ((missionEmbed as unknown as Embed).description === newMission) newMission = `${choose(MWT_MISSIONS)}`;

				missionEmbed.setDescription(newMission);
				button.update({
					embeds: [missionEmbed],
				});
				return;
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
