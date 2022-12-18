import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import { noUser } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'unban',
		commandAliases: ['removeban'],
		commandDescription: 'Use this command to remove a ban from a specific user, handy for when mistakes are made!',
		commandUsage: '<id>',
		userPermissions: 'BanMembers',
		limitedChannel: 'None',
		slashOptions: [
			{
				name: 'id',
				description: 'The user ID of the person to remove the ban from.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ interaction, args }) => {
		await interaction.guild?.bans.fetch().then((bans: any) => {
			if (bans.size === 0 || !bans.find((member: any) => member.user.id === args[0])) return noUser(interaction, false);

			const bannedUser = bans.find((member: any) => member.user.id === args[0]);

			interaction.guild!.members.unban(bannedUser!.user);

			interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setDescription(`✅ **${bannedUser!.user.username} has been unbanned.**`)
						.setColor(EMBED_COLOURS.green),
				],
			});
		});
	},
};

export = command;
