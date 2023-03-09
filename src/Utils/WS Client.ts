import { xbls } from '../Client';
import * as websocket from 'ws';
import { SQLsettingsData } from './enums';
import { AES, enc } from 'crypto-js';
let statusWS: undefined | websocket = undefined;

export function connectWS(client: xbls) {
	if (statusWS != undefined && (statusWS.readyState === statusWS.OPEN || statusWS.readyState === statusWS.CONNECTING)) return;

	statusWS = new websocket(client.config.WS.URL, undefined, {
		headers: {
			['Auth']: client.config.WS.AUTH_KEY
		}
	});

	statusWS.on('open', () => {
		client.statusSocketErrored = false;
		console.log('SOCKET: Connected');
		setInterval(() => {
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
	});

	statusWS.on('error', (error: Error) => {
		console.error(error);
	});

	statusWS.on('close', () => {
		console.log('SOCKET: Closed');
		connectWS(client);
	});
	
	statusWS.on('message', async (data: websocket.RawData) => {
		const response = JSON.parse(Buffer.from(data.toString()).toString('utf8'));
		if (response.message_type === 'xbl_status') {
			client.oldStatus = client.currentStatus;
			client.currentStatus = [];
			client.lastSocketUpdate = Date.now();
			for (let i = 0; i < response.services.length; i++) {
				client.currentStatus.push(response.services[i]);
			}
			if (JSON.stringify(client.oldStatus) !== JSON.stringify(client.currentStatus)) {
				return;
				if (client.config.DEV_MODE) return;
				const data: any = await client.database.query('SELECT * FROM settings');
				if (!data) return;
				data.map((i: SQLsettingsData) => {
					client.utils.postStatusWebhookChange(AES.decrypt(i.webhookURL, client.config.CIPHER_KEY).toString(enc.Utf8), {
						color: client.Colors.BLUE,
						author: { name: 'xblstatus.com', url: 'https://xblstatus.com', icon_url: client.user!.displayAvatarURL()! },
						title: `Detected status change at time <t:${Math.floor(client.lastSocketUpdate / 1000)}:f>`,
						description: client.currentStatus.map(data => `${client.utils.getEmoji(data.color)}  ${data.name} - ${data.description}`).join('\n')
					});
				});
			}
		}
	});
}