import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

import { getTrending } from '$lib/providers/anilist';

export const GET: RequestHandler = async ({ fetch, locals }) => {
	if (!locals.user || !locals.session) {
		error(401, 'Unauthorized');
	}

	try {
		const nowPlaying = await getTrending(fetch);
		return json(nowPlaying);
	} catch (err) {
		console.error('Error fetching anilist trending data:', err);
		error(500, 'Failed to fetch anilist trending data');
	}
};
