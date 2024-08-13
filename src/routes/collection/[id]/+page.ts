import type { PageLoad } from './$types';
import { getCollection } from '$lib/tmdb';

export const load = (async ({ fetch, params }) => {
	const id = Number(params.id);

	async function getDetails(id: number) {
		return await getCollection(fetch, 'en-US', id);
	}

	return {
		details: await getDetails(id),
		collectionId: id
	};
}) satisfies PageLoad;
