import { Command, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType } from 'discord.js';

import { EMBED_COLOURS, MWT_MISSIONS } from '../../utils/constants';
import { choose } from '../../utils/functions';

const activeInteraction = new Set();

const command: Command = {
	config: {
		commandName: 'mission',
		commandAliases: ['mwtmission'],
		commandDescription: 'Looking for a new challenge? Let the mission command decide your next adventure.',
		slashCommand: true,
		serverOnly: false,
	},
	run: async ({ message, interaction }) => {
		const missionEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('🪖 Your Mission!')
			.setThumbnail('https://i.ibb.co/FqgT3fp/Group-1.png')
			.setColor(EMBED_COLOURS.blurple)
			.setFooter({ text: `Requested by: ${message ? message.author.username : interaction.user.username}`, iconURL: message ? message.author.displayAvatarURL() : interaction.user.displayAvatarURL() });

		/* IF USER HAS PROMPT OPEN */
		if (activeInteraction.has(message ? message.author.id : interaction.user.id)) {
			missionEmbed.setFooter({ text: 'To get buttons to change missions, wait for timeout (60s).' });
			missionEmbed.setDescription(`${choose(MWT_MISSIONS)}`);
			return message ? message.channel.send({ embeds: [missionEmbed] }) : interaction.followUp({ embeds: [missionEmbed] });
		}

		activeInteraction.add(message ? message.author.id : interaction.user.id);

		missionEmbed.setDescription(`${choose(MWT_MISSIONS)}`);
		const sentEmbed = message
			? await message.channel.send({
					embeds: [missionEmbed],
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents([
							// prettier-ignore
							new ButtonBuilder().setLabel('New Mission 🎮').setStyle(ButtonStyle.Primary).setCustomId('newMission'),
						]),
					],
			  })
			: await interaction.followUp({
					embeds: [missionEmbed],
					components: [
						new ActionRowBuilder().addComponents([
							// prettier-ignore
							new ButtonBuilder().setLabel('New Mission 🎮').setStyle(ButtonStyle.Primary).setCustomId('newMission'),
						]),
					],
			  });

		const collector = message ? message.channel.createMessageComponentCollector({ filter: (msgFilter) => msgFilter.user.id === message.author.id, componentType: ComponentType.Button, time: 60000 }) : interaction.channel!.createMessageComponentCollector({ filter: (menu: any) => menu.user.id === interaction.user.id, componentType: ComponentType.Button, time: 60000 });

		collector.on('collect', async (button: ButtonInteraction) => {
			let newMission = `${choose(MWT_MISSIONS)}`;

			if (button.customId === 'newMission') {
				/* get new fact if its the same as the old one */
				if (missionEmbed.description === newMission) newMission = `${choose(MWT_MISSIONS)}`;

				missionEmbed.setDescription(newMission);
				return button.update({
					embeds: [missionEmbed],
				});
			}
		});

		collector.on('end', () => {
			// @ts-ignore
			sentEmbed.edit({
				components: [],
			});

			activeInteraction.delete(message ? message.author.id : interaction.user.id);
		});
	},
};

export = command;
