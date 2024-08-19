import { produce } from 'sveltekit-sse';
import WebSocket from 'ws';
import { env } from '$env/dynamic/private';
const BACKEND_URL = env.BACKEND_URL || 'http://127.0.0.1:8080';

let websocket: WebSocket;
try {
	websocket = new WebSocket(`${BACKEND_URL}/ws`);
} catch (error) {
	console.error(error);
}

export function POST() {
	return produce(async function start({ emit }) {
		try {
			websocket.on('message', (data) => {
				const { error } = emit('message', data.toString('utf-8'));
				if (error) {
					console.error(error);
					return;
				}
			});
			websocket.on('error', (error) => {
				console.error(error);
			});
		} catch (error) {
			console.error(error);
		}
	});
}
