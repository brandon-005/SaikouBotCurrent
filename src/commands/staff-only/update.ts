import { Command, ApplicationCommandOptionType, EmbedBuilder, TextChannel } from 'discord.js';

import { EMBED_COLOURS } from '../../utils/constants';
import reportData from '../../models/reports';

const command: Command = {
	config: {
		commandName: 'update',
		commandAliases: ['ui', 'upidea', 'updatesuggestion', 'updatereport'],
		commandDescription: 'Approve/deny reports & suggestions.',
		userPermissions: 'ManageMessages',
		limitedChannel: '🤖staff-cmds',
		slashOptions: [
			{
				name: 'channel',
				description: 'The channel of the suggestion/report to update.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: '#📝report-abuse',
						value: '📝report-abuse',
					},
					{
						name: '#📬featured-suggestions',
						value: '📬featured-suggestions',
					},
					{
						name: '#🔥suggestions-nitro',
						value: '🔥suggestions-nitro',
					},
					{
						name: '#💡suggestions',
						value: '💡suggestions',
					},
				],
			},
			{
				name: 'message-id',
				description: 'The message ID of the report/suggestion.',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'status',
				description: 'Approve or deny the report/suggestion.',
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
		let targetMsg;

		try {
			targetChannel = await interaction.guild.channels.cache.find((channel: TextChannel) => channel.name.match(args[0]));
			targetMsg = await targetChannel.messages.fetch(args[1]);
		} catch (err) {
			return interaction.followUp({
				embeds: [
					new EmbedBuilder() // prettier-ignore
						.setTitle('❌ Incorrect Message ID!')
						.setDescription("Uh oh! Looks like that ID doesn't exist or an unknown error occurred. To copy the Message ID, follow below...")
						.setImage('https://i.ibb.co/FVbyLQC/image.png')
						.setColor(EMBED_COLOURS.red),
				],
			});
		}

		const oldEmbed = targetMsg.embeds[0];

		console.log(oldEmbed);

		interaction.followUp({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('✅ Successfully updated!')
					.setDescription('The message has been updated.')
					.setColor(EMBED_COLOURS.green),
			],
		});

		/* ACCEPTING AND DENYING REPORTS */
		if (targetChannel.name === '📝report-abuse') {
			const reporter = await reportData.findOne({ messageID: args[1] });

			const newReportEmbed = new EmbedBuilder() // prettier-ignore
				.setDescription(oldEmbed.description)
				.setThumbnail(oldEmbed.thumbnail.url);

			const dmEmbed = new EmbedBuilder() // prettier-ignore
				.setDescription(`Hey, **${interaction.guild?.members.cache.get(reporter.userID)?.displayName}**!\n\nThank you for submitting a player report for one of Saikou's affiliated platforms. We appreciate your patience whilst we reviewed and investigated the offence that had occurred.\n\nAttached to this automated message will include a moderator note, stating the status of your report. Please note that if a moderator note was not included, we may not be able to provide details divulging into this specific case.\n\nYour support towards our Community Rules is much appreciated. Please let a staff member know if you have any questions, feedback or comments. We'd be happy to assist you in any way we can.`)
				.addFields({ name: 'Moderator Note', value: args[3] || 'None Provided.' })
				.setFooter({ text: 'THIS IS AN AUTOMATED MESSAGE' })
				.setTimestamp();

			if (args[2] === 'false') {
				newReportEmbed.setTitle('❌ Report Denied!');
				dmEmbed.setTitle('❌ Report Denied!');
				newReportEmbed.setColor(EMBED_COLOURS.red);
				dmEmbed.setColor(EMBED_COLOURS.red);
				newReportEmbed.setFooter({ text: `Denied - ${interaction.guild?.members.cache.get(reporter.userID)?.displayName}`, iconURL: oldEmbed.footer.icon_url });
			} else {
				newReportEmbed.setTitle('✅ Report Approved!');
				dmEmbed.setTitle('✅ Report Approved!');
				newReportEmbed.setColor(EMBED_COLOURS.green);
				dmEmbed.setColor(EMBED_COLOURS.green);
				newReportEmbed.setFooter({ text: `Approved - ${interaction.guild?.members.cache.get(reporter.userID)?.displayName}`, iconURL: oldEmbed.footer.icon_url });
			}

			targetMsg.edit({ embeds: [newReportEmbed] });
			return bot.users.send(reporter.userID, { embeds: [dmEmbed] });
		}

		/* ACCEPTING AND DENYING SUGGESTIONS */
		const newEmbed = new EmbedBuilder() // prettier-ignore
			.setTitle(oldEmbed.title)
			.setAuthor({ name: `${oldEmbed.author.name}`, iconURL: oldEmbed.author.iconURL })
			.setDescription(oldEmbed.description)
			.setTimestamp();

		if (args[3]) {
			newEmbed.addFields([{ name: 'Staff Note', value: args[3] }]);
		}

		if (args[2] === 'false') {
			newEmbed.addFields([{ name: 'Status', value: "❌ We're not interested in this suggestion at the moment." }]);
			newEmbed.setColor(EMBED_COLOURS.red);
			newEmbed.setFooter({ text: 'Suggestion Denied' });

			return targetMsg.edit({ embeds: [newEmbed] });
		}

		newEmbed.addFields([{ name: 'Status', value: '✅ Expect to see this suggestion as a reality soon!' }]);
		newEmbed.setColor(EMBED_COLOURS.green);
		newEmbed.setFooter({ text: 'Suggestion Accepted' });

		return targetMsg.edit({ embeds: [newEmbed] });
	},
};

export = command;
