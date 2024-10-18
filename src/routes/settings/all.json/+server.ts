import { SettingsService } from '$lib/client';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const { data } = await SettingsService.getAllSettings();
	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'content-type': 'application/json'
		}
	});
};
