import { EmbedBuilder, Message, Client, CommandInteraction, WebhookClient } from 'discord.js';

import { EMBED_COLOURS } from './constants';

export function cancel(interaction: CommandInteraction, dm: Boolean) {
	const embed = new EmbedBuilder() // prettier-ignore
		.setTitle('✅ Cancelled!')
		.setDescription('The prompt has been cancelled successfully.')
		.setThumbnail('https://i.ibb.co/kxJqM6F/mascot-Success.png')
		.setColor(EMBED_COLOURS.green);

	if (dm === true) return interaction.user.send({ embeds: [embed] });
	return interaction.followUp({ embeds: [embed] });
}

export function noContent(interaction: CommandInteraction) {
	const embed = new EmbedBuilder() // prettier-ignore
		.setTitle('❌ No Content!')
		.setDescription("You didn't input any message content for this prompt. Please ensure you're not submitting videos or images and re-run the prompt again.")
		.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
		.setColor(EMBED_COLOURS.red);

	return interaction.user.send({ embeds: [embed] });
}

export function timeout(interaction: CommandInteraction, dm: Boolean) {
	const embed = new EmbedBuilder() // prettier-ignore
		.setTitle('❌ Cancelled!')
		.setDescription("You didn't input in time, please try again.")
		.setThumbnail('https://i.ibb.co/FD4CfKn/NoBolts.png')
		.setColor(EMBED_COLOURS.red);

	if (dm === true) return interaction.user.send({ embeds: [embed] });
	return interaction.channel.send({ embeds: [embed] });
}

export function noUser(interaction: CommandInteraction, dm?: Boolean): Promise<any | Message<boolean>> {
	const embed = new EmbedBuilder() // prettier-ignore
		.setTitle('🔍 Unable to find User!')
		.setDescription(`Please provide a valid user to complete this action.`)
		.setColor(EMBED_COLOURS.red)
		.setFooter({ text: 'Invalid User' })
		.setTimestamp();

	if (dm === true) return interaction.user.send({ embeds: [embed] });
	return interaction.followUp({ embeds: [embed] });
}

export function equalPerms(interaction: CommandInteraction, perms: string): Promise<any | Message<boolean>> {
	const embed = new EmbedBuilder() // prettier-ignore
		.setTitle('⚙️ Equal Permissions')
		.setDescription("The user you are trying to perform this action on has equal permissions to you, consider..\n\n• Changing the user's permissions\n• Changing the user's roles")
		.setColor(EMBED_COLOURS.red)
		.setFooter({ text: `Equal Permission(s): ${perms}` });

	return interaction?.followUp({ embeds: [embed] });
}

export function moderationDmEmbed(member: any, punishment: string, description: string, reason: string) {
	return member
		.send({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle(`${punishment} Received!`)
					.setDescription(description)
					.addFields([{ name: 'Moderator Note', value: reason, inline: false }])
					.setColor(EMBED_COLOURS.red)
					.setFooter({ text: 'THIS IS AN AUTOMATED MESSAGE' })
					.setTimestamp(),
			],
		})
		.catch(() => {});
}

export function moderationEmbed(message: any, bot: any, punishment: string, member: any, reason: string, mwt?: boolean, interaction?: CommandInteraction, manualModName?: string) {
	const embed = new EmbedBuilder() // prettier-ignore
		.setColor(EMBED_COLOURS.green)
		.setFooter({ text: punishment })
		.setTimestamp();

	if (manualModName) {
		embed.addFields([{ name: 'Moderator', value: `${manualModName}`, inline: true }]);
	} else if (message && member.id === message.author.id) {
		embed.addFields([{ name: 'Moderator', value: 'SaikouDev', inline: true }]);
	} else if (!message) {
		embed.addFields([{ name: 'Moderator', value: `<@${interaction!.user.id}>`, inline: true }]);
	} else {
		embed.addFields([{ name: 'Moderator', value: `<@${message.author.id}>`, inline: true }]);
	}

	if (mwt === true) {
		embed.addFields([
			// prettier-ignore
			{ name: 'Player', value: member, inline: true },
			{ name: 'Reason', value: reason, inline: false },
		]);
		embed.setAuthor({ name: `MWT | ${punishment}`, iconURL: 'https://t0.rbxcdn.com/2e469c3033c75ba1f84e8ece0d03e7d5' });
		embed.setThumbnail('https://t0.rbxcdn.com/2e469c3033c75ba1f84e8ece0d03e7d5');

		return bot.channels.cache.get(String(process.env.MODERATION_CHANNEL)).send({
			embeds: [embed],
		});
	}

	embed.addFields([
		// prettier-ignore
		{ name: 'User', value: `<@${member.id}>`, inline: true },
		{ name: 'Reason', value: reason, inline: false },
	]);
	embed.setAuthor({ name: `Saikou Discord | ${punishment}`, iconURL: member.user.displayAvatarURL() });
	embed.setThumbnail(member.user.displayAvatarURL());

	return bot.channels.cache.get(String(process.env.MODERATION_CHANNEL)).send({
		embeds: [embed],
	});
}

export function errorEmbed(interaction?: CommandInteraction) {
	const embed = new EmbedBuilder() // prettier-ignore
		.setTitle('❌ Something went wrong!') // prettier-ignore
		.setDescription(`Uh oh! Looks like Kaiou has hit some of the wrong buttons, causing an error. You can try... \n\n• Coming back later and trying again\n• Checking out Saikou's social medias whilst you wait 😏`)
		.setThumbnail('https://i.ibb.co/C5YvkJg/4-128.png')
		.setColor(EMBED_COLOURS.red);

	return interaction?.followUp({ embeds: [embed] });
}

export function devErrorEmbed(bot: Client, title: string, errorMessage: string) {
	new WebhookClient({ id: `${BigInt(String(process.env.WEBHOOK_ID))}`, token: String(process.env.WEBHOOK_TOKEN) }).send({
		embeds: [
			new EmbedBuilder() // prettier-ignore
				.setTitle(`❌ ${title}`)
				.setDescription(errorMessage)
				.setFooter({ text: `Error Occured • ${bot.user!.username}` })
				.setColor(EMBED_COLOURS.red)
				.setTimestamp(),
		],
	});
}
