import { produce } from 'sveltekit-sse';
import type { RequestHandler } from './$types';

const validStreams: string[] = [];

async function fetchValidStreams(backendUrl: string, apiKey: string) {
  const response = await fetch(`${backendUrl}/api/v1/stream/event_types`, {
	headers: {
	  'x-api-key': apiKey
	}
  });
  if (!response.ok) {
	throw new Error('Failed to fetch valid stream types');
  }
  let data = await response.json()
  return data.message;
}
export const POST: RequestHandler = async ({ fetch, params, locals }) => {
	const { stream } = params;
	const backendUrl = locals.backendUrl;
	const apiKey = locals.apiKey;

	if (!backendUrl || !apiKey) {
		throw new Error('Backend URL or API key not configured');
	}

	if (validStreams.length === 0) {
		try {
			validStreams.push(...await fetchValidStreams(backendUrl, apiKey));
		} catch (err) {
			console.error('Error fetching valid streams:', err);
			throw new Error('Failed to fetch valid stream types');
		}
	}

	const streamUrl = `${backendUrl}/api/v1/stream/${stream}`;

	try {
		const streamedResponse = await fetch(streamUrl, {
      method: 'GET',
			headers: {
				'x-api-key': apiKey
			}
		});

		if (!streamedResponse.body) {
			throw new Error('No response body');
		}

		const reader = streamedResponse.body.getReader();
		const textDecoder = new TextDecoder();

		return produce(async function start({ emit }) {
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					if (value) {
						emit('message', textDecoder.decode(value));
					}
				}
			} catch (error) {
				console.error('Error reading stream:', error);
				emit('error', 'Error reading stream');
			} finally {
				reader.releaseLock();
			}
		});
	} catch (error) {
		console.error('Error fetching stream:', error);
		return new Response('Error fetching stream', { status: 500 });
	}
};
