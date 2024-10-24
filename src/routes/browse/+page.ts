import type { PageLoad } from './$types';
import { getMovieSearch, getTVSearch, getCollectionSearch } from '$lib/tmdb';

export const load = (async ({ fetch, url }) => {
	const query = url.searchParams.get('query');

	if (query && query.length > 0) {
		const moviesRes = await getMovieSearch(fetch, query, false, 'en-US', null, 1, null, null);
		const tvRes = await getTVSearch(fetch, query, null, false, 'en-US', 1, null);
		const collectionRes = await getCollectionSearch(fetch, query, false, 'en-US', 1, null);

		return {
			movies: moviesRes.results,
			shows: tvRes.results,
			collections: collectionRes.results
		};
	} else {
		return {
			movies: [],
			shows: []
		};
	}
}) satisfies PageLoad;
