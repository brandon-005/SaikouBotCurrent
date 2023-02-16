import { Command, ApplicationCommandOptionType, EmbedBuilder, Role } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'roleinfo',
		commandAliases: ['roleinformation', 'inforole'],
		commandDescription: 'Gain information about a specific role!',
		commandUsage: '<role>',
		slashOptions: [
			{
				name: 'role',
				description: 'The name of the role.',
				type: ApplicationCommandOptionType.Role,
				required: true,
			},
		],
	},
	run: async ({ interaction, args }) => {
		const role = interaction.guild?.roles.cache.find((serverRoles: Role) => serverRoles.id === args[0]);

		return interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('ℹ️ Role Information')
					.setFields([
						// prettier-ignore
						{ name: 'Name', value: `${role.name}`, inline: true },
						{ name: 'Colour', value: `${role.color === 0 ? 'None' : role.color}`, inline: true },
						{ name: 'Position', value: `${role.rawPosition}`, inline: true },
						{ name: 'Hoisted', value: `${role.hoist ? 'Yes' : 'No'}`, inline: true },
						{ name: 'Mentionable', value: `${role.mentionable ? 'Yes' : 'No'}`, inline: true },
						{ name: 'Managed', value: `${role.managed ? 'Yes' : 'No'}`, inline: true },
					])
					.setColor(EMBED_COLOURS.blurple)
					.setFooter({ text: `Role ID: ${role.id}` }),
			],
		});
	},
};

export = command;
