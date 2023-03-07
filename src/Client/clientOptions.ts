import { ClientOptions, GatewayIntentBits, Partials, ActivityType } from 'discord.js';

export const clientConfig: ClientOptions = {
	intents: [
		GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent
	],
	partials: [
		Partials.Channel, Partials.GuildMember,
		Partials.Message, Partials.User
	],
	presence: {
		activities: [
			{ name: '/xblstatus | https://xblstatus.com/', type: ActivityType.Watching },
		]
	}
};