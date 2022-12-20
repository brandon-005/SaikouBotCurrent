import { Client, GatewayIntentBits, Partials, Collection, ActivityType, EmbedBuilder, TextChannel, VoiceChannel, RoleData } from 'discord.js';
import { config } from 'dotenv';
import axios from 'axios';
import cron from 'node-cron';
import { writeFileSync } from 'fs';
import moment from 'moment';
import removeFiles from 'find-remove';
import { join } from 'path';

import statusTimer from './models/statusTimer';
import weeklyTrivia from './models/weeklyTrivia';
import { StatusTimerTypes } from './TS/interfaces';
import { BIRTHDAY_GIFS, BIRTHDAY_MESSAGES, EMBED_COLOURS } from './utils/constants';
import { devErrorEmbed, moderationDmEmbed } from './utils/embeds';
import { choose } from './utils/functions';

import questionNumber from './models/count';
import qotdQuestion from './models/qotd';
import wyrQuestion from './models/wyrQuestion';
import birthdays from './staffBirthdays.json';

config();

const bot: Client = new Client({
	intents: [
		// prettier-ignore
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Reaction, Partials.Message, Partials.Channel],
	allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
	presence: { activities: [{ name: '🤖 Starting up...' }] },
});

bot.slashCommands = new Collection();
bot.cooldowns = new Collection();

['load-commands', 'load-events'].forEach((handlerFile: string): string => require(`./handlers/${handlerFile}.js`)(bot));

process.on('uncaughtException', (exceptionError: Error) => {
	console.error(exceptionError);
	devErrorEmbed(bot, exceptionError.name, exceptionError.message);
});

process.on('unhandledRejection', (rejectionError: Error) => {
	console.error(rejectionError);
	devErrorEmbed(bot, rejectionError.name, rejectionError.message);
});

// -- Expiring Status
const SIXTY_SECONDS = 60000;

setInterval(async () => {
	const statusTimerData = await statusTimer.find({}, '-_id -__v');

	statusTimerData.forEach(async (user: StatusTimerTypes) => {
		if (new Date(user.timestamp).getTime() + user.duration < Date.now()) {
			const server = bot.guilds.cache.get(`${BigInt(String(process.env.SERVER_ID))}`);
			const serverMember = (await server!.members.fetch()).get(`${BigInt(user.userID)}`);

			if (!serverMember || !serverMember.presence) return;

			for (const status of serverMember.presence!.activities) {
				if (status.type === ActivityType.Custom && status.state!.toLowerCase() === user.status.toLowerCase()) {
					await moderationDmEmbed(serverMember, 'Kick', `Hello **${serverMember.user.username}**,\n\nWe noticed your account has recently broke Saikou's Community Rules again. Because of this, your account has received a kick from our Discord Server.\n\nIf you continue to break the rules, your account will be permanently banned from accessing the Discord Server. To learn more about our rules, visit <#397797150840324115>\n\nWe build our games and community for players to have fun. Creating a safe environment and enjoyable experience for everyone is a crucial part of what we're about, and our community rules in place is what we ask and expect players to abide by to achieve this.\n\nPlease check the attached moderator note below for more details.`, `Rule 3.1 - Inappropriate names, game displays and profile pictures will be asked to be removed and changed. Failure to change them will result in removal of the server. [AUTOMATIC]`);
					serverMember.kick();

					(bot.channels.cache.find((channel: any) => channel.name === '📂moderation') as TextChannel).send({
						embeds: [
							new EmbedBuilder() // prettier-ignore
								.addFields([
									// prettier-ignore
									{ name: 'Moderator', value: 'SaikouBot', inline: true },
									{ name: 'User', value: `<@${serverMember.user.id}>`, inline: true },
									{ name: 'Reason', value: "Triggered Saikou's auto moderation for having an inappropriate status. [AUTOMATIC KICK]", inline: false },
								])

								.setAuthor({ name: 'Saikou Discord | Kick', iconURL: bot.user.displayAvatarURL() })
								.setThumbnail(bot.user.displayAvatarURL())
								.setColor(EMBED_COLOURS.green)
								.setFooter({ text: 'Kick' })
								.setTimestamp(),
						],
					});
					return (bot.channels.cache.find((channel: any) => channel.name === '📂moderation') as TextChannel).send({ content: `Warned automatically on **<t:${Math.floor(new Date(user.timestamp).getTime() / 1000)}:F>**, hasn't changed status within 12 hours.\n\n__**STATUS CONTENT**__\n${user.status}` });
				}
			}

			await statusTimer.deleteOne({ userID: user.userID });
		}
	});
}, SIXTY_SECONDS);

// -- Updating server stats
const FIVE_MINUTES = 1000 * 300;

