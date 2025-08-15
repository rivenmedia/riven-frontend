import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getServerConfig } from '$lib/serverConfig';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const config = await getServerConfig();

		const response = await fetch(`${config?.backendUrl}/api/v1/stream/logging`, {
			method: 'GET',
			headers: {
				'x-api-key': `${config?.apiKey}`,
				Accept: 'text/event-stream',
				'Cache-Control': 'no-cache'
			}
		});

		if (!response.ok) {
			throw error(response.status, `Backend error: ${response.statusText}`);
		}

		return new Response(response.body, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'Access-Control-Allow-Origin': '*'
			}
		});
	} catch (e) {
		console.error('Stream error:', e);
		throw error(500, 'Failed to connect to log stream');
	}
};
