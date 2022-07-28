import { Command, EmbedBuilder } from 'discord.js';

import { noUser } from '../../utils/embeds';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'unban',
		commandAliases: ['removeban'],
		commandDescription: 'Use this command to remove a ban from a specific user, handy for when mistakes are made!',
		userPermissions: 'BanMembers',
		commandUsage: '<ID>',
		limitedChannel: 'None',
	},
	run: async ({ message, args }) => {
		await message.guild?.bans.fetch().then((bans) => {
			if (bans.size === 0 || !bans.find((member: any) => member.user.id === args[0])) return noUser(message);

			const bannedUser = bans.find((member: any) => member.user.id === args[0]);

			message.guild!.members.unban(bannedUser!.user);

			message.channel.send({
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
