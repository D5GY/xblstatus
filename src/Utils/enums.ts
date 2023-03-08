import { Snowflake } from 'discord-api-types/v10';

export enum Colors {
  BLUE = 0x3366cc,
  GREEN = 0x00cc00,
  YELLOW = 0xcccc00,
  RED = 0xcc0000
}
export enum defaultEmojis {
  GREEN = ':green_circle:',
	YELLOW = ':yellow_circle:',
	ORANGE = ':orange_circle:',
	RED = ':red_circle:',
	BLACK = ':black_circle:',
	WHITE = ':white_circle:'
}
export interface SQLsettingsData {
  guildID: Snowflake;
  webhookURL: string;
}
export interface WebSocketArrayData {
  name: string;
  description: string;
  color: string;
}