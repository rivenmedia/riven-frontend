import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { client } from '$lib/client/client.gen';
import { services } from '$lib/client';
import { setServerConfig, getServerConfig } from '$lib/serverConfig';

export const POST: RequestHandler = async ({ request }) => {
    const { backendUrl, apiKey } = await request.json();

    if (!backendUrl || !apiKey) {
        return json({ success: false, message: 'Missing backendUrl or apiKey' }, { status: 400 });
    }

    try {
        const healthResponse = await fetch(`${backendUrl}/api/v1/health`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        if (healthResponse.status !== 200) {
            if (healthResponse.status === 401) {
                return json({ success: false, message: 'Invalid API Key' }, { status: 401 });
            }
            return json(
                { success: false, message: 'Unknown error' },
                { status: healthResponse.status }
            );
        }

        await setServerConfig({ backendUrl, apiKey });

        client.setConfig({
            baseUrl: backendUrl,
            headers: {
                'x-api-key': apiKey
            }
        });

        const { data, error: apiError } = await services();
        if (apiError || !data) {
            return json(
                { success: false, message: 'API Error', requiresOnboarding: true },
                { status: 500 }
            );
        }

        const toCheck = ['symlink', 'symlinklibrary'];
        const allServicesTrue: boolean = toCheck.every((service) => data[service] === true);

        return json({
            success: true,
            message: 'Client configured successfully',
            requiresOnboarding: !allServicesTrue
        });
    } catch {
        return json(
            { success: false, message: 'Error connecting to the backend' },
            { status: 500 }
        );
    }
};

export const GET: RequestHandler = async () => {
    const config = await getServerConfig();
    if (config) {
        return json(config);
    } else {
        return json({ success: false, message: 'No configuration found' }, { status: 404 });
    }
};
