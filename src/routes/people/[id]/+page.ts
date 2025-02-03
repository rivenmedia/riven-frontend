import type { PageLoad } from './$types';
import { getPerson, TMDB_LANGUAGE } from '$lib/tmdb';

export const load = (async ({ fetch, params }) => {
	const id = Number(params.id);

	async function getDetails(id: number) {
		return await getPerson(fetch, TMDB_LANGUAGE, 'combined_credits', id);
	}

	return {
		details: await getDetails(id),
		personId: id
	};
}) satisfies PageLoad;
