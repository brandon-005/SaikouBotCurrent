import { Command, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Interaction, ButtonInteraction, ModalBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

import { EMBED_COLOURS, PROMPT_TIMEOUT } from '../../utils/constants';
import wyrQuestion from '../../models/wyrQuestion';
import qotd from '../../models/qotd';

const command: Command = {
	config: {
		commandName: 'addquestion',
		commandAliases: ['newwyr', 'newqotd'],
		commandDescription: 'Use this command to add new WYRs or QOTDs.',
		commandUsage: '<question-type>',
		userPermissions: 'ManageMessages',
		limitedChannel: '🤖staff-cmds',
		slashOptions: [
			{
				name: 'question',
				description: 'Which question you would like to add.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: '🔠 Would You Rather',
						value: 'Would You Rather',
					},
					{
						name: '💬 Question Of The Day',
						value: 'Question Of The Day',
					},
				],
			},
		],
	},
	run: async ({ interaction, args }) => {
		const successEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('✅ Successfully added!')
			.setDescription(`The **${args[0]}** has been added to the schedule.`)
			.setColor(EMBED_COLOURS.green);

		/* WOULD YOU RATHERS */
		if (args[0] === 'Would You Rather') {
			await interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('🔠 Question Details')
						.setDescription('Please enter the Would You Rather options using the button below.')
						.setColor(EMBED_COLOURS.blurple),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						// prettier-ignore
						new ButtonBuilder().setLabel('Begin Details 📝').setStyle(ButtonStyle.Primary).setCustomId('wyr-menu'),
						new ButtonBuilder().setLabel('Exit Prompt 👋').setStyle(ButtonStyle.Danger).setCustomId('exit'),
					]),
				],
			});

			const detailsCollector = interaction.channel.createMessageComponentCollector({ filter: (msgFilter: Interaction) => msgFilter.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

			detailsCollector.on('collect', async (button: ButtonInteraction) => {
				switch (button.customId) {
					case 'exit':
						button.update({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('✅ Cancelled!')
									.setDescription('The prompt has been cancelled successfully.')
									.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-success.png')
									.setColor(EMBED_COLOURS.green),
							],
							components: [],
						});

						detailsCollector.stop();
						break;

					case 'wyr-menu':
						const modal = new ModalBuilder().setCustomId('wyr-form').setTitle('🔠 New Would You Rather');

						modal.addComponents([
							new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
								new TextInputBuilder() // prettier-ignore
									.setCustomId('option-a')
									.setMinLength(5)
									.setPlaceholder('Option A')
									.setLabel('What is the first WYR option to choose from?')
									.setStyle(TextInputStyle.Short)]), // prettier-ignore

							new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
								new TextInputBuilder() // prettier-ignore
									.setCustomId('option-b')
									.setMinLength(5)
									.setPlaceholder('Option B')
									.setLabel('What is the second WYR option to choose from?')
									.setStyle(TextInputStyle.Short)]), // prettier-ignore
						]);

						await button.showModal(modal);

						const formResponse = await button.awaitModalSubmit({ time: PROMPT_TIMEOUT, filter: (menuUser) => menuUser.user.id === interaction.user.id }).catch(() => null);

						if (formResponse === null) {
							return detailsCollector.stop();
						}

						const optionA = formResponse.fields.getTextInputValue('option-a');
						const optionB = formResponse.fields.getTextInputValue('option-b');

						await wyrQuestion
							.create({
								optionA: `A: ${optionA}`,
								optionB: `B: ${optionB}`,
							})
							.then(async () => {
								await formResponse.update({
									embeds: [successEmbed],
									components: [],
								});
							});

						return detailsCollector.stop();
				}
			});
		}

		/* QUESTION OF THE DAY */
		if (args[0] === 'Question Of The Day') {
			await interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('💬 Question Details')
						.setDescription('Please enter the question using the button below.')
						.setColor(EMBED_COLOURS.blurple),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						// prettier-ignore
						new ButtonBuilder().setLabel('Begin Details 📝').setStyle(ButtonStyle.Primary).setCustomId('qotd-menu'),
						new ButtonBuilder().setLabel('Exit Prompt 👋').setStyle(ButtonStyle.Danger).setCustomId('exit'),
					]),
				],
			});

			const detailsCollector = interaction.channel.createMessageComponentCollector({ filter: (msgFilter: Interaction) => msgFilter.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

			detailsCollector.on('collect', async (button: ButtonInteraction) => {
				switch (button.customId) {
					case 'exit':
						button.update({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('✅ Cancelled!')
									.setDescription('The prompt has been cancelled successfully.')
									.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-success.png')
									.setColor(EMBED_COLOURS.green),
							],
							components: [],
						});

						detailsCollector.stop();
						break;

					case 'qotd-menu':
						const modal = new ModalBuilder().setCustomId('qotd-form').setTitle('💬 New Question');

						modal.addComponents([
							new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
                            new TextInputBuilder() // prettier-ignore
                                .setCustomId('question')
                                .setMinLength(5)
                                .setPlaceholder('Input Question')
                                .setLabel('What is the question you would like to add?')
                                .setStyle(TextInputStyle.Short)]), // prettier-ignore
						]);

						await button.showModal(modal);

						const qotdFormResponse = await button.awaitModalSubmit({ time: PROMPT_TIMEOUT, filter: (menuUser) => menuUser.user.id === interaction.user.id }).catch(() => null);

						if (qotdFormResponse === null) {
							return detailsCollector.stop();
						}

						await qotd
							.create({
								question: `**Question of the day: ${qotdFormResponse.fields.getTextInputValue('question')}**`,
							})
							.then(async () => {
								await qotdFormResponse.update({
									embeds: [successEmbed],
									components: [],
								});
							});

						return detailsCollector.stop();
				}
			});
		}
	},
};

export = command;
