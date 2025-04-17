import { client } from '$lib/client/client.gen';

client.setConfig({
    baseUrl: ''
});

client.interceptors.error.use((error: unknown) => {
    if (error && typeof error == 'object' && 'detail' in error && typeof error.detail == 'string') {
        return error.detail;
    }
    return undefined;
});
