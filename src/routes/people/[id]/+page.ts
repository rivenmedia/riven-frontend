import type { PageLoad } from './$types';
import { getPerson } from '$lib/tmdb';

export const load = (async ({ fetch, params }) => {
	const id = Number(params.id);

	async function getDetails(id: number) {
		return await getPerson(fetch, 'en-US', 'combined_credits', id);
	}

	return {
		details: await getDetails(id),
		personId: id
	};
}) satisfies PageLoad;
