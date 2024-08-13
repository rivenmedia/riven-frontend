import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load = (async ({ locals }) => {
	const statistics = await locals.db
		.selectFrom('MediaItem')
		.select(({ fn }) => [
			fn.countAll<number>().as('total'),
			fn.countAll<number>().filterWhere('type', '=', 'movie').as('movies'),
			fn.countAll<number>().filterWhere('type', '=', 'show').as('shows'),
			fn.countAll<number>().filterWhere('type', '=', 'season').as('seasons'),
			fn.countAll<number>().filterWhere('type', '=', 'episode').as('episodes'),
			fn.countAll<number>().filterWhere('last_state', '!=', 'Completed').as('incomplete')
		])
		.executeTakeFirst();

	type States = {
		Completed: number;
		Failed: number;
		Requested: number;
		Indexed: number;
		Scraped: number;
		Downloaded: number;
		Symlinked: number;
		PartiallyCompleted: number;
		Unknown: number;
		[key: string]: number; // Index signature
	};

	const states = (await locals.db
		.selectFrom('MediaItem')
		.select(({ fn }) => [
			fn.countAll<number>().filterWhere('last_state', '=', 'Completed').as('Completed'),
			fn.countAll<number>().filterWhere('last_state', '=', 'Failed').as('Failed'),
			fn.countAll<number>().filterWhere('last_state', '=', 'Requested').as('Requested'),
			fn.countAll<number>().filterWhere('last_state', '=', 'Indexed').as('Indexed'),
			fn.countAll<number>().filterWhere('last_state', '=', 'Scraped').as('Scraped'),
			fn.countAll<number>().filterWhere('last_state', '=', 'Downloaded').as('Downloaded'),
			fn.countAll<number>().filterWhere('last_state', '=', 'Symlinked').as('Symlinked'),
			fn
				.countAll<number>()
				.filterWhere('last_state', '=', 'Partially Completed')
				.as('PartiallyCompleted'),
			fn.countAll<number>().filterWhere('last_state', '=', 'Unknown').as('Unknown')
		])
		.executeTakeFirst()) as States;

	async function getServices() {
		try {
			const res = await fetch(`${locals.BACKEND_URL}/services`);
			if (res.ok) {
				return await res.json();
			}
			error(400, `Unable to fetch services data: ${res.status} ${res.statusText}`);
		} catch (e) {
			console.error(e);
			error(503, 'Unable to fetch services data. Server error or API is down.');
		}
	}

	return {
		stats: statistics,
		states: states,
		services: await getServices()
	};
}) satisfies PageServerLoad;
