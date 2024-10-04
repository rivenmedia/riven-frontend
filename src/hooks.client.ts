import { client } from './client/services.gen';

client.setConfig({
	baseUrl: "/api"
});

client.interceptors.error.use((error) => {
	if (error && typeof error == 'object' && 'detail' in error && typeof error.detail == 'string') {
		return error.detail;
	}
	return undefined;
});
