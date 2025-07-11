import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

import { getMoviesNowPlaying } from '$lib/providers/tmdb';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const nowPlaying = await getMoviesNowPlaying(fetch);
		return json(nowPlaying);
	} catch (err) {
		console.error('Error fetching nowPlaying data:', err);
		error(500, 'Failed to fetch nowPlaying data');
	}
};
