/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PageLoad } from './$types';
import {
	getTVSeasonDetails,
	getTVDetails,
	MediaType,
	TMDB_LANGUAGE,
	getExternalID
} from '$lib/tmdb';
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
		return await getTVSeasonDetails(fetch, TMDB_LANGUAGE, null, tvID, seasonNumber);
	}

	async function mediaDetails(tvID: string) {
		return await getTVDetails(fetch, TMDB_LANGUAGE, null, tvID);
	}

	async function getExternalIDs(tvID: number): Promise<any> {
		return await getExternalID(fetch, MediaType.TV, tvID);
	}

	async function getMediaItemDetails(tvID: string): Promise<any> {
		const { data } = await ItemsService.getItem({
			path: {
				id: tvID
			},
			query: {
				use_tmdb_id: true
			}
		});
		if (!data) {
			return Promise.resolve(null);
		}
		const anyData = data as any;
		return {
			currentSeason: anyData.seasons.find((seasonItem: any) => seasonItem.number === season),
			fullShow: anyData
		};
	}

	const rivenData = await getMediaItemDetails(id);

	return {
		details: await getDetails(id, season),
		mediaDetails: await mediaDetails(id),
		mediaType: type,
		mediaID: id,
		seasonNumber: season,
		riven: rivenData?.currentSeason || null,
		rivenShow: rivenData?.fullShow || null,
		externalIDs: await getExternalIDs(Number(id))
	};
}) satisfies PageLoad;
