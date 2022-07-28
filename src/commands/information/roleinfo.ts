import { Command, ApplicationCommandOptionType, EmbedBuilder, Role } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'roleinfo',
		commandAliases: ['roleinformation', 'inforole'],
		commandDescription: 'Gain information about a specific role!',
		commandUsage: '<role>',
		slashCommand: true,
		slashOptions: [
			{
				name: 'role',
				description: 'The name of the role.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	run: async ({ message, args, interaction }) => {
		const role = message ? message.guild?.roles.cache.find((serverRoles: Role) => serverRoles.name.toLowerCase() === args.join(' ')?.toLowerCase()) : interaction.guild?.roles.cache.find((serverRoles: Role) => serverRoles.name.toLowerCase() === args[0]?.toLowerCase());

		if (!role) {
			const noRoleEmbed = new EmbedBuilder() // prettier-ignore
				.setTitle('🗄️ Invalid Role!')
				.setDescription('Unable to find the specified role.')
				.setColor(EMBED_COLOURS.red);

			if (!message) return interaction.followUp({ embeds: [noRoleEmbed] });
			return message.channel.send({ embeds: [noRoleEmbed] });
		}

		const roleInfoEmbed = new EmbedBuilder() // prettier-ignore
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
			.setFooter({ text: `Role ID: ${role.id}` });

		if (!message) return interaction.followUp({ embeds: [roleInfoEmbed] });
		return message.channel.send({ embeds: [roleInfoEmbed] });
	},
};

export = command;
