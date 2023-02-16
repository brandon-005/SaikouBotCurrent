/* eslint-disable no-inner-declarations */
import { Client, User, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction } from 'discord.js';

import { PROMPT_TIMEOUT, EMBED_COLOURS, MESSAGE_TIMEOUT } from '../../utils/constants';
import suggestData from '../../models/suggestions';

const openPrompt = new Set();

export = async (bot: Client, reaction: any, user: User) => {
	/* FEATURED SUGGESTIONS SYSTEM */
	const { message } = reaction;

	function disabledButtons(button: Message) {
		button.edit({
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					// prettier-ignore
					new ButtonBuilder().setLabel('Delete').setStyle(ButtonStyle.Success).setCustomId('Yes').setDisabled(true),
					new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger).setCustomId('No').setDisabled(true),
				]),
			],
		});
	}

	if (reaction.message.channel.name === '💡suggestions' || message.channel.name === '🔥suggestions-nitro') {
		/* If not cached by bot (old suggestions) try to fetch */
		if (reaction.message.partial) {
			try {
				await reaction.message.fetch();
			} catch (err) {
				return;
			}
		}

		const suggestion = await suggestData.findOne({ messageID: message.id });

		if (!suggestion) return;

		/* Deleting Suggestion if author downvotes */
		if (reaction.emoji.name === '⬇️' && user.id! === suggestion!.userID) {
			try {
				const dmChannel = await user.createDM();

				if (openPrompt.has(user.id)) {
					return await user
						.send({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setTitle('🗃️ Prompt already open!')
									.setDescription('You already have a deletion prompt open, please finish it and try again!')
									.setColor(EMBED_COLOURS.red)
									.setFooter({ text: 'Already open prompt' }),
							],
						})
						.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
				}

				openPrompt.add(user.id);

				const buttonMsg = await user.send({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('Are you sure?')
							.setDescription('Please confirm that you want to delete your suggestion.')
							.setColor(EMBED_COLOURS.red),
					],
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents([
							// prettier-ignore
							new ButtonBuilder().setLabel('Delete').setStyle(ButtonStyle.Success).setCustomId('Yes'),
							new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger).setCustomId('No'),
						]),
					],
				});

				const collector = dmChannel.createMessageComponentCollector({ filter: (interaction: Interaction) => interaction.user.id === user.id, max: 1, time: PROMPT_TIMEOUT });

				collector.on('end', async (buttonInteraction) => {
					if (!buttonInteraction.first()) {
						openPrompt.delete(user.id);
						return disabledButtons(buttonMsg);
					}

					switch (buttonInteraction.first()!.customId) {
						case 'Yes':
							await suggestData.deleteOne({ messageID: message.id });
							if (message.deletable) {
								await message.delete();
							}

							buttonInteraction.first()!.reply({
								embeds: [
									new EmbedBuilder() // prettier-ignore
										.setDescription('**✅ Successfully deleted suggestion!**')
										.setColor(EMBED_COLOURS.green),
								],
							});

							disabledButtons(buttonMsg);
							openPrompt.delete(user.id);
							break;

						case 'No':
							buttonInteraction.first()!.reply({
								embeds: [
									new EmbedBuilder() // prettier-ignore
										.setDescription('**✅ Successfully cancelled deletion.**')
										.setColor(EMBED_COLOURS.green),
								],
							});

							disabledButtons(buttonMsg);
							openPrompt.delete(user.id);
							break;

						default:
							break;
					}
				});
			} catch (err) {
				await suggestData.deleteOne({ messageID: message.id });
				openPrompt.delete(user.id);
				if (message.deletable) {
					return message.delete();
				}

				return;
			}
		}

		// /* If suggestion reaches 15 downvotes, delete */
		if (reaction.emoji.name === '⬇️' && message.reactions.cache.get('⬇️').count - 1 >= 15) {
			const suggester = await suggestData.findOne({ messageID: message.id });

			bot.users
				.send(suggester.userID, {
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('ℹ️ Suggestion Removed!')
							.setDescription("Your suggestion has been automatically removed due to reaching 15+ downvotes in the Saikou Discord.\n\n**🔎 Where did I go wrong?**\nWe filter suggestions that our community aren't interested in, we recommend ensuring that your suggestion fits in with our platform and that it's detailed.")
							.setColor(EMBED_COLOURS.blurple)
							.addFields({ name: 'Suggestion Content', value: `${suggester.suggestionMessage}` }),
					],
				})
				.catch(() => {});

			await suggestData.deleteOne({ messageID: message.id });
			if (message.deletable) {
				await message.delete();
			}
		}

		/* Adding Suggestion to featured if it wasn't denied */
		if (!suggestion.featured && message.reactions.cache.get('⬆️').count - 1 >= 15) {
			if (message.embeds[0]?.fields[0]?.value.includes('❌')) return;

			message.guild?.channels.cache
				.get(`${BigInt(String(process.env.FEATURED_CHANNEL))}`)!
				.send({ embeds: [message.embeds[0]] })
				.then(async (embed: Message) => {
					['⬆️', '↔', '⬇️'].forEach((msgReaction) => embed.react(msgReaction));
					suggestion.featuredMessageID = embed.id;
					suggestion.featured = true;
					await suggestion.save();
				});
		}
	}
};
