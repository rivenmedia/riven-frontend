import type { PageLoad } from './$types';
import { getMovieDetails, getTVDetails, TMDB_LANGUAGE } from '$lib/tmdb';
import { ItemsService } from '$lib/client';
import type { RivenItem } from '$lib/types';

export const load = (async ({ fetch, params }) => {
	const type = params.type;
	const id = String(params.id);

	const { data } = await ItemsService.getItem({
		path: {
			id: id
		},
		query: {
			use_tmdb_id: true
		}
	});

	async function getDetails(type: string, id: string) {
		switch (type) {
			case 'movie':
				// TODO: Remove the ones that are not needed in future
				return await getMovieDetails(
					fetch,
					TMDB_LANGUAGE,
					'credits,external_ids,recommendations,similar,videos,keywords',
					id
				);
			case 'tv':
				const result = await getTVDetails(
					fetch,
					TMDB_LANGUAGE,
					'credits,external_ids,recommendations,similar,videos,keywords',
					id
				);
				console.log(result);
				return result;
		}
	}

	return {
		details: await getDetails(type, id),
		mediaType: type,
		mediaID: id,
		riven: data as unknown as RivenItem
	};
}) satisfies PageLoad;
