import { Client, GatewayIntentBits, Partials, Collection, ActivityType, EmbedBuilder, TextChannel, VoiceChannel } from 'discord.js';
import { config } from 'dotenv';
import axios from 'axios';
import cron from 'node-cron';

import { StatusTimerTypes } from './TS/interfaces';
import { BIRTHDAY_GIFS, BIRTHDAY_MESSAGES, EMBED_COLOURS } from './utils/constants';
import { devErrorEmbed, moderationDmEmbed } from './utils/embeds';
import { choose, sendQuestion, awardRole } from './utils/functions';

import WeeklyTrivia from './models/weeklyTrivia';
import StatusTimer from './models/statusTimer';
import birthdays from './staffBirthdays.json';
import correctTrivia from './models/correctTrivia';

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
		GatewayIntentBits.AutoModerationExecution,
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
	const statusTimerData = await StatusTimer.find({}, '-_id -__v');

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

			await StatusTimer.deleteOne({ userID: user.userID });
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

/* Automatic Trivia King / Weekly Champion Role Giving */
setInterval(async () => {
	await awardRole(bot, true);
	await awardRole(bot, false);
}, SIXTY_SECONDS);

/* Automatic QOTD */
cron.schedule('0 13 * * *', async () => {
	await sendQuestion(bot);
});

/* Automatic Would You Rather */
cron.schedule('0 0 * * *', async () => {
	await sendQuestion(bot, true);
});

/* Weekly trivia deletion */
cron.schedule('0 0 * * MON', async () => {
	await WeeklyTrivia.deleteMany({});
});

bot.login(process.env.TEST === 'true' ? process.env.DISCORD_TESTTOKEN : process.env.DISCORD_TOKEN);
