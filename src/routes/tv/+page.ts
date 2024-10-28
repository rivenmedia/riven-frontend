import type { PageLoad } from './$types';
import { getTVPopular } from '$lib/tmdb';

export const load = (async ({ fetch }) => {
	const page = 1;

	async function getShows() {
		return await getTVPopular(fetch, 'en-US', page);
	}

	return {
		shows: await getShows(),
		page
	};
}) satisfies PageLoad;
