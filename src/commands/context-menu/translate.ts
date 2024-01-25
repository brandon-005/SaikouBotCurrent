import { ApplicationCommandType, ContextMenu, EmbedBuilder, GuildMember, PermissionFlagsBits } from 'discord.js';
import translate from '@iamtraction/google-translate';

import { EMBED_COLOURS } from '../../utils/constants';

const menu: ContextMenu = {
	config: {
		commandName: 'Translate Message',
		type: ApplicationCommandType.Message,
	},
	run: async ({ interaction }) => {
		if (!(interaction.member as GuildMember)?.permissions.has(PermissionFlagsBits.ManageMessages)) {
			return interaction.editReply({ content: 'Staff only feature.', ephemeral: true });
		}

		// @ts-ignore
		const messageContent = interaction.options.getMessage('message')!.content;
		const result = await translate(messageContent, { to: 'en' });

		interaction.editReply({
			embeds: [
				new EmbedBuilder() // prettier-ignore
					.addFields([
						// prettier-ignore
						{ name: 'Original Content', value: messageContent.length > 1020 ? `${messageContent.substring(0, 1019)}...` : messageContent },
						{ name: 'Translated Content', value: result.text.length > 1020 ? `${result.text.substring(0, 1019)}...` : result.text },
					])
					.setColor(EMBED_COLOURS.blurple)
					.setFooter({ text: `Auto corrected: ${result.from.text.autoCorrected ? 'Yes' : 'No'}` }),
			],
			ephemeral: true,
		});
	},
};

export = menu;
