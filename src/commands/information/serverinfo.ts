import { Channel, Guild, GuildMember, Role, Command, EmbedBuilder, ChannelType } from 'discord.js';
import moment from 'moment';

import { EMBED_COLOURS } from '../../utils/constants';

const command: Command = {
	config: {
		commandName: 'serverinfo',
		commandAliases: ['server', 'infoserver'],
		commandDescription: 'Get all the information you could ever want about the server, right here nested within this command!',
	},
	run: async ({ interaction }) => {
		const guild: Guild = await interaction.guild!.fetch();

		if (!guild.available) return interaction.followUp('Unable to perform this action right now.');

		return interaction.followUp({
			embeds: [
				new EmbedBuilder() //
					.setAuthor({ name: guild.name, iconURL: `${guild.iconURL() ? guild.iconURL() : 'https://i.ibb.co/mGBw946/image.png'}` })
					.setThumbnail(`${guild.iconURL() ? guild.iconURL() : 'https://i.ibb.co/mGBw946/image.png'}`)
					.addFields([
						// prettier-ignore
						{ name: 'Owner', value: `${(await guild.fetchOwner()).nickname}`, inline: true },
						{ name: 'AFK Timeout', value: `${guild.afkTimeout}`, inline: true },
						{ name: 'Vanity Invite', value: guild.vanityURLCode || 'None', inline: true },
						{ name: 'Rules Channel', value: `${guild.rulesChannel || 'None'}`, inline: true },
						{ name: 'Verified', value: `${guild.verified || 'No'}`, inline: true },
						{ name: 'Large Server', value: `${guild.large || 'No'}`, inline: true },
						{ name: 'Text Channels', value: `${guild.channels.cache.filter((channel: Channel) => channel.type === ChannelType.GuildText).size}`, inline: true },
						{ name: 'Voice Channels', value: `${guild.channels.cache.filter((channel: Channel) => channel.type === ChannelType.GuildVoice).size}`, inline: true },
						{ name: 'Categories', value: `${guild.channels.cache.filter((channel: Channel) => channel.type === ChannelType.GuildCategory).size}`, inline: true },
						{ name: '\u200b', value: '\u200b' },
						{ name: 'Members', value: `${guild.memberCount.toLocaleString()}`, inline: true },
						{ name: 'Online', value: `${guild.approximatePresenceCount}`, inline: true },
						{ name: 'Offline', value: `${guild.approximateMemberCount! - guild.approximatePresenceCount!}`.toLocaleLowerCase(), inline: true },
						{ name: 'Bots', value: `${guild.members.cache.filter((member: GuildMember) => member.user.bot === true).size}`, inline: true },
						{ name: 'Max Members', value: `${guild.maximumMembers?.toLocaleString()}`, inline: true },
						{ name: 'AFK Timeout', value: `${moment.duration(300, 'seconds').asMinutes()} Minutes`, inline: true },
						{ name: '\u200b', value: '\u200b' },
						{
							name: `Role List (${guild.roles.cache.filter((role: Role) => role.managed !== true).size - 1})`,
							value: guild.roles.cache
								.filter((role: Role) => role.managed !== true)
								.sort((role1: Role, role2: Role) => role2.position - role1.position)
								.map((role) => role.toString())
								.join(', ')
								.replace(', @everyone', ' '),
						},
					])
					.setColor(EMBED_COLOURS.blurple)
					.setFooter({ text: `Server ID: ${guild.id} | Server Created • ${moment.utc(guild.createdAt).format('MMM Do YYYY')}` }),
			],
		});
	},
};

export = command;
