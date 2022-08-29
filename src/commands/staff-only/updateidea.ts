import { Command, Message, EmbedBuilder, TextChannel } from 'discord.js';

import { interactiveSetup, cancel, timeout } from '../../utils/embeds';
import { LETTER_EMOJIS, PROMPT_TIMEOUT, EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'updateidea',
		commandAliases: ['ui', 'upidea', 'updatesuggestion', 'suggestionapproveordeny'],
		commandDescription: 'accept suggestions',
		userPermissions: 'ManageMessages',
		limitedChannel: '🤖staff-cmds',
	},
	run: async ({ bot, interaction, message }) => {
		const suggestionChannels: any = {
			'💡suggestions': '🇦',
			'suggestions-nitro': '🇧',
			'featured-suggestions': '🇨',
		};

		const promptReactions = ['🇦', '🇧', '🚪'];
		let channelFinal: string = '';
		let targetMsg;
		let accept: Boolean = true;

		/* FUNCTIONS */
		function sendCancel(reactionPrompt: Boolean, inputtedReaction?: any, userMessage?: Message) {
			if (reactionPrompt === true && inputtedReaction === '🚪') return cancel(message, false);
			if (userMessage?.content.toLowerCase() === 'cancel') return cancel(message, false);
			return false;
		}

		/* SELECT CHANNEL PROMPT */
		const channelEmbed = await interactiveSetup(
			message,
			interaction,
			bot,
			false,
			'1/4',
			`❓ **Which channel is the suggestion in?\n\n${Object.keys(suggestionChannels)
				.map((option: string, number: number) => `${String.fromCharCode(97 + number).toUpperCase()}. ${option}\n`)
				.join('')}**\n\nSubmit your answer by reacting with the corresponding reaction.`,
			true
		);

		Object.values(suggestionChannels).forEach((_channel, count) => {
			channelEmbed!.react(String(LETTER_EMOJIS[count]));
		});

		channelEmbed?.react('🚪');

		try {
			const collectingReaction = await channelEmbed!.awaitReactions({ filter: (reaction: any, user: any) => LETTER_EMOJIS.includes(reaction.emoji.name) && user.id === interaction.user.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedReaction = collectingReaction.first()?.emoji.name;

			if (sendCancel(true, inputtedReaction) !== false) return;

			channelFinal = String(Object.keys(suggestionChannels).find((key: any) => suggestionChannels[key] === inputtedReaction));
		} catch (err) {
			return timeout(interaction, false, message);
		}

		/* MESSAGE ID PROMPT */
		await interactiveSetup(message, interaction, bot, false, '2/4', '❓ **What is the suggestion ID you would like to accept/deny?**');

		try {
			const collectingMessage = await interaction.channel.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === interaction.user.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedMessage = collectingMessage.first();

			if (sendCancel(false, null, inputtedMessage) !== false) return;

			try {
				targetMsg = await (interaction.guild.channels.cache.find((channel: any) => channel.name.includes(channelFinal)) as TextChannel).messages.fetch(inputtedMessage.content);
			} catch (err) {
				console.log(err);
				return interaction.followUp({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('❌ Incorrect Message ID!')
							.setDescription("Uh oh! Looks like that ID doesn't exist or an unknown error occurred. To copy the Message ID, follow below...")
							.setImage('https://i.ibb.co/FVbyLQC/image.png')
							.setColor(EMBED_COLOURS.red),
					],
				});
			}
		} catch (err) {
			return timeout(interaction, false, message);
		}

		/* ACCEPT OR DENY PROMPT */
		const updatePrompt = await interactiveSetup(message, interaction, bot, false, '3/4', '❓ **Would you like to accept or deny this suggestion?\n\nReact with 🇦 to accept or 🇧 to deny.**', true);

		promptReactions.forEach((reaction) => updatePrompt.react(reaction));

		try {
			const collectingReaction = await updatePrompt!.awaitReactions({ filter: (reaction: any, user: any) => promptReactions.includes(reaction.emoji.name) && user.id === interaction.user.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedReaction = collectingReaction.first()?.emoji.name;

			if (sendCancel(true, inputtedReaction) !== false) return;

			if (inputtedReaction === '🇧') accept = false;
		} catch (err) {
			return timeout(interaction, false, message);
		}

		/* OPTIONAL REASON PROMPT */
		await interactiveSetup(message, interaction, bot, false, '4/4', '❓ **What is the staff note you would like to attach to this suggestion?\n\nIf you don\'t wish to add a staff note, please respond with "None".** ');

		try {
			const collectingMessage = await interaction.channel.awaitMessages({ filter: (sentMsg: Message) => sentMsg.author.id === interaction.user.id, time: PROMPT_TIMEOUT, max: 1, errors: ['time'] });
			const inputtedMessage = collectingMessage.first();
			const oldEmbed = targetMsg.embeds[0];

			if (sendCancel(false, null, inputtedMessage) !== false) return;

			const successEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle('✅ Successfully updated!')
				.setDescription('The suggestion has been updated.')
				.setColor(EMBED_COLOURS.green);

			if (accept === false) {
				const denyEmbed = new EmbedBuilder() // prettier-ignore
					.setTitle(oldEmbed.title)
					.setAuthor({ name: `${oldEmbed.author.name}`, iconURL: oldEmbed.author.iconURL })
					.setDescription(oldEmbed.description)
					.addFields([{ name: 'Status', value: "❌ We're not interested in this suggestion at the moment." }])
					.setColor(EMBED_COLOURS.red)
					.setFooter({ text: 'Suggestion Denied' })
					.setTimestamp();

				if (inputtedMessage.content.toLowerCase() !== 'none') {
					denyEmbed.addFields([{ name: 'Staff Note', value: inputtedMessage.content }]);
				}

				targetMsg.edit({ embeds: [denyEmbed] });
				return interaction.followUp({ embeds: [successEmbed] });
			}

			const acceptEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle(oldEmbed.title)
				.setAuthor({ name: `${oldEmbed.author.name}`, iconURL: oldEmbed.author.iconURL })
				.setDescription(oldEmbed.description)
				.addFields([{ name: 'Status', value: '✅ Expect to see this suggestion as a reality soon!' }])
				.setColor(EMBED_COLOURS.green)
				.setFooter({ text: 'Suggestion Accepted' })
				.setTimestamp();

			if (inputtedMessage.content.toLowerCase() !== 'none') {
				acceptEmbed.addFields([{ name: 'Staff Note', value: inputtedMessage.content }]);
			}

			targetMsg.edit({ embeds: [acceptEmbed] });
			return interaction.followUp({ embeds: [successEmbed] });
		} catch (err) {
			console.error(err);
			return timeout(interaction, false, message);
		}
	},
};

export = command;
