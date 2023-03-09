export const EMBED_COLOURS = {
	red: 0xed4245,
	green: 0x57f287,
	blurple: 0x5865f2,
	yellow: 0xfee75c,
	darkgrey: 0x2c2f33,
};

export const DISCORD_PERMISSIONS: string[] = [
	'ADMINISTRATOR', // prettier-ignore
	'CREATE_INSTANT_INVITE',
	'KICK_MEMBERS',
	'BAN_MEMBERS',
	'MANAGE_CHANNELS',
	'MANAGE_GUILD',
	'ADD_REACTIONS',
	'VIEW_AUDIT_LOG',
	'PRIORITY_SPEAKER',
	'STREAM',
	'VIEW_CHANNEL',
	'SEND_MESSAGES',
	'SEND_TTS_MESSAGES',
	'MANAGE_MESSAGES',
	'EMBED_LINKS',
	'ATTACH_FILES',
	'READ_MESSAGE_HISTORY',
	'MENTION_EVERYONE',
	'USE_EXTERNAL_EMOJIS',
	'VIEW_GUILD_INSIGHTS:',
	'CONNECT',
	'SPEAK',
	'MUTE_MEMBERS',
	'DEAFEN_MEMBERS',
	'MOVE_MEMBERS',
	'CHANGE_NICKNAME',
	'MANAGE_NICKNAMES',
	'MANAGE_ROLES',
	'MANAGE_WEBHOOKS',
	'MANAGE_EMOJIS',
];

export const EIGHTBALL_REPLIES: string[] = [
	'It is certain', // prettier-ignore
	'It is decidedly so',
	'Without a doubt',
	'Yes - definitely',
	'You may rely on it',
	'As I see it, yes',
	'Most likely',
	'Outlook good',
	'Yes',
	'Signs point to yes',
	'Reply hazy, try again',
	'Ask again later',
	'Better to not tell you now',
	'Cannot predict now',
	"Don't count on it",
	'My reply is no',
	'My sources say no',
	'Outlook not so good',
	'Very doubtful',
	'Certainly not',
	'100% Yes',
	"I don't know",
	"I've no idea, why are you asking me?",
	'Of course',
	'You tell me',
];

export const GAME_FACTS: string[] = [
	/* MWT FACTS */
	"Military Warfare Tycoon's game page says the game was `created` in 2011, but this is incorrect. The game was first launched on the 1st of July 2017.", // prettier-ignore
	'The `Halloween event` in Military Warfare Tycoon took place ever year, except 2020. There was not enough time to release it, so the developers decided to cancel the event. However two months later, they released one of the biggest events to date - the Christmas 2020 event - combined with a dark look and feel to still get some spooky Halloween vibes.',
	'The `Staff of Sparks` in Military Warfare Tycoon was added as a replacement for the `Real Golden Pistol`, which deals 999 explosive damage and has unlimited ammo capacity. Only official Saikou staff members are able to spawn it in game.',
	'The `Military Axe` was the first ever seasonal event item to be introduced to Military Warfare Tycoon.',
	'The `VIP gamepass` used to be free to obtain during the Military Warfare Tycoon alpha release back in 2017. Less than 100 people signed up to grab it for free.',
	'There used to be an `easter egg` in Military Warfare Tycoon that allowed you to spawn a secret AC-130 gunship on top of a mountain. The button to spawn it was hidden in one of the trees.',
	'Players used to have no `kill saving` in Military Warfare Tycoon, meaning to get General they would have to do it all in one server! Ouch.',
	'Official Saikou Staff members used to have an `overhead rank tag` in Military Warfare Tycoon, however it was removed due to it being too revealing to cheaters.',
	'The `Artillery Cannon` in Military Warfare Tycoon used to be placed next to the VIP vehicles, it was however later moved to a better position as the tycoon blocked it.',
	'The `Railgun` in Military Warfare Tycoon used to have a charge time before firing, this typically meant players had to prepare their shot.',

	/* KILLSTREAK FACTS */
	'The Pre-Alpha for Killstreak was developed within less than `two weeks` as a surprise for hitting 100k group members.',
	'Killstreak features the `jeep rework` that was initially planned for Military Warfare Tycoon.',
	"Killstreak was primarily created for use in `gamenights`, with it's big server size it could cater for lots of people.",
	'The `Staff Of Sparks` used to be an obtainable loadout in Killstreak upon release, but 2 days later it got removed after it caused issues in the game.',
];