setInterval(async () => {
	const [playingNowChannel, groupCountChannel, favouriteChannel] = [bot.channels.cache.get(`${process.env.PLAYINGNOW_ID}`), bot.channels.cache.get(`${process.env.GROUPCOUNT_ID}`), bot.channels.cache.get(`${process.env.FAVOURITECOUNT_ID}`)];
	const PLACE_ID: Array<number> = [62124643, 6826258982];
	const UNIVERSE_ID: Array<number> = [];

	// prettier-ignore
	let [playingNowCount, favouriteCount] = [0, 0];

	/* Fetching Universe ID from Place ID's provided */
	for (const id of PLACE_ID) {
		await axios
			.get(`https://apis.roblox.com/universes/v1/places/${id}/universe`)
			.then((response: any) => UNIVERSE_ID.push(response.data.universeId))
			.catch(() => {});
	}

	/* Fetching Concurrent Player Data */
	await axios
		.get(`https://games.roblox.com/v1/games?universeIds=${UNIVERSE_ID.join(',')}`)
		.then(async (response: any) => {
			for (const game of response.data.data) {
				playingNowCount += game.playing;
				favouriteCount += game.favoritedCount;
			}
		})
		.catch(() => {});

	/* Checking if data is the same as the last time it updated, if not, change name */
	if ((playingNowChannel as TextChannel)!.name !== `Playing Now: ${playingNowCount.toLocaleString()}`) {
		await (playingNowChannel as VoiceChannel).setName(`Playing Now: ${playingNowCount.toLocaleString()}`);
	}

	/* Checking if data is the same as the last time it updated, if not, change name */
	if ((favouriteChannel as TextChannel)!.name !== `Favourites: ${favouriteCount.toLocaleString()}`) {
		await (favouriteChannel as VoiceChannel).setName(`Favourites: ${favouriteCount.toLocaleString()}`);
	}

	axios
		.get('https://groups.roblox.com/v1/groups/3149674')
		.then(async (res: any) => {
			const groupCountData = res.data.memberCount.toLocaleString();

			if ((groupCountChannel as TextChannel)!.name !== `Group Count: ${groupCountData.toLocaleString()}`) {
				await (groupCountChannel as VoiceChannel).setName(`Group Count: ${res.data.memberCount.toLocaleString()}`);
			}
		})
		.catch(() => {});
}, FIVE_MINUTES);

/* Automatic QOTD */
cron.schedule('0 13 * * *', async () => {
	const counter = await questionNumber.findOne({ id: 1 });
	const qotdChannel = bot.channels.cache.find((channel: any) => (channel as TextChannel).name === '❔question-of-the-day');

	if (!counter) {
		questionNumber.create({
			id: 1,
			count: 0,
		});

		(qotdChannel as TextChannel).send({ content: '<@&692394198451748874>\n**Question of the day: What is one app that you hate but still use anyways?**\nSubmit your answer in <#398237638492160000> and keep up to date with our next question tomorrow!' });
	} else {
		counter.count += 1;
		counter.save();

		const currentQOTD = await qotdQuestion.find({});

		(qotdChannel as TextChannel).send({ content: `<@&692394198451748874>\n${currentQOTD[counter.count].question}\nSubmit your answer in <#398237638492160000> and keep up to date with our next question tomorrow!'` });
	}
});

/* Automatic Would You Rather */
cron.schedule('0 0 * * *', async () => {
	const counter = await questionNumber.findOne({ id: 2 });
	const wyrChannel = bot.channels.cache.find((channel: any) => (channel as TextChannel).name === '🤔would-you-rather');

	if (!counter) {
		questionNumber.create({
			id: 2,
			count: 0,
		});

		(wyrChannel as TextChannel).send({ content: '<@&692394198451748874>\n**Would You Rather**\nA: Eat a sandwich made with moldy bread\nB: Eat a sandwich made with stale bread' }).then(async (msg) => {
			await msg.react('🅰️');
			await msg.react('🅱️');
		});
	} else {
		counter.count += 1;
		counter.save();

		const currentQuestion = await wyrQuestion.find({});

		(wyrChannel as TextChannel).send({ content: `<@&692394198451748874>\n**Would You Rather**\n${currentQuestion[counter.count].optionA}\n${currentQuestion[counter.count].optionB}` }).then(async (msg) => {
			await msg.react('🅰️');
			await msg.react('🅱️');
		});
	}
});

/* Birthday Messages */
cron.schedule('0 0 * * *', async () => {
	birthdays.forEach((birthday) => {
		const [day, month, year] = birthday.birthdate.split('/');
		const todaysDate = new Date();
		const staffBirthDate = new Date(+year, Number(month) - 1, +day);

		if (staffBirthDate.getDate() === todaysDate.getDate() && staffBirthDate.getMonth() === todaysDate.getMonth()) {
			(bot.channels.cache.find((channel: any) => channel.name === '💬general-staff') as TextChannel).send({ content: `<@${birthday.id}>, ${choose(BIRTHDAY_MESSAGES)}` }).then(() => {
				(bot.channels.cache.find((channel: any) => channel.name === '💬general-staff') as TextChannel).send({ content: `${choose(BIRTHDAY_GIFS)}` });
			});
		}
	});
});

cron.schedule('0 0 * * *', async () => {
	removeFiles('../dataBackups', {
		age: { seconds: 604800 },
		extensions: '.json',
	});

	bot.guilds.fetch(process.env.SERVER_ID).then((guild) => {
		const roles: any = [];
		guild.roles.cache
			.filter((role) => !role.managed)
			.sort((a, b) => b.position - a.position)
			.forEach((role) => {
				const roleData = {
					name: role.name,
					color: role.hexColor,
					hoist: role.hoist,
					permissions: role.permissions.bitfield.toString(),
					mentionable: role.mentionable,
					position: role.position,
					isEveryone: guild.id === role.id,
				};
				roles.push(roleData);
			});

		const finalJson = {
			roles,
			guildData: guild,
		};

		writeFileSync(`${join(__dirname, '../dataBackups/')}${moment(new Date()).format('DD-MM-YYYY[@]h-mma')}.json`, JSON.stringify(finalJson, null, 2));
	});
});

/* Weekly trivia deletion */
cron.schedule('0 0 * * MON', async () => {
	await weeklyTrivia.deleteMany({});
});

bot.login(process.env.TEST === 'true' ? process.env.DISCORD_TESTTOKEN : process.env.DISCORD_TOKEN);
