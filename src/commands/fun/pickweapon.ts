import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import { choose } from '../../utils/functions';
import { EMBED_COLOURS, MWT_WEAPONS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'pickweapon',
		commandAliases: ['mwtweapon', 'pickmyweapon'],
		commandDescription: 'Looking for a challenge or unsure on what weapon to pick in MWT? Let this command do the hard work for you!',
		slashOptions: [
			{
				name: 'weapon-count',
				description: 'The amount of weapons you would like the bot to pick.',
				type: ApplicationCommandOptionType.Number,
				required: false,
			},
		],
	},
	run: async ({ interaction, args }) => {
		let weaponList: any = '';

		const weaponEmbed = new EmbedBuilder().setTitle('Your New Arsenal').setColor(EMBED_COLOURS.blurple).setThumbnail('https://i.ibb.co/FqgT3fp/Group-1.png');

		if (args[0] && !isNaN(Number(args[0])) && Number(args[0]) >= 1 && !(Number(args[0]) > 20)) {
			for (let currentCount = 0; currentCount < Number(args[0]); currentCount++) {
				const pickedWeapon = choose(MWT_WEAPONS);

				if (weaponList.includes(pickedWeapon)) {
					weaponList += `• ${choose(MWT_WEAPONS)}\n`;
				} else {
					weaponList += `• ${pickedWeapon}\n`;
				}
			}

			weaponEmbed.setDescription(`We've picked **${args[0]} weapons** for you to roll out on the battlefield with.`);
			weaponEmbed.addFields([{ name: 'Weapons', value: weaponList }]);

			interaction.editReply({ embeds: [weaponEmbed] });
		} else {
			weaponEmbed.setDescription("We've picked **1 weapon** for you to roll out on the battlefield with.");
			weaponEmbed.addFields([{ name: 'Weapon', value: `• ${choose(MWT_WEAPONS)}` }]);

			interaction.editReply({ embeds: [weaponEmbed] });
		}
	},
};

export = command;
