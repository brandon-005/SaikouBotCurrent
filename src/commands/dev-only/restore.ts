import { Command, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, Message, EmbedBuilder } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { EMBED_COLOURS } from '../../utils/constants';

const activeBackups = readdirSync(`${join(__dirname, '../../../dataBackups/')}`);
const backupChoices: any = [];

activeBackups.forEach((backup) => {
	backupChoices.push({
		name: `${backup}`,
		value: `${backup}`,
	});
});

const command: Command = {
	config: {
		commandName: 'restore',
		commandAliases: ['restorebackup'],
		commandDescription: 'DEVELOPER ONLY - Restore server backup.',
		developerOnly: true,
		limitedChannel: 'None',
		slashOptions: [
			{
				name: 'backup',
				description: 'The backup you would like to restore.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: backupChoices,
			},
		],
	},
	run: async ({ args, interaction }) => {
		const guildData = JSON.parse(`${readFileSync(join(__dirname, `../../../dataBackups/${args[0]}`))}`);

		interaction.guild.roles.cache
			.filter((role) => !role.managed && role.editable && role.id !== interaction.guild.id)
			.forEach(async (role) => {
				role.delete().catch(() => {});
			});

		await interaction.guild.edit(guildData.guildData).then(() => {
			guildData.roles.forEach((roleData: any) => {
				if (roleData.isEveryone) {
					interaction.guild.roles.cache.get(interaction.guild.id).edit({
						name: roleData.name,
						color: roleData.color,
						permissions: BigInt(roleData.permissions),
						mentionable: roleData.mentionable,
					});
				} else {
					interaction.guild.roles.create({
						name: roleData.name,
						color: roleData.color,
						hoist: roleData.hoist,
						permissions: BigInt(roleData.permissions),
						mentionable: roleData.mentionable,
					});
				}

				interaction.editReply({
					embeds: [
						new EmbedBuilder() // prettier-ignore
							.setTitle('✅ Successfully restored!')
							.setDescription(`The **${args[0]}** restore has been completed.`)
							.setColor(EMBED_COLOURS.green),
					],
				});
			});
		});
	},
};

export = command;
