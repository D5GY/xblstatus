import xbls from '../Client';
import * as websocket from 'ws';
import { SQLsettingsData } from './types';
import { AES, enc } from 'crypto-js';
let statusWS: undefined | websocket = undefined;
let socketKeepAlive: null | NodeJS.Timeout = null;
let firstLaunch: boolean = true;

export function connectWS(client: xbls) {
	if (statusWS != undefined && (statusWS.readyState === statusWS.OPEN || statusWS.readyState === statusWS.CONNECTING)) return;

	statusWS = new websocket(xbls.config.WS.URL, undefined, {
		headers: {
			['Auth']: xbls.config.WS.AUTH_KEY
		}
	});

	statusWS.on('open', () => {
		xbls.statusSocketErrored = false;
		console.log('SOCKET: Connected');
		if (socketKeepAlive === null) {
			socketKeepAlive = setInterval(() => {
				if (statusWS !== undefined && (statusWS.readyState === statusWS.OPEN || statusWS.readyState === statusWS.CONNECTING)) {
					statusWS.close();
					connectWS(client);
					console.log('SOCKET: 30mins socket interval');
				} else {
					connectWS(client);
					console.log('SOCKET: 30mins socket interval');
				}
			}, 1.8e+6);
			console.log('SOCKET: 30mins socket reconnect started');
		}
		if (xbls.socketRetryInterval !== null) {
			clearInterval(xbls.socketRetryInterval);
			xbls.socketRetryInterval = null;
			console.log('SOCKET: Cleared socket retry interval');
		}
	});

	statusWS.on('error', (error: Error) => {
		xbls.statusSocketErrored = true;
		console.error(error);
	});

	statusWS.on('close', () => {
		console.log('SOCKET: Closed');
		if (xbls.socketRetryInterval === null) {
			xbls.socketRetryInterval = setInterval(() => {
				connectWS(client);
			}, 60 * 1000);
			console.log('SOCKET: Retry Interval Started');
		}
	});
	
	statusWS.on('message', async (data: websocket.RawData) => {
		const response = JSON.parse(Buffer.from(data.toString()).toString('utf8'));
		if (response.message_type === 'xbl_status') {
			xbls.oldStatus = xbls.currentStatus;
			xbls.currentStatus = [];
			xbls.lastSocketUpdate = Date.now();
			for (let i = 0; i < response.services.length; i++) {
				xbls.currentStatus.push(response.services[i]);
			}
			if (JSON.stringify(xbls.oldStatus) !== JSON.stringify(xbls.currentStatus)) {
				if (xbls.config.DEV_MODE || firstLaunch) return;
				const data: any = await xbls.database.query('SELECT * FROM settings');
				if (!data) return;
				data.map((i: SQLsettingsData) => {
					xbls.utils.postStatusWebhookChange(AES.decrypt(i.webhookURL, xbls.config.CIPHER_KEY).toString(enc.Utf8), {
						color: xbls.Colors.BLUE,
						author: { name: 'xblstatus.com', url: 'https://xblstatus.com', icon_url: client.user!.displayAvatarURL()! },
						title: `Detected status change at time <t:${Math.floor(xbls.lastSocketUpdate / 1000)}:f>`,
						description: xbls.currentStatus.map(data => `${xbls.utils.getEmoji(data.color)}  ${data.name} - ${data.description}`).join('\n')
					});
				});
			}
		}
		firstLaunch = false;
	});
}