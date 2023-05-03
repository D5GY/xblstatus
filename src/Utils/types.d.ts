import { Snowflake } from 'discord.js';
export interface ConfigTypes {
	DEV_MODE: boolean;
	DEV_TOKEN: Snowflake;
	PRODUCTION_TOKEN: Snowflake;
	WS: {
		URL: string;
		AUTH_KEY: string;
	};
	DATABASE: {
		HOST: string;
		USER: string;
		PASSWORD: string;
		PORT: number;
		DATABASE: string;
	};
	WEBHOOKS: {
		GUILD_JOIN: string;
		GUILD_LEAVE: string;
		SOCKET: string;
		ERROR: string;
	};
	CIPHER_KEY: string;
	DISCORD_WEBHOOK_REGEX: RegExp;
}
export interface WSArrayData {
	name: string;
	description: string;
	color: string;
}
export interface SQLsettingsData {
  guildID: Snowflake;
  webhookURL: string;
  emoji: string;
}
export interface WebSocketArrayData {
  name: string;
  description: string;
  color: string;
}