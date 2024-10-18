import type { Handle } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { client, DefaultService } from '$lib/client/services.gen';

const middleware: Handle = async ({ event, resolve }) => {
	// Try to get backendUrl and apiKey from cookies
	const backendUrl = event.cookies.get('backendUrl');
	const apiKey = event.cookies.get('apiKey');

	// If we have values in cookies, set them in locals and configure the client
	if (backendUrl && apiKey) {
		event.locals.backendUrl = backendUrl;
		event.locals.apiKey = apiKey;
		client.setConfig({
			baseUrl: backendUrl,
			headers: {
				"x-api-key": apiKey
			}
		});
	}

	const customEvent = event.request.headers.get('X-Custom-Event');

	if (customEvent) {
		switch (customEvent) {
            case 'initialize-api':
                const newBackendUrl = event.request.headers.get('X-Backend-Url');
                const newApiKey = event.request.headers.get('X-Api-Key');

                if (newBackendUrl && newApiKey) {
                    // Set new values in locals
                    event.locals.backendUrl = newBackendUrl;
                    event.locals.apiKey = newApiKey;

                    // Set new values in cookies (secure and HTTP-only)
                    event.cookies.set('backendUrl', newBackendUrl, {
                        path: '/',
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 60 * 60 * 24 * 30 // 30 days
                    });
                    event.cookies.set('apiKey', newApiKey, {
                        path: '/',
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 60 * 60 * 24 * 30 // 30 days
                    });

                    // Configure the client with new values
                    client.setConfig({
                        baseUrl: newBackendUrl,
                        headers: {
                            "x-api-key": newApiKey
                        }
                    });
                }
                break;
		}
	}

	if (!event.url.pathname.startsWith('/connect') && !event.url.pathname.startsWith('/onboarding') && event.request.method === 'GET') {
		if (!event.locals.backendUrl && !event.locals.apiKey) {
			redirect(302, '/connect')
		}
		const { data, error: apiError } = await DefaultService.services();
		if (apiError || !data) {
			return error(500, 'API Error');
		}
		const toCheck = ['symlink', 'symlinklibrary'];
		const allServicesTrue: boolean = toCheck.every((service) => data[service] === true);
		if (!allServicesTrue) {
			redirect(302, '/onboarding');
		}
	}

	return resolve(event);
};

client.interceptors.error.use((error: unknown) => {
	if (error && typeof error == 'object' && 'detail' in error && typeof error.detail == 'string') {
		return error.detail;
	}
	return undefined;
});

export const handle = sequence(middleware);
