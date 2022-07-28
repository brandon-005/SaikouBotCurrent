import { Command, EmbedBuilder } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'randomuser',
		commandAliases: ['random', 'pickuser'],
		commandDescription: "Wondering who to give that one boost to, or maybe you're wanting a random user to surpise? Then this command is for you!",
		slashCommand: true,
	},
	run: async ({ message, interaction }) => {
		let randomUser;

		if (!message) {
			randomUser = interaction.guild?.members.cache.random()!.user;
		} else {
			randomUser = message.guild!.members.cache.random()!.user;
		}

		const userEmbed = new EmbedBuilder() // prettier-ignore
			.setAuthor({ name: '🎲 Random User', iconURL: randomUser?.displayAvatarURL() })
			.setDescription(`**${message ? message.guild?.members.cache.get(randomUser!.id)?.displayName : interaction.guild?.members.cache.get(randomUser!.id)?.displayName}** was chosen! 🎉`)
			.setColor(EMBED_COLOURS.blurple);

		if (!message) {
			return interaction.followUp({ embeds: [userEmbed] });
		}

		return message.channel.send({ embeds: [userEmbed] });
	},
};

export = command;
