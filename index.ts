import { Client, Colors, Events, Interaction, InteractionType, SlashCommandBuilder, PermissionFlagsBits, ChannelType, ChatInputCommandInteraction, Guild, WebhookClient, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ClientConfig, Config } from './config';
import * as moment from 'moment';
import * as fetch from 'node-fetch';
import { createConnection } from 'mysql2';
import { AES, enc } from 'crypto-js';
const sql = createConnection({
	host: Config.DATABASE.host,
	user: Config.DATABASE.user,
	password: Config.DATABASE.password,
	database: Config.DATABASE.database,
	port: Config.DATABASE.port
});
const socketLogs = new WebhookClient({ url: Config.SOCKET_WEBHOOK });
const errorLogs = new WebhookClient({ url: Config.ERROR_WEBHOOK });
const client = new Client(ClientConfig);
client.login(Config.DEV_MODE ? Config.DEV_TOKEN : Config.PRODUCTION_TOKEN);

import * as WebSocket from 'ws';
import { messageStatusData, SQLsettingsData, WebSocketArrayData } from './types';
let socketRetryInterval: null | NodeJS.Timeout = null;
let lastSocketUpdate: number = NaN;
let statusErroed: boolean = false;
let oldStatus: Array<WebSocketArrayData> = [];
let currentStatus: Array<WebSocketArrayData> = [];
let statusWS: undefined | WebSocket = undefined;

const xblstatus = new SlashCommandBuilder()
	.setName('xblstatus')
	.setDescription('Get the status of LIVE for the Xbox 360.');
const settingsInteraction = new SlashCommandBuilder()
	.setName('settings')
	.setDescription('xblStatus server settings.')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setDMPermission(false)
	.addSubcommand(option =>
		option
			.setName('get')
			.setDescription('Display your guild settings.')
	)
	.addSubcommand(option =>
		option
			.setName('edit')
			.setDescription('Edit your guild settings.')
			.addStringOption(input =>
				input
					.setName('setting')
					.setDescription('Select the setting you want to edit.')
					.addChoices(
						{ name: 'xblStatus change webhook', value: 'webhook' },
						{ name: 'xblStatus change emoji type', value: 'emoji' }
					)
					.setRequired(true)
			)
			.addStringOption(input =>
				input
					.setName('value')
					.setDescription('Set the value of your selected setting.')
					.setRequired(true)
			)
	);


const clientCommands = [
	xblstatus.toJSON(),
	settingsInteraction.toJSON()
];

enum defaultEmojis {
	GREEN = ':green_circle:',
	YELLOW = ':yellow_circle:',
	ORANGE = ':orange_circle:',
	RED = ':red_circle:',
	BLACK = ':black_circle:',
	WHITE = ':white_circle:'
}

enum customEmojis {
	GREEN = '<:xbls_0c0:1054479964549959791>',
	GOLD = '<:xbls_c80:1054479962117263441>',
	YELLOW = '<:xbls_cc0:1054479963761410108>',
	ORANGE = '<:xbls_c50:1054479961362284554>',
	RED = '<:xbls_c00:1054479965728555009>',
	BLACK = '<:xbls_000:1054485544391950486>',
	GRAY = '<:xbls_ccc:1071244643313913906>'
}

client.on(Events.ClientReady, () => {
	Log(`${client.user!.tag} is online`);

	ConnectWS();
	connectSQL();

	client.application?.commands.set(clientCommands).catch((error) => {
		Log(`Application commands error: ${error}`);
	}).then(() => {
		Log('Application commands set');
	});
	setInterval(() => {
		sql.ping((error) => {
			if (error) {
				connectSQL();
			} else return;
		});
		Log('SQL: 30mins query interval');
		if (statusWS != null && (statusWS.readyState == statusWS.OPEN || statusWS.readyState == statusWS.CONNECTING)) {
			statusWS?.close();
			ConnectWS();
			Log('SOCKET: 30mins socket interval');
		} else if (statusWS != null && (statusWS.readyState == statusWS.CLOSING || statusWS.readyState == statusWS.CLOSED)) {
			ConnectWS();
			Log('SOCKET: 30mins socket interval');
		}
	}, 1.8e+6);
	Log('SOCKET: Reconnect interval started');
	socketLogs.send({
		embeds: [{
			color: Colors.Blue,
			description: 'Socket reconnect interval started'
		}]
	});
});


