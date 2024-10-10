import type { PageLoad } from './$types';
import { getMovieDetails, getTVDetails } from '$lib/tmdb';
import { ItemsService } from '$lib/client';

export const load = (async ({ fetch, params }) => {
	const type = params.type;
	const id = Number(params.id);

	const { data } = await ItemsService.getItem({
		path: {
			id: id
		},
		query: {
			use_tmdb_id: true,
		}
	});

	if (data) {
		data.requested_at = new Date(data.requested_at as string);
	}

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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		db: data as any
	};
}) satisfies PageLoad;
