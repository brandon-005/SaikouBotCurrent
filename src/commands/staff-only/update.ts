import { Command, ApplicationCommandOptionType, EmbedBuilder, TextChannel, Message } from 'discord.js';

import { EMBED_COLOURS } from '../../utils/constants';
import reportData from '../../models/reports';

const command: Command = {
	config: {
		commandName: 'update',
		commandAliases: ['updatereport'],
		commandDescription: 'Approve/deny reports & suggestions.',
		commandUsage: '<channel> <message-id> <status> [note]',
		userPermissions: 'ManageMessages',
		limitedChannel: '🤖staff-cmds',
		slashOptions: [
			{
				name: 'message-id',
				description: 'The message ID of the report.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'status',
				description: 'Approve or deny the report.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: '✅ Approved',
						value: 'true',
					},
					{
						name: '❌ Denied',
						value: 'false',
					},
				],
			},
			{
				name: 'staff-note',
				description: 'Used to offer feedback to the author.',
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	},
	run: async ({ bot, args, interaction }) => {
		let targetChannel;
		let targetMsg: Message;

		try {
			targetChannel = interaction.guild.channels.cache.find((channel: any) => channel.name.match('📝report-abuse')) as TextChannel;
			targetMsg = await targetChannel.messages.fetch(args[0]);
		} catch (err) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('❌ Incorrect Message ID!')
						.setDescription("Uh oh! Looks like that ID doesn't exist or an unknown error occurred. To copy the Message ID, follow below...")
						.setImage('https://saikou.dev/assets/images/discord-bot/suggest-help.png')
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		const reporter = await reportData.findOne({ messageID: args[0] });
		const oldEmbed = targetMsg.embeds[0];

		if (!reporter)
			return interaction.editReply({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('❌ Unable to update!')
						.setDescription('There is no data found for this report.')
						.setColor(EMBED_COLOURS.red),
				],
			});

		interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('✅ Successfully updated!')
					.setDescription('The message has been updated.')
					.setColor(EMBED_COLOURS.green),
			],
		});

		/* ACCEPTING AND DENYING REPORTS */
			const newReportEmbed = new EmbedBuilder() // prettier-ignore
				.setDescription(oldEmbed.description)
				.setThumbnail(oldEmbed.thumbnail.url);

			const dmEmbed = new EmbedBuilder() // prettier-ignore
				.setDescription(`Hey, **${interaction.guild?.members.cache.get(reporter.userID)?.displayName}**!\n\nThank you for submitting a player report for one of Saikou's affiliated platforms. We appreciate your patience whilst we reviewed and investigated the offence that had occurred.\n\nAttached to this automated message will include a moderator note, stating the status of your report. Please note that if a moderator note was not included, we may not be able to provide details divulging into this specific case.\n\nYour support towards our Community Rules is much appreciated. Please let a staff member know if you have any questions, feedback or comments. We'd be happy to assist you in any way we can.`)
				.addFields({ name: 'Moderator Note', value: args[3] || 'None Provided.' })
				.setFooter({ text: 'THIS IS AN AUTOMATED MESSAGE' })
				.setTimestamp();

			if (args[1] === 'false') {
				newReportEmbed.setTitle('❌ Report Denied!');
				dmEmbed.setTitle('❌ Report Denied!');
				newReportEmbed.setColor(EMBED_COLOURS.red);
				dmEmbed.setColor(EMBED_COLOURS.red);
				newReportEmbed.setFooter({ text: `Denied - ${interaction.guild?.members.cache.get(reporter.userID)?.displayName}`, iconURL: oldEmbed.footer.iconURL });
			} else {
				newReportEmbed.setTitle('✅ Report Approved!');
				dmEmbed.setTitle('✅ Report Approved!');
				newReportEmbed.setColor(EMBED_COLOURS.green);
				dmEmbed.setColor(EMBED_COLOURS.green);
				newReportEmbed.setFooter({ text: `Approved - ${interaction.guild?.members.cache.get(reporter.userID)?.displayName}`, iconURL: oldEmbed.footer.iconURL });
			}

			bot.users.send(reporter.userID, { embeds: [dmEmbed] }).catch(() => {});
			return targetMsg.edit({ embeds: [newReportEmbed] });
	},
};

export = command;