client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (interaction.type == InteractionType.ApplicationCommand) {
		if (interaction.commandName == 'xblstatus') {
			await interaction.deferReply({
				ephemeral: false
			});
			if (statusErroed) {
				await interaction.editReply({
					embeds: [{
						color: Colors.Blue,
						author: { name: 'XBLStatus.com', url: 'https://xblstatus.com', icon_url: client.user!.avatarURL()! },
						description: 'XBLStatus WebSocket Erroed, we will look into this.'
					}],
					components: [new ActionRowBuilder<ButtonBuilder>().addComponents([new ButtonBuilder().setCustomId('last_status').setLabel('Retrive last status').setStyle(ButtonStyle.Primary)])]
				});
			} else if (Math.round(Date.now() / 1000 - lastSocketUpdate / 1000) > 300) {
				await interaction.editReply({
					embeds: [{
						color: Colors.Yellow,
						author: { name: 'XBLStatus.com', url: 'https://xblstatus.com', icon_url: client.user!.avatarURL()! },
						description: 'Sorry unable to gather information from xblstatus.com, try again later!'
					}],
					components: [new ActionRowBuilder<ButtonBuilder>().addComponents([new ButtonBuilder().setCustomId('last_status').setLabel('Retrive last status').setStyle(ButtonStyle.Primary)])]
				});
			} else {
				let type: string = 'default';
				if (interaction.guild) {
					const data: any = await query('SELECT emoji FROM settings WHERE guildID = ?', interaction.guild.id);
					if (!data.length) type = 'default';
					else type = data[0].emoji;
				}
				const secsAgo = Math.round(Date.now() / 1000 - lastSocketUpdate / 1000);
				await interaction.editReply({
					embeds: [{
						color: Colors.Blue,
						author: { name: 'XBLStatus.com', url: 'https://xblstatus.com', icon_url: client.user!.avatarURL()! },
						title: `Last Update: ${secsAgo} ${secsAgo == 1 ? 'second' : 'seconds'} ago`,
						description: `${currentStatus.map(data => `${getEmoji(data.color, type)} ${data.name} - ${data.description}`).join('\n')}`
					}]
				});
			}
		} else if (interaction.commandName == 'settings') {
			await interaction.deferReply({
				ephemeral: true
			});
			if (interaction.channel?.type == ChannelType.DM) {
				await interaction.editReply({
					content: 'you can not use this command in DM\'s'
				});
			}
			const subInter = interaction as unknown as ChatInputCommandInteraction;
			const subcommand = subInter.options.getSubcommand();

			if (subcommand === 'get') {
				const data: any = await query('SELECT * FROM settings WHERE guildID = ?', interaction.guild?.id);
				if (!data.length) {
					await interaction.editReply({
						embeds: [{
							color: Colors.Red,
							description: 'Settings are not setup within this guild, please use the `/settings edit` command'
						}]
					});
				}
				else await interaction.editReply({
					embeds: [{
						color: Colors.Blue,
						author: { name: 'XBLStatus.com', url: 'https://xblstatus.com', icon_url: client.user!.avatarURL()! },
						fields: [
							{ name: 'Status Webhook', value: `${AES.decrypt(data[0].webhookURL, Config.cipher_key).toString(enc.Utf8)}` },
							{ name: 'Emoji Type', value: `${data[0].emoji}` }
						]
					}]
				});
			} else if (subcommand === 'edit') {
				const setting = subInter.options.getString('setting');
				const value = subInter.options.getString('value');
				if (setting === 'webhook') {
					// let regex = new RegExp("(discord|discordapp)\.com\/api\/webhooks\/([\d]+)\/([a-z0-9_-]+)$");
					// let res = regex.test(value!);
					if (!value?.includes('/api/webhooks')) {
						await interaction.editReply({
							embeds: [{
								color: Colors.Red,
								description: 'Invalid value, your webhook should look something like:\nhttps://discord.com/api/webhooks/NUMBER/a-zA-Z0-9'
							}]
						});
					} else {
						const guildInDB: any = await query('SELECT * FROM settings WHERE guildID = ?', interaction.guild?.id);
						if (!guildInDB.length) {
							await query('INSERT INTO settings (guildID, webhookURL) VALUES (? , ?)',
								interaction.guild?.id,
								AES.encrypt(value, Config.cipher_key).toString()
							);
							await interaction.editReply({
								embeds: [{
									color: Colors.Green,
									description: `successfully updated ${setting}`
								}]
							});
						} else {
							await query('UPDATE settings SET webhookURL = ? WHERE guildID = ?',
								AES.encrypt(value, Config.cipher_key).toString(),
								interaction.guild?.id
							);
							await interaction.editReply({
								embeds: [{
									color: Colors.Green,
									description: `successfully updated ${setting}`
								}]
							});
						}
					}
				} else if (setting === 'emoji') {
					if (!['custom', 'default'].includes(value!)) {
						await interaction.editReply({
							embeds: [{
								color: Colors.Red,
								description: 'Invalid value, your edit emoji value should be either: `default` or `custom`.'
							}]
						});
					} else {
						const guildInDB: any = await query('SELECT * FROM settings WHERE guildID = ?', interaction.guild?.id);
						if (!guildInDB.length) {
							await query('INSERT INTO settings (guildID, emoji) VALUES (? , ?)',
								interaction.guild?.id,
								value
							);
							await interaction.editReply({
								embeds: [{
									color: Colors.Green,
									description: `successfully updated ${setting}`
								}]
							});
						} else {
							await query('UPDATE settings SET emoji = ? WHERE guildID = ?',
								value,
								interaction.guild?.id
							);
							await interaction.editReply({
								embeds: [{
									color: Colors.Green,
									description: `successfully updated ${setting}`
								}]
							});
						}
					}
				}
			}
		}

	} else if (interaction.isButton()) {
		if (interaction.customId == 'socket_close') {
			await interaction.deferReply({
				ephemeral: true
			});
			if (statusWS != null && (statusWS.readyState == statusWS.CLOSING || statusWS.readyState == statusWS.CLOSED)) {
				await interaction.editReply({
					embeds: [{
						color: Colors.Yellow,
						description: 'Socket already closed'
					}]
				});
			} else {
				statusWS?.close();
				await interaction.editReply({
					embeds: [{
						color: Colors.Red,
						description: 'Closing socket'
					}]
				});
			}
		} else if (interaction.customId == 'socket_connect') {
			await interaction.deferReply({
				ephemeral: true
			});
			if (statusWS != null && (statusWS.readyState == statusWS.OPEN || statusWS.readyState == statusWS.CONNECTING)) {
				await interaction.editReply({
					embeds: [{
						color: Colors.Yellow,
						description: 'Socket already connected'
					}]
				});
			} else {
				ConnectWS();
				await interaction.editReply({
					embeds: [{
						color: Colors.Green,
						description: 'Connecting to socket'
					}]
				});
			}
		} else if (interaction.customId == 'stop_retry') {
			await interaction.deferReply({
				ephemeral: true
			});
			if (socketRetryInterval == null) {
				interaction.editReply({
					embeds: [{
						color: Colors.Yellow,
						description: 'Socket retry interval is not running.'
					}]
				});
			} else {
				socketRetryInterval = null;
				statusErroed = true;
				interaction.editReply({
					embeds: [{
						color: Colors.Green,
						description: 'Socket retry interval stopped, error message will be displayed until reconnected to socket.'
					}]
				});
			}
		} else if (interaction.customId == 'last_status') {
			await interaction.deferUpdate();
			let type: string = 'default';
			if (interaction.guild) {
				const data: any = await query('SELECT emoji FROM settings WHERE guildID = ?', interaction.guild.id);
				if (!data.length) type = 'default';
				else type = data[0].emoji;
			}
			const secsAgo = Math.round(Date.now() / 1000 - lastSocketUpdate / 1000);
			await interaction.editReply({
				embeds: [{
					color: Colors.Blue,
					author: { name: 'XBLStatus.com', url: 'https://xblstatus.com', icon_url: client.user!.avatarURL()! },
					title: `Last Update: ${secsAgo} ${secsAgo == 1 ? 'second' : 'seconds'} ago`,
					description: `${currentStatus.map(data => `${getEmoji(data.color, type)} ${data.name} - ${data.description}`).join('\n')}`
				}],
				components: []
			});
		}
	}
});

