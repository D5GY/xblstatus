import { Client, Collection, WebhookClient } from 'discord.js';
import { clientConfig } from './clientOptions';
import { WSArrayData } from '../Utils/types';
import { Colors } from '../Utils/enums';
import { Util } from '../Utils';
import { Database } from '../Utils/database';
import config from '../config';

export default class xbls extends Client {
	public static config = config;
	public static Colors = Colors;
	public static commands = new Collection<string, unknown>();
	public static buttons = new Collection<string, unknown>();
	public static utils = Util;
	public static socketRetryInterval: null | NodeJS.Timeout = null;
	public static lastSocketUpdate: number = NaN;
	public static statusSocketErrored: boolean = false;
	public static currentStatus: Array<WSArrayData> = [];
	public static oldStatus: Array<WSArrayData> = [];
	public static lastSentStatus: Array<WSArrayData> = [];
	public static database: Database = new Database();
	public static error = new WebhookClient({ url: this.config.WEBHOOKS.ERROR });

	public constructor() {
		super(clientConfig);
	}

	public start(): void {
		this.login(config.DEV_MODE ? config.DEV_TOKEN : config.PRODUCTION_TOKEN);
	}
}