export const LETTER_EMOJIS: string[] = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🚪'];

export const PROMPT_TIMEOUT: number = 300000;

export const MESSAGE_TIMEOUT: number = 10000;

export const VIDEO_FILE_TYPES: string[] = ['.mov', '.mp4', '.wmv'];

export const WELCOME_MESSAGES: string[] = [
	// prettier-ignore
	'please be sure to read our <#397797150840324115> carefully before chatting. Enjoy your stay with us!',
	'has just joined the server, great to see you!',
	'we hope you have a great time here.',
	'thanks for stopping by, we hope you enjoy your stay with us!',
	'welcome to Saikou! Make sure to check out our <#692066565327421442> channel for some additional information.',
	'thanks for joining us on our journey! Looking to report an exploiter? You can use our <#675459553122451456> channel.',
	'welcome to our server! Looking to get started here? Check out <#397797150840324115> and <#692066565327421442>!',
	"welcome to the Saikou community! We hope you'll enjoy your stay with us.",
	"welcome to Saikou! We're thrilled to have you here!",
	"welcome to Saikou! We're glad to have you here, and can't wait to get to know you!",
	'thanks for stopping by the Saikou community! We hope you have a great time here, and make some new friends!',
	"we're delighted to welcome you to Saikou! We hope you feel at home here, and that you make some great connections with our community members!",
	"welcome to our server! We're glad you're here, and we hope you have an amazing time getting to know our community!",
	'has just joined the server, we hope you find this server to be a welcoming and fun place to hang out!',
	'thanks for joining Saikou! We hope you feel the warmth and positivity of our community, and enjoy your time with us!',
	"we're delighted to welcome you to Saikou! We hope you'll enjoy being a part of our community and making new memories with us.",
	"welcome to Saikou! We hope you'll find this server to be a safe and welcoming space, and we can't wait to see all the great things you'll do here.",
	"welcome to the Saikou Discord! We're always on the lookout for fresh perspectives and new ideas and can't wait to see what you bring to our community!",
];

export const WHITELISTED_WORDS: string[] = [
	// prettier-ignore
	'sucks',
	'suck',
	'damn',
	'dam',
	'hell',
	'crap',
	'darn',
	'curse',
];