const joinWebhook = new WebhookClient({ url: Config.JOIN_WEBHOOK });
client.on(Events.GuildCreate, async (guild: Guild) => {
	const guildOwner = await client.users.fetch(guild.ownerId);
	joinWebhook.send({
		embeds: [{
			color: Colors.Blue,
			description: 'New Guild Joined',
			fields: [
				{ name: 'Guild Name / ID', value: `${guild.name}\n${guild.id}`, inline: true },
				{ name: 'Guild Owner / ID', value: `${guildOwner}\n${guildOwner.tag}\n${guildOwner.id}`, inline: true }
			],
			footer: { text: `Guild Count: ${client.guilds.cache.size}` },
			thumbnail: { url: guild.iconURL() ?? client.user?.displayAvatarURL()! }
		}]
	});
});

const leaveWebhook = new WebhookClient({ url: Config.LEAVE_WEBHOOK });
client.on(Events.GuildDelete, async (guild: Guild) => {
	const guildOwner = await client.users.fetch(guild.ownerId);
	leaveWebhook.send({
		embeds: [{
			color: Colors.Blue,
			description: 'Guild Left',
			fields: [
				{ name: 'Guild Name / ID', value: `${guild.name}\n${guild.id}`, inline: true },
				{ name: 'Guild Owner / ID', value: `${guildOwner}\n${guildOwner.tag}\n${guildOwner.id}`, inline: true }
			],
			footer: { text: `Guild Count: ${client.guilds.cache.size}` },
			thumbnail: { url: guild.iconURL() ?? client.user?.displayAvatarURL()! }
		}]
	});
});

