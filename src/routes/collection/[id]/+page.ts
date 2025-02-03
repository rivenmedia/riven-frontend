import type { PageLoad } from './$types';
import { getCollection, TMDB_LANGUAGE } from '$lib/tmdb';

export const load = (async ({ fetch, params }) => {
	const id = Number(params.id);

	async function getDetails(id: number) {
		return await getCollection(fetch, TMDB_LANGUAGE, id);
	}

	return {
		details: await getDetails(id),
		collectionId: id
	};
}) satisfies PageLoad;
