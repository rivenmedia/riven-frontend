import type { PageLoad } from './$types';
import { getMoviesPopular } from '$lib/tmdb';

export const load = (async ({ fetch }) => {
	const page = 1;

	async function getMovies() {
		return await getMoviesPopular(fetch, 'en-US', page);
	}

	return {
		movies: await getMovies(),
		page
	};
}) satisfies PageLoad;
