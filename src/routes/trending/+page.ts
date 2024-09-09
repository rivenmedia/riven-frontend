import type { PageLoad } from './$types';
import { getTrending, MediaType } from '$lib/tmdb';

export const load = (async ({ fetch, url }) => {

    const page = Number(url.searchParams.get('page')) || 1;

	async function getTrendingMovies() {
		return await getTrending(fetch, 'en-US', page, MediaType.Movie);
	}

    async function getTrendingShows() {
		return await getTrending(fetch, 'en-US', page, MediaType.TV);
	}

	return {
		movies: await getTrendingMovies(),
		shows: await getTrendingShows()
	};
}) satisfies PageLoad;
