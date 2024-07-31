import type { PageLoad } from './$types';
import { getTVSeasonDetails, getTVDetails } from '$lib/tmdb';
import { error } from '@sveltejs/kit';

export const load = (async ({ fetch, params }) => {
	const type = params.type;
	const id = Number(params.id);
	const season = Number(params.season);

	if (type === 'movie') {
		error(404, 'No seasons or episodes for movies');
	}

	async function getDetails(tvID: number, seasonNumber: number) {
		return await getTVSeasonDetails(fetch, 'en-US', null, tvID, seasonNumber);
	}

	// not using parent data since it will be fetched again with useless data
	async function mediaDetails(tvID: number) {
		return await getTVDetails(fetch, 'en-US', null, tvID);
	}

	return {
		details: await getDetails(id, season),
		mediaDetails: await mediaDetails(id),
		mediaType: type,
		mediaID: id,
		seasonNumber: season
	};
}) satisfies PageLoad;
