import { Command, ApplicationCommandOptionType, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, Message, EmbedBuilder } from 'discord.js';

import { EMBED_COLOURS, MESSAGE_TIMEOUT } from '../../utils/constants';
import suggestionData from '../../models/suggestions';

const command: Command = {
	config: {
		commandName: 'suggest',
		commandAliases: ['suggestion'],
		commandDescription: 'Pondering on that one idea for Saikou? Why wait!',
		limitedChannel: 'suggestions',
		COOLDOWN_TIME: 120,
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
		/* CONFIRMATION PROMPT */
		try {
			await interaction.user.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('Just to confirm...')
						.setDescription("You're about to post a suggestion with the following details:")
						.addFields(
							{ name: '🏠 Platform', value: args[0], inline: true }, // prettier-ignore
							{ name: '🥷 Anonymous', value: args[2] ? 'Yes' : 'No', inline: true },
							{ name: '📖 Suggestion', value: args[1], inline: false }
						)
						.setColor(EMBED_COLOURS.red)
						.setFooter({ text: 'Indicate your response below.' }),
				],
				components: [
					new ActionRowBuilder().addComponents([
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
				.followUp({
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

		/* DM sent embed */
		await interaction
			.followUp({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription(`📬 A message has been sent to your DM's <@${interaction.user.id}>`)
						.setColor(EMBED_COLOURS.green),
				],
			})
			.then((msg: any) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT))
			.catch(() => {});

		const collector = (await interaction.user.createDM())!.createMessageComponentCollector({ filter: (button: any) => button.user.id === interaction.user.id, componentType: ComponentType.Button, time: 30000 });

		collector.on('collect', async (button: ButtonInteraction): Promise<any> => {
			switch (button.customId) {
				case 'exit':
					button.update({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('✅ Cancelled!')
								.setDescription('The prompt has been cancelled successfully.')
								.setThumbnail('https://i.ibb.co/kxJqM6F/mascot-Success.png')
								.setColor(EMBED_COLOURS.green),
						],
						components: [],
					});
					break;

				case 'send':
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
					break;
			}
		});
	},
};

export = command;
