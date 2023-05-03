import { Client, Collection, WebhookClient } from 'discord.js';
import { clientConfig } from './clientOptions';
import { WSArrayData } from '../Utils/types';
import { Config } from '../Utils/config';
import { Colors } from '../Utils/enums';
import { Util } from '../Utils';
import { Database } from '../Utils/database';

export default class xbls extends Client {
	public static config = Config;
	public static Colors = Colors;
	public static commands = new Collection<string, unknown>();
	public static buttons = new Collection<string, unknown>();
	public static utils = Util;
	public static socketRetryInterval: null | NodeJS.Timeout = null;
	public static lastSocketUpdate: number = NaN;
	public static statusSocketErrored: boolean = false;
	public static currentStatus: Array<WSArrayData> = [];
	public static oldStatus: Array<WSArrayData> = [];
	public static database: Database = new Database();
	public static error = new WebhookClient({ url: this.config.WEBHOOKS.ERROR });
	constructor() {
		super(clientConfig);
	}
	start(): void {
		super.login(xbls.config.DEV_MODE ? xbls.config.DEV_TOKEN : xbls.config.PRODUCTION_TOKEN);
	}
}