export const RULE_CHOICES: any = [
	{
		name: '1.1 - This is an English only server. Refrain from speaking other languages.',
		value: '`1.1` - This is an English only server. Refrain from speaking other languages.',
	},
	{
		name: '1.2 - Keep things civil and refrain from disrespecting, harassing, and arguing with other users.',
		value: '`1.2` - Keep things civil and refrain from disrespecting, harassing, and arguing with other users.',
	},
	{
		name: '1.3 - Swearing, bypassing the bot filter in any way, and all NSFW content is strictly forbidden.',
		value: '`1.3` - Swearing, bypassing the bot filter in any way, and all NSFW content is strictly forbidden.',
	},
	{
		name: '1.4 - All forms of racist, discriminatory, and offensive discussions/jokes are forbidden.',
		value: '`1.4` - All forms of racist, discriminatory, and offensive discussions/jokes are forbidden.',
	},
	{
		name: '1.5 - Controversial topics, such as religion, politics and suicide are not allowed.',
		value: '`1.5` - Controversial topics, such as religion, politics and suicide are not allowed.',
	},
	{
		name: '1.6 - Spam of all kinds, chat flooding, and text walls are not allowed.',
		value: '`1.6` - Spam of all kinds, chat flooding, and text walls are not allowed.',
	},
	{
		name: '1.7 - Stick to the channel guidelines (see #🧭info). Ignoring them will result in a punishment.',
		value: '`1.7` - Stick to the channel guidelines (see #🧭info). Ignoring them will result in a punishment.',
	},
	{
		name: '1.8 - All forms of advertising, selling, scamming are forbidden.',
		value: '`1.8` - All forms of advertising, selling, scamming are forbidden.',
	},
	{
		name: '1.9 - Malicious links, downloadables or phishing attempts will be met with a non-negotiable ban',
		value: '`1.9` - Malicious links, downloadables or phishing attempts will be met with a non-negotiable ban.',
	},
	{
		name: '1.10 - Do not discuss exploits. If you are caught exploiting, you will be permanently banned.',
		value: '`1.10` - Do not discuss exploits. If you are caught exploiting, you will be permanently banned.',
	},
	{
		name: '1.11 - Do not beg anyone for anything including robux and gamepasses.',
		value: '`1.11` - Do not beg anyone for anything including robux and gamepasses.',
	},
	{
		name: '1.12 - Do not ping developers for any reason.',
		value: '`1.12` - Do not ping developers for any reason.',
	},
	{
		name: '1.13 - Do not ping staff/members for baseless reasons. Ghost pings are also forbidden.',
		value: '`1.13` - Do not ping staff/members for baseless reasons. Ghost pings are also forbidden.',
	},
	{
		name: '1.14 - Do not take the role of a moderator into your own hands.',
		value: '`1.14` - Do not take the role of a moderator into your own hands.',
	},
	{
		name: '1.15 - Leaking any personal information about other members or staff is forbidden.',
		value: '`1.15` - Leaking any personal information about other members or staff is forbidden.',
	},
	{
		name: '1.16 - Do not argue with staff. Staff members have final say in moderation actions.',
		value: '`1.16` - Do not argue with staff. Staff members have final say in moderation actions.',
	},
	{
		name: '2.1 - ALL chat rules apply to voice chats and playing music.',
		value: '`2.1` - ALL chat rules apply to voice chats and playing music.',
	},
	{
		name: "2.2 - Don't abuse your mic e.g using voice changers or playing loud music that can damage hearing.",
		value: "`2.2` - Don't abuse your mic e.g using voice changers or playing loud music that can damage hearing.",
	},
	{
		name: '3.1 - Inappropriate names, displays and profile avatars will be asked to be removed and changed.',
		value: '`3.1` - Inappropriate names, displays and profile avatars will be asked to be removed and changed.',
	},
	{
		name: '3.2 - Raiding of any form will result in the raiding partys permanent ban, this is non-appealable.',
		value: '`3.2` - Raiding of any form will result in the raiding partys permanent ban, this is non-appealable.',
	},
	{
		name: '3.3 - Anything un-mentioned will be dealt with on a case basis. Staff members will have final say.',
		value: '`3.3` - Anything un-mentioned will be dealt with on a case basis. Staff members will have final say.',
	},
];

export const MWT_WEAPONS = [
	// prettier-ignore
	'Handgun',
	'Luger Pistol',
	'Revolver',
	'SMG',
	'Sten Gun',
	'Mauser C96',
	'Tommy Gun',
	'Barrel Shotgun',
	'Assault Rifle',
	'Sawed-Off Shotgun',
	'M1 Garand Rifle',
	'Marksman Rifle',
	'Dual SMGs',
	'LMG',
	'AK-47',
	'Crossbow',
	'Dual Revolvers',
	'Golden Pistol',
	'Grenade Launcher',
	'Minigun',
	'Railgun',
	'Rocket Launcher',
	'Sniper Rifle',
	'Auto Sniper',
	'Auto Shotgun',
	'Scoped Rifle',
	'Burst Rifle',
	'Silenced Machine Pistol',
	'Compact SMG',
	'Golden Railgun',
	'Laser Pistol',
	'Snow Flintlock',
	'Knife',
	'Grenade',
	'Katana',
	'Candy Cane Sword',
	'Military Axe',
	'Throwing Knife',
	'Golden Katana',
	'Bone Cage',
	'Flashbang',
	'Remote Mine',
	'Tactical Airstrike',
	'Festive Launcher',
	'Golden Sniper',
	'Golden AK-47',
];

export const MWT_MISSIONS = [
	// prettier-ignore
	"Get **7** kills in one play session with the `Default Knife`.",
	'Raid **3** players bases by using the `back enterance`.',
	'Get **10** kills in one play session with the `Dual SMGs`.',
	'Get **20** kills in one play session with the `Light Machine Gun`.',
	'**Complete** your base in 30 minutes of `one play session`.',
	'Get **5** kills whilst playing on `max sensitivity`.',
	'Get **15** kills in one play session whilst playing in `First person`.',
	'Become **allies** with `another person` in your server.',
	'Destroy **5** vehicles in one play session with the `Remote Mine`.',
	'Get **5** headshots with the `Sniper Rifle`.',
	'Kill **10** players with the `Helicopter`.',
	'Have a **1v1** battle with another player in `tanks`.',
	'Storm into **3** players bases using the `Helicopter`.',
	'Gain **5** kills whilst playing on the `lowest sensitivity`.',
	'Kill **3** enemy players in `vehicles`.',
	'Find the **only** hidden secret found within the `map`.',
	'Gain **10** kills using only the `Rocket Launcher`.',
	'Find and destroy **5** enemies using the `Revolver`.',
	'Find and kill **2** enemy players who own a `Gamepass`',
	'Gain **15** kills using the `RPG` on a mobile device.',
];

