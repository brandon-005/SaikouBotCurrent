import { Command, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from 'discord.js';

const command: Command = {
	config: {
		commandName: 'pingchannel',
		commandAliases: ['channelping'],
		commandDescription: 'Used to post the ping role button message.',
		developerOnly: true,
		limitedChannel: 'None',
	},
	run: async ({ interaction }) => {
		interaction.editReply({ content: 'Success!' }).then((msg: Message) => msg.delete());

		interaction.channel.send({
			content: '►**Where can I get notified for community events?**\nYou can press the buttons below to receive or remove our ping role. This will allow you to be informed of any upcoming community events that aren’t addressed to everyone.',
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents([new ButtonBuilder().setLabel('Get Role').setStyle(ButtonStyle.Success).setCustomId('GetRole'), new ButtonBuilder().setLabel('Remove Role').setStyle(ButtonStyle.Danger).setCustomId('RemoveRole')])],
		});
	},
};

export = command;
