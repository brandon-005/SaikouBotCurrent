import { Command, ApplicationCommandOptionType } from 'discord.js';
import { RULE_CHOICES } from '../../utils/constants';
import { getMember } from '../../utils/functions';

const command: Command = {
	config: {
		commandName: 'rule',
		commandAliases: ['serverRule'],
		commandDescription: 'Recites a rule within the server.',
		userPermissions: 'ManageMessages',
		commandUsage: '<ruleNumber> [user]',
		limitedChannel: 'None',
		slashCommand: true,
		slashOptions: [
			{
				name: 'rule-number',
				description: 'The rule number to be recited by the bot.',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: RULE_CHOICES,
			},
			{
				name: 'user',
				description: 'The user the rule is directed towards.',
				type: ApplicationCommandOptionType.User,
				required: false,
			},
		],
	},
	run: async ({ bot, message, args, interaction }) => {
		let member: any;
		if (!message) {
			member = interaction.options.getMember('user');
			if (!member) member = null;
		} else {
			member = getMember(message, String(args[1]), true) || bot.users.cache.get(`${args[1]}`);
			if (!member) member = null;
		}

		if (message) {
			message.delete();

			switch (args[0]) {
				case '1.1':
					return message.channel!.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.1\` - This is an English only server. Refrain from speaking other languages.` });
				case '1.2':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.2\` - Keep things civil and refrain from disrespecting, harassing, and arguing with other users.` });
				case '1.3':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.3\` - Swearing, bypassing the bot filter in any way, and all NSFW content is strictly forbidden.` });
				case '1.4':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.4\` - All forms of racist, discriminatory, and offensive discussions/jokes are forbidden.` });
				case '1.5':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.5\` - Controversial topics, such as religion, politics and suicide are not allowed.` });
				case '1.6':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.6\` - Spam of all kinds (emojis, pings, and chats), chat flooding, and text walls are not allowed.` });
				case '1.7':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.7\` - Stick to the channel guidelines (see <#397797150840324115>). Repeatedly ignoring them will result in a punishment.` });
				case '1.8':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.8\` - All forms of advertising, selling, scamming are forbidden.` });
				case '1.9':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.9\` - Malicious links, downloadables or phishing attempts of any form will be met with an immediate permanent non-negotiable ban.` });
				case '1.10':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.10\` - Do not discuss exploits. If you are caught exploiting, you will be permanently banned.` });
				case '1.11':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.11\` - Do not beg anyone for anything including robux and gamepasses.` });
				case '1.12':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.12\` - Do not ping developers for any reason.` });
				case '1.13':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.13\` - Do not ping the staff team for baseless reasons, as well as members. Ghost pings are also forbidden.` });
				case '1.14':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.14\` - Do not take the role of a moderator into your own hands (e.g. telling users what to do, or doing things a staff member should do).` });
				case '1.15':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.15\` - Leaking any personal information about other members or staff is forbidden.` });
				case '1.16':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`1.16\` - Do not argue with staff. Staff members have final say in moderation actions.` });
				case '2.1':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`2.1\` - ALL chat rules apply to voice chats and playing music.` });
				case '2.2':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`2.2\` - Do not abuse your mic by using voice changers, screaming or playing loud music that can damage people’s hearing.` });
				case '3.1':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`3.1\` - Inappropriate names, game displays and profile pictures will be asked to be removed and changed. Failure to change them will result in removal of the server.` });
				case '3.2':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`3.2\` - Server raiding of any form will result in the entire raiding party's permanent ban without any warning, this is non-appealable.` });
				case '3.3':
					return message.channel.send({ content: `${member ? `<@${member.id}>,` : ''} \`3.3\` - Anything not mentioned will be dealt with on a case-by-case basis. Staff members will have final say in all cases.` });
				default:
					return message.channel.send({ content: "That rule doesn't appear to exist." });
			}
		}

		return interaction.followUp({ content: `${member ? `<@${member.id}>,` : ''} ${args[0]}` });
	},
};

export = command;