function Log(text: string): void {
	console.log(`[${moment().format('lll')}] - ${text}`);
}

function ConnectWS(): void {
	if (statusWS != null && (statusWS.readyState == statusWS.OPEN || statusWS.readyState == statusWS.CONNECTING)) {
		return;
		socketLogs.send({
			embeds: [{
				color: Colors.Yellow,
				description: 'ConnectWS function called whilst socket is already connected'
			}]
		});
		return;
	}
	statusWS = new WebSocket(Config.socketURL, undefined, {
		headers: {
			['Auth']: Config.auth_key
		}
	});
	statusWS.on('open', () => {
		statusErroed = false;
		Log('SOCKET: Connected');
		socketLogs.send({
			embeds: [{
				color: Colors.Green,
				description: 'Socket connected'
			}]
		});
		if (socketRetryInterval !== null) {
			clearInterval(socketRetryInterval);
			socketRetryInterval = null;
			Log('SOCKET: cleared socket retry interval');
			socketLogs.send({
				embeds: [{
					color: Colors.Yellow,
					description: 'Cleared retry timeout'
				}]
			});
		}
	});
	statusWS.on('error', (error: WebSocket.ErrorEvent) => {
		statusErroed = true;
		Log(`SOCKET ERROR: ${error}`);
		errorLogs.send({
			embeds: [{
				color: Colors.Red,
				title: 'Socket Error',
				description: `Error: ${error.error}\nError Message: ${error.message}`
			}]
		});
	});
	statusWS.on('close', () => {
		Log('SOCKET: connection closed, enabling re-try function');
		socketLogs.send({
			embeds: [{
				color: Colors.Orange,
				description: 'Socket connection closed, enabling re-try function.'
			}]
		});
		socketRetryInterval = setInterval(() => {
			ConnectWS();
		}, 60 * 1000);
	});
	statusWS.on('message', async (message: any) => {
		const data: messageStatusData = JSON.parse(Buffer.from(message).toString('utf-8'));
		if (data.message_type === 'xbl_status') {
			oldStatus = currentStatus;
			currentStatus = [];
			lastSocketUpdate = Date.now();
			for (let i = 0; i < data.services.length; i++) {
				currentStatus.push(data.services[i]);
			}
			if (JSON.stringify(oldStatus) !== JSON.stringify(currentStatus)) {
				if (Config.DEV_MODE) return;
				const data: any = await query('SELECT * FROM settings');
				if (!data) return;
				else data.map((x: SQLsettingsData) => {
					sendStatusWebhook(AES.decrypt(x.webhookURL, Config.cipher_key).toString(enc.Utf8), {
						color: Colors.Blue,
						author: { name: 'XBLStatus.com', url: 'https://xblstatus.com', icon_url: client.user!.avatarURL()! },
						description: `Detected status change at time <t:${Math.floor(lastSocketUpdate / 1000)}:f>\n\n${currentStatus.map(data => `${getEmoji(data.color, 'default')} ${data.name} - ${data.description}`).join('\n')}`
					});
				});
			}
		}
	});
}

