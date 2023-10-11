import { Snowflake } from 'discord.js';

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