export const PUNISHMENT_OPTIONS = [
	{
		label: 'Rudeness',
		value: '❌ **Rudeness**',
	},
	{
		label: 'Policy Violation',
		value: '❌ **Policy Violation**',
	},
	{
		label: 'Failure to meet performance standards',
		value: '❌ **Failure to meet performance standards**',
	},
	{
		label: 'Insubordination',
		value: '❌ **Insubordination**',
	},
	{
		label: 'Other',
		value: '❌ **Other**',
	},
];

export const BIRTHDAY_MESSAGES = [
	// prettier-ignore
	'As you get older three things happen. The first is your memory goes, and I can’t remember the other two. Happy birthday!',
	'We all knew this day was coming. It’s best to just suck it up and accept it’s no longer acceptable for you to eat a happy meal in public. Happy Birthday!',
	'I mean, you have ME so I don’t know what else you have to wish for…but go off I guess…Happy birthday!',
	"Happy Birthday! You're officially older than me, not that you weren't last year, but this year is different...",
	"I'd take all your exploiter reports for one day. That's really saying something, especially from me. Happy Birthday!",
	'Forget the past, forget the future and please forget the present too as I did forget to get you one. But happy birthday, I got you this cake GIF instead!',
	'I was going to give you something awesome for your birthday, but they wouldn’t let me courier myself to you. Oh well, Happy Birthday!',
	'You are just getting younger in reverse! Happy birthday!',
	'Happy birthday! May you live long enough to see Amazon delivering on the moon.',
	'Happy ‘two minutes of intense awkwardness when people sing around, and you have a hold on to that smile all that while!’',
];

export const BIRTHDAY_GIFS = [
	// prettier-ignore
	"https://tenor.com/view/birthday-wishes-happy-happybirthday-to-gif-23741247",
	'https://tenor.com/view/chocolate-cake-candles-happy-birthday-gif-15613021',
	'https://tenor.com/view/happy-birthday-special-to-someone-gif-21295542',
	'https://tenor.com/view/sweet-cute-happy-birthday-happy-birthday-gif-24108327',
];

export const QUESTION_ANSWERS = [
	{
		question: 'How do I join the staff team',
		answer: 'Wait for staff applications to open. Those that stand out in the community will be selected and offered staff positions when needed.',
	},
	{
		question: 'How do I get Dedicated Follower',
		answer: 'Earn xp and achieve a certain level, e.g. level 10 for Dedicated Follower. XP can be earned by chatting in any of the text channels or by participating in events. Check <#692066565327421442> for the full rewards table.',
	},
	{
		question: 'How do you get the ping role',
		answer: "You can press the buttons in <#692164713907486850> to receive or remove our ping role. This will allow you to be informed of any upcoming community events that aren't addressed to everyone.",
	},
	{
		question: 'How do I report',
		answer: 'You can report exploiters or rule breakers in <#675459553122451456>. Make sure to do </report:1016682656198570024> so the bot can DM you further instructions.',
	},
	{
		question: 'How do I get elite soldier',
		answer: 'To gain the Elite Soldier badge, players must embark on an adventure to find and kill the owner of Military Warfare Tycoon, granting them with the legendary Golden Katana!',
	},
	{
		question: 'How do I get the golden railgun',
		answer: 'To gain the Golden Railgun in Military Warfare Tycoon, you need to boost the Saikou Discord server. You will then receive a booster token, which can be used in conjunction with our </redeem:1016682656123080723> command to receive the Golden Railgun in-game.',
	},
	{
		question: 'I found a hacker',
		answer: 'To report an individual to the staff team, please use our <#675459553122451456> channel. From there a member of staff will review the report and take any necessary actions against the player.',
	},
];

export const LOWER_COOLDOWN_COMMANDS = [
	// prettier-ignore
	"trivia",
];
