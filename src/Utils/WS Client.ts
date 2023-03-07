import { xbls } from '../Client';
import * as websocket from 'ws';
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
	});

	statusWS.on('error', (error: Error) => {
		console.error(error);
	});

	statusWS.on('close', (code: number, reason: Buffer) => {
		console.log(`code: ${code}\n\nreason: ${reason.toString()}`);
	});
	
	statusWS.on('message', async (data: websocket.RawData) => {
		const response = JSON.parse(Buffer.from(data.toString()).toString('utf8'));
		if (response.message_type === 'xbl_status') {
			client.currentStatus = [];
			client.lastSocketUpdate = Date.now();
			for (let i = 0; i < response.services.length; i++) {
				client.currentStatus.push(response.services[i]);
			}
		}
	});

	setInterval(() => {
		if (statusWS !== undefined && (statusWS.readyState === statusWS.OPEN || statusWS.readyState === statusWS.CONNECTING)) {
			statusWS.close();
			connectWS(client);
			console.log('SOCKET: 30mins socket interval');
		} else if (statusWS != null && (statusWS.readyState == statusWS.CLOSING || statusWS.readyState == statusWS.CLOSED)) {
			connectWS(client);
			console.log('SOCKET: 30mins socket interval');
		}
	}, 1.8e+6);
}