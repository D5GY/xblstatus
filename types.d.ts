import { InteractionType, Snowflake } from 'discord.js'
export interface ConfigTypes {
  DEV_MODE: Boolean;
  DEV_TOKEN: Snowflake;
  PRODUCTION_TOKEN: Snowflake;
  socketURL: string;
  JOIN_WEBHOOK: string;
  LEAVE_WEBHOOK: string;
  SOCKET_WEBHOOK: string;
  ERROR_WEBHOOK: string;
  DATABASE: {
    host: string;
    user: string;
    password: string;
    port: number;
    database: string;
  },
  cipher_key: string;
  auth_key: string;
}
export interface WebSocketArrayData {
  name: string;
  description: string;
  color: string;
}
export interface messageStatusData {
  message_type: string;
  services: any;
}
export interface SQLsettingsData {
  guildID: Snowflake;
  webhookURL: string;
}