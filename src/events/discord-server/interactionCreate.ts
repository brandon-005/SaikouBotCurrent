import { Client, Role, EmbedBuilder, TextChannel, InteractionType, Interaction, GuildMember } from 'discord.js';

import { EMBED_COLOURS } from '../../utils/constants';

export = async (bot: Client, interaction: Interaction) => {
	if (interaction.isButton()) {
		/* Ping Role buttons */
		switch (interaction.customId) {
			case 'GetRole':
				if ((interaction.member as GuildMember).roles.cache.some((role: Role) => role.name === 'Ping')) {
					return interaction.reply({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setDescription('❌ You already have the **Ping** role.')
								.setColor(EMBED_COLOURS.red),
						],
						ephemeral: true,
					});
				}

				(interaction.member as GuildMember).roles.add(interaction.guild!.roles.cache.find((role: Role) => role.name === 'Ping')!);

				return interaction.reply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setDescription('✅ You were given the **Ping** role.')
							.setColor(EMBED_COLOURS.green),
					],
					ephemeral: true,
				});

			case 'RemoveRole':
				if (!(interaction.member as GuildMember).roles.cache.some((role: Role) => role.name === 'Ping')) {
					return interaction.reply({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setDescription(`❌ You don't have the **Ping** role.`)
								.setColor(EMBED_COLOURS.red),
						],
						ephemeral: true,
					});
				}

				(interaction.member as GuildMember).roles.remove(interaction.guild!.roles.cache.find((role: Role) => role.name === 'Ping')!);

				return interaction.reply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setDescription('✅ You were removed from the **Ping** role.')
							.setColor(EMBED_COLOURS.green),
					],
					ephemeral: true,
				});

			case 'receivedNotice':
				interaction.update({ components: [] });
				interaction.channel.send({ content: 'Thank you, your acknowledgement of this notice has been recorded!' });

				bot.guilds.cache
					.get(`${process.env.SERVER_ID}`)
					?.channels.cache.get(`${process.env.CLASSIFIED_CHANNEL}`)!
					// @ts-ignore
					.send({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.setTitle('Notice Received! 📮')
								.setDescription(`${interaction.user.username} has acknowledged their punishment notice.`)
								.setColor(EMBED_COLOURS.green),
						],
					});

				break;

			default:
				break;
		}
	}

	/* HANDLING MODALS */
	if (interaction.type === InteractionType.ModalSubmit) {
		if (interaction.customId === 'intro-form') {
			const aboutMe = interaction.fields.getTextInputValue('aboutMe');
			const hobbies = interaction.fields.getTextInputValue('hobbiesInput');
			const colour = interaction.fields.getTextInputValue('colourInput');

			const introMessage = (bot.channels.cache.find((channel: any) => channel.name === '👋introductions') as TextChannel).send({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle(`👋 ${bot.guilds.cache.get(process.env.SERVER_ID)?.members.cache.get(interaction.user.id)?.displayName || interaction.user.username}'s Introduction!`)
						.addFields([
							{ name: 'About Myself', value: aboutMe }, // prettier-ignore
							{ name: 'My Hobbies', value: hobbies },
							{ name: 'My Favourite Colour', value: colour },
						])
						.setThumbnail(interaction.user.avatarURL())
						.setFooter({ text: `${interaction.user.tag} (${interaction.user.id})`, iconURL: interaction.user.avatarURL() })
						.setColor(EMBED_COLOURS.blurple),
				],
			});

			(await introMessage).react('👋');

			// @ts-ignore
			interaction.update({
				components: [],
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('✅ Introduction Posted!')
						.setDescription('Your introduction has been posted in <#984067335038054451>.')
						.setColor(EMBED_COLOURS.green)
						.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-success.png'),
				],
			});
		}
	}
};
