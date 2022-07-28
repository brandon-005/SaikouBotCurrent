/* eslint-disable no-underscore-dangle */
import { Command, ApplicationCommandOptionType, Message, EmbedBuilder } from 'discord.js';

import { EMBED_COLOURS, MESSAGE_TIMEOUT } from '../../utils/constants';
import { getMember } from '../../utils/functions';

const command: Command = {
	config: {
		commandName: 'clear',
		commandAliases: ['purge'],
		commandDescription: 'Used for removing a set amount of messages in a channel or from a user.',
		userPermissions: 'ManageMessages',
		commandUsage: '<message_amount> [user]',
		limitedChannel: 'None',
		slashCommand: true,
		slashOptions: [
			{
				name: 'delete-amount',
				description: 'The amount of messages to delete.',
				type: ApplicationCommandOptionType.Number,
				required: true,
			},
			{
				name: 'user',
				description: "The user who's messages you'd like to remove.",
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ message, args, interaction }) => {
		const deleteAmount = args[0];
		let member: any;

		if (message) {
			member = getMember(message, String(args[1]), true);
		} else {
			member = interaction.options.getMember('user');
		}

		// eslint-disable-next-line no-restricted-globals
		if (isNaN(Number(deleteAmount)) || parseInt(String(deleteAmount), 10) <= 0) {
			const incorrectAmount = new EmbedBuilder() // prettier-ignore
				.setDescription(`**❌ Amount cannot be less than 1 or contain letters.**`)
				.setColor(EMBED_COLOURS.red);

			if (message) {
				return message.channel.send({
					embeds: [incorrectAmount],
				});
			}
			return interaction.followUp({ embeds: [incorrectAmount] });
		}

		if (parseInt(String(deleteAmount), 10) > 100) {
			const lessThan100 = new EmbedBuilder() // prettier-ignore
				.setDescription('**❌ Deletion amount must be less than 100.**')
				.setColor(EMBED_COLOURS.red);

			if (message) {
				return message.channel.send({ embeds: [lessThan100] });
			}

			return interaction.followUp({ embeds: [lessThan100] });
		}

		if (!member) {
			if (message) {
				return (
					message.channel
						// @ts-ignore
						.bulkDelete(deleteAmount)
						.then(() => {
							message.channel
								.send({
									embeds: [
										new EmbedBuilder() // prettier-ignore
											.setDescription(`**✅ Successfully deleted ${deleteAmount} messages!**`)
											.setColor(EMBED_COLOURS.green),
									],
								})
								.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
						})
						.catch(() => {
							message.channel.send({
								embeds: [
									new EmbedBuilder() // prettier-ignore
										.setDescription('**❌ You can only delete messages that are under 14 days old.**')
										.setColor(EMBED_COLOURS.red),
								],
							});
						})
				);
			}

			return interaction
				.channel! // @ts-ignore
				.bulkDelete(deleteAmount)
				.then(() => {
					interaction
						.channel!.send({
							embeds: [
								new EmbedBuilder() // prettier-ignore
									.setDescription(`**✅ Successfully deleted ${deleteAmount} messages!**`)
									.setColor(EMBED_COLOURS.green),
							],
						})
						.then((msg: Message) => setTimeout(() => msg.delete(), MESSAGE_TIMEOUT));
				})
				.catch(() => {
					interaction.channel!.send({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setDescription('**❌ You can only delete messages that are under 14 days old.**')
								.setColor(EMBED_COLOURS.red),
						],
					});
				});
		}

		const fetchedMsg = message ? await message.channel.messages.fetch() : await interaction.channel?.messages.fetch();
		let deletedMessages = 0;

		fetchedMsg!
			.filter((msg: Message) => msg.author.id === member.id)
			.forEach((userMsg: Message) => {
				if (deletedMessages > Number(deleteAmount)) return;
				userMsg.delete();
				deletedMessages += 1;
			});

		const successMember = new EmbedBuilder() // prettier-ignore
			.setDescription(`**✅ Successfully deleted ${deleteAmount} messages from <@${member.id}>!**`)
			.setColor(EMBED_COLOURS.green);

		if (message) {
			return message.channel.send({ embeds: [successMember] });
		}

		return interaction.followUp({ embeds: [successMember] });
	},
};

export = command;
