import type { PageLoad } from './$types';
import { getCredits, getMovieDetails, getTVDetails, TMDB_LANGUAGE } from '$lib/tmdb';

export const load = (async ({ fetch, params }) => {
	const id = String(params.id);
	const mediaType = params.type;

	async function getDetails(id: string, mediaType: string) {
		return await getCredits(fetch, TMDB_LANGUAGE, id, mediaType);
	}

	async function getMedia(id: string, mediaType: string) {
		switch (mediaType) {
			case 'movie':
				return await getMovieDetails(fetch, TMDB_LANGUAGE, '', id);
			case 'tv':
				return await getTVDetails(fetch, TMDB_LANGUAGE, '', id);
		}
	}

	return {
		details: await getDetails(id, mediaType),
		media: await getMedia(id, mediaType)
	};
}) satisfies PageLoad;
