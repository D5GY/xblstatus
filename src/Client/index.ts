import { Client, Collection } from 'discord.js';
import { clientConfig } from './clientOptions';
import { ConfigTypes, WSArrayData } from '../Utils/types';
import { Config } from '../Utils/config';
import { Colors } from '../Utils/enums';
import { Util } from '../Utils';
import { Database } from '../Utils/database';

export class xbls extends Client {
	config: ConfigTypes;
	Colors: typeof Colors;
	commands = new Collection<string, unknown>();
	utils: typeof Util;
	socketRetryInterval: null | NodeJS.Timeout;
	lastSocketUpdate: number;
	statusSocketErrored: boolean;
	currentStatus: Array<WSArrayData>;
	oldStatus: Array<WSArrayData>;
	database: typeof Database;

	constructor() {
		super(clientConfig);
	
		this.config = Config;
		this.Colors = Colors;
		this.commands;
		this.utils = Util;
		this.socketRetryInterval = null;
		this.lastSocketUpdate = NaN;
		this.statusSocketErrored = false;
		this.currentStatus = [];
		this.oldStatus = [];
		this.database = Database;

	}
	start(): void {
		super.login(this.config.DEV_MODE ? this.config.DEV_TOKEN : this.config.PRODUCTION_TOKEN);
	}
}