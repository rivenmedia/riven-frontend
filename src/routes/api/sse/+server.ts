import { produce } from 'sveltekit-sse';
import WebSocket from 'ws';
import { env } from '$env/dynamic/private';
const BACKEND_URL = env.BACKEND_URL || 'http://127.0.0.1:8080';

const websocket = new WebSocket(`${BACKEND_URL}/ws`);

export function POST() {
	return produce(async function start({ emit }) {
		websocket.on('message', (data) => {
			const { error } = emit('message', data.toString('utf-8'));
			if (error) {
				console.error(error);
				return;
			}
		});
	});
}
