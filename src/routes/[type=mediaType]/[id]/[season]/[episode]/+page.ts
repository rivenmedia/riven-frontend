/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PageLoad } from './$types';
import { getTVDetails, TMDB_LANGUAGE, getTVEpisodeDetails } from '$lib/tmdb';
import { error } from '@sveltejs/kit';
import { ItemsService } from '$lib/client';

export const load = (async ({ fetch, params }) => {
	const type = params.type;
	const id = String(params.id);
	const season = Number(params.season);
	const episode = Number(params.episode);

	if (type === 'movie') {
		error(404, 'No seasons or episodes for movies');
	}

	async function getDetails(tvID: string, seasonNumber: number, episodeNumber: number) {
		return await getTVEpisodeDetails(fetch, TMDB_LANGUAGE, null, tvID, seasonNumber, episodeNumber);
	}

	// not using parent data since it will be fetched again with useless data
	async function mediaDetails(tvID: string) {
		return await getTVDetails(fetch, TMDB_LANGUAGE, null, tvID);
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
		return anyData.seasons
			.find((seasonItem: any) => seasonItem.number === season)
			.episodes.find((episodeItem: any) => episodeItem.number === episode);
	}

	return {
		details: await getDetails(id, season, episode),
		mediaDetails: await mediaDetails(id),
		mediaType: type,
		mediaID: id,
		seasonNumber: season,
		episodeNumber: episode,
		riven: await getMediaItemDetails(id)
	};
}) satisfies PageLoad;
