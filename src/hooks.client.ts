import { client } from '$lib/client/services.gen';

client.setConfig({
	baseUrl: '/api'
});

client.interceptors.error.use((error: unknown) => {
	if (error && typeof error == 'object' && 'detail' in error && typeof error.detail == 'string') {
		return error.detail;
	}
	return undefined;
});