function getEmoji(color: string, type: string): string {
	if (type === 'default') return getDefaultEmoji(color);
	else if (type === 'custom') return getCustomEmoji(color);
	else return getDefaultEmoji(color);
}

function getDefaultEmoji(color: string): string {
	if (color == '#0c0') return defaultEmojis.GREEN;
	else if (color == '#c80') return defaultEmojis.ORANGE;
	else if (color == '#cc0') return defaultEmojis.YELLOW;
	else if (color == '#c50') return defaultEmojis.ORANGE;
	else if (color == '#c00') return defaultEmojis.RED;
	else if (color == '#ccc') return defaultEmojis.WHITE;

	else {
		errorLogs.send(`Unknown Color: ${color}`);
		return defaultEmojis.BLACK;
	}
}

function getCustomEmoji(color: string): string {
	if (color == '#0c0') return customEmojis.GREEN;
	else if (color == '#c80') return customEmojis.GOLD;
	else if (color == '#cc0') return customEmojis.YELLOW;
	else if (color == '#c50') return customEmojis.ORANGE;
	else if (color == '#c00') return customEmojis.RED;
	else if (color == '#ccc') return customEmojis.GRAY;

	else {
		errorLogs.send(`Unknown Color: ${color}`);
		return customEmojis.BLACK;
	}
}

function sendStatusWebhook(url: string, json = {}) {
	fetch.default(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			embeds: [json]
		})
	}).catch(error => {
		throw error;
	});
}

function connectSQL() {
	sql.connect((error) => {
		if (error) {
			Log(`SQL CONNECT ERROR: ${error}`);
		} else {
			Log('SQL: connected to database');
		}
	});
}

async function query(query: any, ...args: any) {
	return new Promise((resolve, reject) => {
		try {
			sql.query(query, args, async (error, results) => {
				if (error) {
					Log(`QUERY ERROR: ${error}`);
					errorLogs.send({
						embeds: [{
							color: Colors.Red,
							title: 'QUERY ERROR',
							description: `ERROR: ${error.name}\nERORR MESSAGE: ${error.message}`,
							footer: { text: `Was error fatal: ${error.fatal}` }
						}]
					});
					return reject(error);
				}
				else return resolve(results);
			});
		} catch (error) {
			Log(`QUERY CATCH ERROR: ${error}`);
			errorLogs.send({
				embeds: [{
					color: Colors.Red,
					title: 'QUERY CATCH ERROR',
					description: 'Logged error to console'
				}]
			});
			return reject(error);
		}
	});
}