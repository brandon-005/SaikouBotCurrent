import { Command, EmbedBuilder, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ButtonInteraction, ModalBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { EMBED_COLOURS, MESSAGE_TIMEOUT } from '../../utils/constants';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'introduce',
		commandAliases: ['intro', 'bio'],
		commandDescription: 'Introduce yourself to other users in the server, make new friends and bond!',
		limitedChannel: 'introductions',
	},
	run: async ({ message }) => {
		/* IF USER HAS PROMPT OPEN */
		if (openPrompt.has(message.author.id))
			return message.channel
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

		openPrompt.add(message.author.id);

		message.channel
			.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription(`📬 A message has been sent to your DM's <@${message.author.id}>`)
						.setColor(EMBED_COLOURS.green),
				],
			})
			.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));

		const welcome = await message.author.send({
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

		const dmChannel = await message.author.createDM();
		const collector = dmChannel.createMessageComponentCollector({ filter: (msgFilter) => msgFilter.user.id === message.author.id, componentType: ComponentType.Button, time: 600000 });

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
			openPrompt.delete(message.author.id);
			welcome.edit({
				components: [],
			});
		});
	},
};

export = command;
