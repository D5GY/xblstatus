import { Snowflake } from 'discord.js';

export const config: {
	DEV_MODE: boolean;
	DEV_TOKEN: Snowflake;
	DEV_IDs: Snowflake[];
	MAIN_GUILD: Snowflake;
	PRODUCTION_TOKEN: Snowflake;
	MAIN_GUILD_INVITE_URL: string;
	BOT_INVITE_URL: string;
	WS: {
		URL: string;
		AUTH_KEY: string;
	};
	DATABASE: {
		HOST: string;
		DEV_HOST: string;
		USER: string;
		PASSWORD: string;
		DATABASE: string;
	};
	WEBHOOKS: {
		GUILD_JOIN: string;
		GUILD_LEAVE: string;
		SOCKET: string;
		ERROR: string;
		INTERACTION_USAGE: string;
	};
	CIPHER_KEY: string;
	DISCORD_WEBHOOK_REGEX: RegExp;
};

