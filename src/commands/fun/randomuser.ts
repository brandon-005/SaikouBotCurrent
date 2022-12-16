import { Command, EmbedBuilder } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'randomuser',
		commandAliases: ['random', 'pickuser'],
		commandDescription: "Wondering who to give that one boost to, or maybe you're wanting a random user to surpise? Then this command is for you!",
	},
	run: async ({ interaction }) => {
		const randomUser = interaction.guild?.members.cache.random()!.user;

		return interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setAuthor({ name: '🎲 Random User', iconURL: randomUser?.displayAvatarURL() })
					.setDescription(`**${interaction.guild?.members.cache.get(randomUser!.id)?.displayName}** was chosen! 🎉`)
					.setColor(EMBED_COLOURS.blurple),
			],
		});
	},
};

export = command;
