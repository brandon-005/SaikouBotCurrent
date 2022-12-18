import { Command, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import triviaData from '../../models/correctTrivia';
import tokenData from '../../models/weaponTokens';
import { EMBED_COLOURS } from '../../utils/constants';
import { noUser } from '../../utils/embeds';

const command: Command = {
	config: {
		commandName: 'award',
		commandAliases: ['addpoints'],
		commandDescription: 'DEVELOPER ONLY - Awarding points.',
		limitedChannel: 'None',
		developerOnly: true,
		slashOptions: [
			{
				name: 'data',
				description: 'Which data you would like to alter.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: '🔢 Trivia Points',
						value: 'Trivia Points',
					},
					{
						name: '🪙 Booster Tokens',
						value: 'Booster Tokens',
					},
				],
			},
			{
				name: 'user',
				description: "User who's data you would like to change.",
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'value',
				description: 'The new value for the data.',
				type: ApplicationCommandOptionType.Number,
				required: true,
			},
		],
	},
	run: async ({ interaction, args }) => {
		/* If user can't be found in cache */
		if (!interaction.inCachedGuild()) return noUser(interaction, false);

		const member = interaction.options.getMember('user');

		if (!member) return noUser(interaction, false);

		const successEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle('✅ Successfully Updated!')
			.setDescription(`The **${args[0]}** for **${member.user.username}** has been updated successfully.`)
			.setColor(EMBED_COLOURS.green);

		/* TRIVIA POINTS */
		if (args[0] === 'Trivia Points') {
			const triviaUser = await triviaData.findOne({ userID: member.id });

			if (!triviaUser) {
				triviaData.create({
					userID: member.id,
					answersCorrect: args[2],
				});

				return interaction.editReply({
					embeds: [successEmbed],
				});
			}
			triviaUser.answersCorrect += Number(args[2]);
			triviaUser.save();

			return interaction.editReply({
				embeds: [successEmbed],
			});
		}

		/* BOOSTER TOKENS */
		const tokenUser = await tokenData.findOne({ userID: member.id });

		if (!tokenUser) {
			tokenData.create({
				userID: member.id,
				tokens: args[2],
			});

			return interaction.editReply({
				embeds: [successEmbed],
			});
		}

		tokenUser.tokens += Number(args[2]);
		tokenUser.save();

		return interaction.editReply({
			embeds: [successEmbed],
		});
	},
};

export = command;
