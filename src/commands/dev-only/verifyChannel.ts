import { Command, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, EmbedBuilder } from 'discord.js';
import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'verifychannel',
		commandAliases: ['channelverification'],
		commandDescription: 'Used to post the verify account message..',
		developerOnly: true,
		limitedChannel: 'None',
	},
	run: async ({ interaction }) => {
		interaction.editReply({ content: 'Success!' }).then((msg: Message) => msg.delete());

		interaction.channel.send({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.setTitle('Verify Your Account! 🔗')
					.setDescription('Welcome to **Saikou!** Click the button below to Verify with SaikouBot and gain access to the rest of the server.')
					.setColor(EMBED_COLOURS.blurple)
					.setThumbnail('https://saikou.dev/assets/images/discord-bot/mascot-happy.png'),
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					new ButtonBuilder() // prettier-ignore
						.setLabel('🤖 Verify with SaikouBot')
						.setStyle(ButtonStyle.Success)
						.setCustomId('VerifyAccount'),

					new ButtonBuilder() // prettier-ignore
						.setLabel('❔ Need help?')
						.setStyle(ButtonStyle.Link)
						.setURL('https://discord.com/channels/840280079536095314/840957182534877194/1083387167683919896'),
				]),
			],
		});
	},
};

export = command;
