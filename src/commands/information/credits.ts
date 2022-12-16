import { Command, EmbedBuilder } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'credits',
		commandAliases: ['creds', 'botcredits', 'bothelpers'],
		commandDescription: "A small thank you to our testing and developer hero's ❤",
	},
	run: async ({ bot, interaction }) => {
		const users = {
			bot: {
				'229142187382669312': 'Head Developer',
				'800398087432437770': 'v2 Developer ❤️',
			},
			contributors: {
				'458023820129992716': 'v3 Tester',
				'697864119302225952': 'v3 Tester',
				'341317140655243266': 'v3 Tester',
				'659547368504688650': 'v3 Tester',
				'670080884249985085': 'v3 Tester',
			},
		};

		async function fetchUsers(category: object) {
			let returnedUsers: any = '';
			for (const userID of Object.entries(category)) {
				// eslint-disable-next-line no-await-in-loop
				const fetchedUser = await bot.users.fetch(`${BigInt(userID[0])}`);
				returnedUsers += `**${fetchedUser.username}#${fetchedUser.discriminator}** \`[${userID[1]}]\`\n`;
			}
			return returnedUsers;
		}

		return interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('❤ SaikouBot Credits')
					.setDescription(`Massive thank you to our testing and developer hero's who without them wouldn't of provided the experience SaikouBot has today.`)
					.addFields([
						// prettier-ignore
						{ name: '→ Bot Developers:', value: await fetchUsers(users.bot) },
						{ name: '→ Contributors:', value: await fetchUsers(users.contributors) },
					])
					.setColor(EMBED_COLOURS.blurple)
					.setThumbnail(String(bot.user?.displayAvatarURL())),
			],
		});
	},
};

export = command;
