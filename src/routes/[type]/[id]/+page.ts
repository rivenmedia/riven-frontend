import type { PageLoad } from './$types';
import { getMovieDetails, getTVDetails } from '$lib/tmdb';

export const load = (async ({ fetch, params, data }) => {
	const type = params.type;
	const id = Number(params.id);

	async function getDetails(type: string, id: number) {
		switch (type) {
			case 'movie':
				// TODO: Remove the ones that are not needed in future
				return await getMovieDetails(
					fetch,
					'en-US',
					'credits,external_ids,recommendations,similar,videos,keywords',
					id
				);
			case 'tv':
				return await getTVDetails(
					fetch,
					'en-US',
					'credits,external_ids,recommendations,similar,videos,keywords',
					id
				);
		}
	}

	return {
		details: await getDetails(type, id),
		mediaType: type,
		mediaID: id,
		...data
	};
}) satisfies PageLoad;
