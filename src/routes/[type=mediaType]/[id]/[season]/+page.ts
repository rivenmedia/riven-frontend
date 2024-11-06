/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PageLoad } from './$types';
import { getTVSeasonDetails, getTVDetails } from '$lib/tmdb';
import { error } from '@sveltejs/kit';
import { ItemsService } from '$lib/client';

export const load = (async ({ fetch, params }) => {
	const type = params.type;
	const id = String(params.id);
	const season = Number(params.season);

	if (type === 'movie') {
		error(404, 'No seasons or episodes for movies');
	}

	async function getDetails(tvID: string, seasonNumber: number) {
		return await getTVSeasonDetails(fetch, 'en-US', null, tvID, seasonNumber);
	}

	// not using parent data since it will be fetched again with useless data
	async function mediaDetails(tvID: string) {
		return await getTVDetails(fetch, 'en-US', null, tvID);
	}

	async function getMediaItemDetails(tvID: string): Promise<any[]> {
		const { data } = await ItemsService.getItem({
			path: {
				id: tvID
			},
			query: {
				use_tmdb_id: true
			}
		});
		if (!data) {
			return Promise.resolve([]);
		}
		const anyData = data as any;
		return anyData.seasons.find((seasonItem: any) => seasonItem.number === season).episodes;
	}

	return {
		details: await getDetails(id, season),
		mediaDetails: await mediaDetails(id),
		mediaType: type,
		mediaID: id,
		seasonNumber: season,
		mediaItemDetails: await getMediaItemDetails(id)
	};
}) satisfies PageLoad;
