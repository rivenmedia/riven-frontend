import type { PageLoad } from './$types';
import { getTVPopular, getMoviesPopular, getTrending, MediaType, TimeWindow, TMDB_LANGUAGE } from '$lib/tmdb';

export const load = (async ({ fetch, params, url }) => {
	const { list, type } = params;
	const page = Number(url.searchParams.get('page')) || 1;

	async function getList() {
		switch (type) {
			case 'tv':
				switch (list) {
					case 'popular':
						return await getTVPopular(fetch, TMDB_LANGUAGE, page);
					case 'trending':
						return await getTrending(fetch, TMDB_LANGUAGE, page, MediaType.TV, TimeWindow.Week);
					default:
						break;
				}
				break;
			case 'movie':
				switch (list) {
					case 'popular':
						return await getMoviesPopular(fetch, TMDB_LANGUAGE, page);
					case 'trending':
						return await getTrending(fetch, TMDB_LANGUAGE, page, MediaType.Movie, TimeWindow.Week);
					default:
						break;
				}
				break;
			default:
				break;
		}
	}

	return {
		list: await getList(),
		page,
		type,
		listType: list
	};
}) satisfies PageLoad;
