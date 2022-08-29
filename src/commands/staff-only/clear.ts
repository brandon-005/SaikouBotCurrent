import { Command, ApplicationCommandOptionType, Message, EmbedBuilder } from 'discord.js';

import { EMBED_COLOURS, MESSAGE_TIMEOUT } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'clear',
		commandAliases: ['purge'],
		commandDescription: 'Used for removing a set amount of messages in a channel or from a user.',
		userPermissions: 'ManageMessages',
		limitedChannel: 'None',
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
	run: async ({ args, interaction }) => {
		const deleteAmount = args[0];
		const member = interaction.options.getMember('user');

		if (isNaN(Number(deleteAmount)) || parseInt(String(deleteAmount), 10) <= 0) {
			return interaction.followUp({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription(`**❌ Amount cannot be less than 1 or contain letters.**`)
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		if (parseInt(String(deleteAmount), 10) > 100) {
			return interaction.followUp({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription('**❌ Deletion amount must be less than 100.**')
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		if (!member) {
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

		const fetchedMsg = await interaction.channel?.messages.fetch();
		let deletedMessages = 0;

		fetchedMsg!
			.filter((msg: Message) => msg.author.id === member.id)
			.forEach((userMsg: Message) => {
				if (deletedMessages > Number(deleteAmount)) return;
				userMsg.delete();
				deletedMessages += 1;
			});

		return interaction.followUp({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setDescription(`**✅ Successfully deleted ${deleteAmount} messages from <@${member.id}>!**`)
					.setColor(EMBED_COLOURS.green),
			],
		});
	},
};

export = command;
