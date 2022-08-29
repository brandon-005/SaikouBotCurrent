import { Command, ApplicationCommandOptionType, CommandInteraction, EmbedBuilder } from 'discord.js';

import { noUser } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'unmute',
		commandAliases: ['removemute'],
		commandDescription: "Used for removing a specific user's mute.",
		userPermissions: 'ManageMessages',
		commandUsage: '<user>',
		limitedChannel: 'None',
		slashOptions: [
			{
				name: 'user',
				description: "The user who's mute you'd like to remove.",
				type: ApplicationCommandOptionType.User,
				required: true,
			},
		],
	},
	run: async ({ message, interaction }) => {
		const member = interaction.options.getMember('user');
		if (!member) return noUser(message, false, interaction as CommandInteraction);

		if (member.isCommunicationDisabled() === false) {
			const noDataEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle('🔍 Unable to find data!')
				.setDescription(`This user has no mute to remove.`)
				.setColor(EMBED_COLOURS.red)
				.setFooter({ text: 'No data' })
				.setTimestamp();

			return interaction.followUp({ embeds: [noDataEmbed] });
		}

		await member.timeout(0, `Removed by ${message ? message.author.username : interaction.user.username}`);

		return interaction.followUp({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setDescription(`✅ **${member.displayName}'s mute was removed.**`)
					.setColor(EMBED_COLOURS.green),
			],
		});
	},
};

export = command;
