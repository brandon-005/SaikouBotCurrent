import { Command, ApplicationCommandOptionType, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, Message, EmbedBuilder } from 'discord.js';

import { EMBED_COLOURS, MESSAGE_TIMEOUT, PROMPT_TIMEOUT } from '../../utils/constants';
import suggestionData from '../../models/suggestions';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'suggest',
		commandAliases: ['suggestion'],
		commandDescription: 'Pondering on that one idea for Saikou? Why wait!',
		commandUsage: '<platform> <suggestion> <anonymous>',
		limitedChannel: 'suggestions',
		slashOptions: [
			{
				name: 'platform',
				description: 'The platform your suggestion is for.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: '🔫 Military Warfare Tycoon',
						value: 'Military Warfare Tycoon',
					},
					{
						name: '💬 Discord Server',
						value: 'Discord',
					},
					{
						name: '🔎 Other',
						value: 'Other',
					},
				],
			},
			{
				name: 'suggestion',
				description: 'The suggestion you would like to give for this platform.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'anonymous',
				description: 'Whether you would like to suggest anonymously or not.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: '🥷 Yes',
						value: 'true',
					},
					{
						name: '🤝 No',
						value: 'false',
					},
				],
			},
		],
	},
	run: async ({ bot, interaction, args }) => {
		/* IF USER HAS PROMPT OPEN */
		if (openPrompt.has(interaction.user.id))
			return interaction
				.editReply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('🗃️ Prompt already open!')
							.setDescription('You already have an introduction form open, please finish the prompt!')
							.setColor(EMBED_COLOURS.red)
							.setFooter({ text: 'Already open prompt' }),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));

		/* CONFIRMATION PROMPT */
		let confirmationEmbed: Message;

		try {
			confirmationEmbed = await interaction.user.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('Just to confirm...')
						.setDescription("You're about to post a suggestion with the following details:")
						.addFields(
							{ name: '🏠 Platform', value: args[0], inline: true }, // prettier-ignore
							{ name: '🥷 Anonymous', value: JSON.parse(args[2]) ? 'Yes' : 'No', inline: true },
							{ name: '📖 Suggestion', value: args[1], inline: false }
						)
						.setColor(EMBED_COLOURS.red)
						.setFooter({ text: 'Indicate your response below.' }),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						new ButtonBuilder() // prettier-ignore
							.setLabel('Send')
							.setStyle(ButtonStyle.Success)
							.setCustomId('send'),

						new ButtonBuilder() // prettier-ignore
							.setLabel('Cancel')
							.setStyle(ButtonStyle.Danger)
							.setCustomId('exit'),
					]),
				],
			});
		} catch (err) {
			return interaction
				.editReply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('❌ Unable to DM!')
							.setDescription("Please ensure your DM's are enabled in order for the bot to message you the prompt.")
							.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-error.png')
							.setColor(EMBED_COLOURS.red),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
		}
		openPrompt.add(interaction.user.id);

		/* DM sent embed */
		await interaction
			.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription(`📬 A message has been sent to your DM's <@${interaction.user.id}>`)
						.setColor(EMBED_COLOURS.green),
				],
			})
			.then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT))
			.catch(() => {});

		const collector = (await interaction.user.createDM())!.createMessageComponentCollector({ filter: (button: any) => button.user.id === interaction.user.id, componentType: ComponentType.Button, time: PROMPT_TIMEOUT });

		collector.on('collect', async (button: ButtonInteraction): Promise<any> => {
			switch (button.customId) {
				case 'exit':
					openPrompt.delete(interaction.user.id);
					collector.stop();
					break;

				case 'send':
					openPrompt.delete(interaction.user.id);
					button.update({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('✅ Success!')
								.setDescription('Your suggestion has been posted.')
								.setColor(EMBED_COLOURS.green),
						],
						components: [],
					});

					const embed = new EmbedBuilder() // prettier-ignore
						.setTitle(`New Suggestion!`)
						.setDescription(`**Category:** ${args[0]}\n**Suggestion:** ${args[1].length > 1900 ? `${args[1].substring(0, 1800)}...` : args[1]}`)
						.addFields([{ name: 'Status', value: '📊 Waiting for community feedback, please add a vote!' }])
						.setAuthor({ name: `${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}`, iconURL: interaction.user.displayAvatarURL() })
						.setColor(EMBED_COLOURS.blurple)
						.setFooter({ text: 'Add a new suggestion with .suggest' })
						.setTimestamp();

					const suggestionEmbed = await interaction.channel.send({
						embeds: [embed],
					});

					if (args[2] === 'true') suggestionEmbed.edit({ embeds: [embed.setFooter({ text: `Suggestion ID: ${suggestionEmbed.id}` }).setAuthor({ name: 'Anonymous Suggestion', iconURL: bot.user?.displayAvatarURL() })] });

					['⬆️', '↔', '⬇️'].forEach((reaction) => suggestionEmbed.react(reaction));

					await suggestionData.create({
						suggestionMessage: args[1],
						channelID: interaction.channel.id,
						messageID: suggestionEmbed.id,
						userID: interaction.user.id,
					});

					collector.stop();
					break;
			}
		});

		collector.on('end', () => {
			openPrompt.delete(interaction.user.id);
			confirmationEmbed.edit({
				components: [],
			});
		});
	},
};

export = command;
