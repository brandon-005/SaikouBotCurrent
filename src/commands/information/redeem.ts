import { Command, ApplicationCommandOptionType, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, Message, EmbedBuilder, TextChannel } from 'discord.js';
import axios from 'axios';

import { EMBED_COLOURS, MESSAGE_TIMEOUT, PROMPT_TIMEOUT } from '../../utils/constants';
import tokenData from '../../models/weaponTokens';

const openPrompt = new Set();

const command: Command = {
	config: {
		commandName: 'redeem',
		commandAliases: ['redeemWeapon'],
		commandDescription: 'Boosted recently? You can redeem your in-game perks with this command!',
		commandUsage: '<player>',
		slashOptions: [
			{
				name: 'player',
				description: 'The Roblox username of the player.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ bot, interaction, args }) => {
		/* IF USER HAS PROMPT OPEN */
		if (openPrompt.has(interaction.user.id))
			return interaction
				.followUp({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('🗃️ Prompt already open!')
							.setDescription('You already have an introduction form open, please finish the prompt!')
							.setColor(EMBED_COLOURS.red)
							.setFooter({ text: 'Already open prompt' }),
					],
				})
				.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));

		/* FETCHING TOKENS */
		const tokensUser = await tokenData.findOne({ userID: interaction.user.id });
		let confirmationEmbed: Message;
		let robloxDisplayName = '';
		let robloxID = '';

		if (!tokensUser) {
			return interaction.followUp({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('🔎 No Tokens!')
						.setDescription('You have no weapon tokens to redeem, if you believe this is a mistake contact a staff member.')
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		/* FETCHING ROBLOX USER */
		let invalidUser = false;
		await axios({
			method: 'post',
			url: 'https://users.roblox.com/v1/usernames/users',
			data: {
				usernames: [args[0]],
			},
		})
			.then((response: any) => {
				robloxDisplayName = response.data.data.map((value: any) => value.displayName);
				robloxID = response.data.data.map((value: any) => value.id);
				if (response.data.data.length === 0) invalidUser = true;
			})
			.catch((error) => {
				console.error(error);
			});

		if (invalidUser !== false) {
			openPrompt.delete(interaction.user.id);
			return interaction.followUp({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('Unable to find Roblox User! 🔎')
						.setDescription("Please ensure you're providing a valid Roblox player to proceed.")
						.setColor(EMBED_COLOURS.red)
						.setTimestamp(),
				],
				components: [],
			});
		}

		/* CONFIRMATION PROMPT */
		try {
			confirmationEmbed = await interaction.user.send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('Just to confirm...')
						.setDescription("You're about to give the Military Warfare Tycoon booster weapons to:")
						.addFields(
							{ name: '🎮 Player', value: `[${args[0]}](https://www.roblox.com/users/${robloxID}/profile) [${robloxDisplayName}]`, inline: true }, // prettier-ignore
							{ name: '🪙 Tokens Remaining', value: `${tokensUser.tokens - 1}`, inline: true }
						)
						.setColor(EMBED_COLOURS.red)
						.setFooter({ text: 'Indicate your response below.' }),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents([
						new ButtonBuilder() // prettier-ignore
							.setLabel('Confirm')
							.setStyle(ButtonStyle.Danger)
							.setCustomId('send'),

						new ButtonBuilder() // prettier-ignore
							.setLabel('Cancel')
							.setStyle(ButtonStyle.Success)
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

		openPrompt.add(interaction.user.id);

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
								.setDescription('Our staff team have been informed of this request. Please allow **up to 12 hours** to have the booster weapons issued before contacting us.')
								.setColor(EMBED_COLOURS.green),
						],
						components: [],
					});

					// @ts-ignore
					(bot.channels.cache.find((channel: any) => channel.name === '⏰staff-reminders') as TextChannel).send({
						content: `<@&818161643531796501>, <@&397792959766069249>`,
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('📬 New Request!')
								.setDescription(`A new booster weapon request has been made by **${interaction.guild?.members.cache.get(interaction.user.id)?.displayName}**.`)
								.addFields(
									{ name: '🎮 Player', value: `[${args[0]}](https://www.roblox.com/users/${robloxID}/profile) [${robloxDisplayName}]`, inline: true }, // prettier-ignore
									{ name: '🪙 Tokens Remaining', value: `${tokensUser.tokens - 1}`, inline: true }
								)
								.setColor(EMBED_COLOURS.blurple),
						],
					});

					if (tokensUser.tokens - 1 === 0) {
						return tokensUser.deleteOne({ userID: interaction.user.id });
					}

					tokensUser.tokens -= 1;
					tokensUser.save();
					collector.stop();
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
