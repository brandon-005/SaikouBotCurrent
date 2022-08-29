import { Command, EmbedBuilder, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ButtonInteraction, ModalBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle, Interaction } from 'discord.js';
import { EMBED_COLOURS, MESSAGE_TIMEOUT } from '../../utils/constants';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'introduce',
		commandAliases: ['intro', 'bio'],
		commandDescription: 'Introduce yourself to other users in the server, make new friends and bond!',
		limitedChannel: 'introductions',
	},
	run: async ({ interaction }) => {
		let welcome: any;

		/* IF USER HAS PROMPT OPEN */
		if (openPrompt.has(interaction.user.id))
			return interaction.channel
				.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('🗃️ Prompt already open!')
							.setDescription('You already have an introduction form open, please finish the prompt!')
							.setColor(EMBED_COLOURS.red)
							.setFooter({ text: 'Already open prompt' }),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));

		try {
			welcome = await interaction.user.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('👋 Introduce Yourself!')
						.setDescription('To begin introducing yourself to others, navigate to the button below.')
						.setThumbnail('https://i.ibb.co/B6CQp1H/3-128.png')
						.setColor(EMBED_COLOURS.blurple),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						// prettier-ignore
						new ButtonBuilder().setLabel('Begin Introduction 📝').setStyle(ButtonStyle.Primary).setCustomId('intro-menu'),
					]),
				],
			});
		} catch (err: any) {
			if (err.status === 403) {
				return interaction.channel
					.send({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('❌ Unable to DM!')
								.setDescription("Please ensure your DM's are enabled in order for the bot to message you the prompt.")
								.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
								.setColor(EMBED_COLOURS.red),
						],
					})
					.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
			}
		}

		openPrompt.add(interaction.user.id);

		interaction
			.followUp({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription(`📬 A message has been sent to your DM's <@${interaction.user.id}>`)
						.setColor(EMBED_COLOURS.green),
				],
			})
			.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));

		const dmChannel = await interaction.user.createDM();
		const collector = dmChannel.createMessageComponentCollector({ filter: (msgFilter: Interaction) => msgFilter.user.id === interaction.user.id, componentType: ComponentType.Button, time: 600000 });

		collector.on('collect', async (button: ButtonInteraction) => {
			if (button.customId === 'intro-menu') {
				const modal = new ModalBuilder().setCustomId('intro-form').setTitle('Saikou Introduction 👋');

				const aboutMeInput = new TextInputBuilder() // prettier-ignore
					.setCustomId('aboutMe')
					.setLabel("Something you'd like to tell about yourself?")
					.setStyle(TextInputStyle.Paragraph);

				const hobbiesInput = new TextInputBuilder() // prettier-ignore
					.setCustomId('hobbiesInput')
					.setLabel("What's some of your favorite hobbies?")
					.setStyle(TextInputStyle.Paragraph);

				const colourInput = new TextInputBuilder() // prettier-ignore
					.setCustomId('colourInput')
					.setLabel("What's your favourite colour?")
					.setStyle(TextInputStyle.Short);

				const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([aboutMeInput]);
				const secondActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([hobbiesInput]);
				const thirdActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([colourInput]);

				modal.addComponents([firstActionRow, secondActionRow, thirdActionRow]);

				await button.showModal(modal);
			}
		});

		collector.on('end', () => {
			openPrompt.delete(interaction.user.id);
			welcome.edit({
				components: [],
			});
		});
	},
};

export = command;
