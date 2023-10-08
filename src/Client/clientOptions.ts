import { ClientOptions, GatewayIntentBits, Partials, ActivityType } from 'discord.js';

export const clientConfig: ClientOptions = {
	intents: [
		GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.Guilds
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