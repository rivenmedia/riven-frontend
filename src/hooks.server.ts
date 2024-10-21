import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { client } from '$lib/client/services.gen';
import { getServerConfig } from '$lib/serverConfig';

const configureClientMiddleware: Handle = async ({ event, resolve }) => {
	const config = await getServerConfig();

	if (config) {
		event.locals.backendUrl = config.backendUrl;
		event.locals.apiKey = config.apiKey;
		client.setConfig({
			baseUrl: config.backendUrl,
			headers: {
				'x-api-key': config.apiKey
			}
		});
	}

	if (
		!event.url.pathname.startsWith('/connect') &&
		!event.url.pathname.startsWith('/api/configure-client') &&
		event.request.method === 'GET'
	) {
		if (!event.locals.backendUrl || !event.locals.apiKey) {
			throw redirect(307, '/connect');
		}
	}

	return resolve(event);
};

const errorInterceptor: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	client.interceptors.error.use((error: unknown) => {
		if (
			error &&
			typeof error === 'object' &&
			'detail' in error &&
			typeof error.detail === 'string'
		) {
			if (error.detail === 'Missing or invalid API key') {
				throw redirect(307, '/connect');
			}
			return error.detail;
		}
		return undefined;
	});

	return response;
};

export const handle = sequence(configureClientMiddleware, errorInterceptor);
