import { env } from '$env/dynamic/public';
const BACKEND_URL = env.PUBLIC_BACKEND_URL || 'http://127.0.0.1:8080';
import { client } from './client/services.gen';


client.setConfig({
	baseUrl: BACKEND_URL
})

client.interceptors.error.use((error) => {
	if (error && typeof error == 'object' && 'detail' in error && typeof error.detail == 'string') {
		return error.detail;
	}
	return undefined;
});
