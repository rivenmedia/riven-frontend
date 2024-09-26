import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { statesName } from '$lib/constants';

export const load = (async ({ locals }) => {
	const statistics = await locals.db
		.selectFrom('MediaItem')
		.select(({ fn }) => [
			fn.count<number>('_id').as('total'),
			fn.count<number>('_id').filterWhere('type', '=', 'movie').as('movies'),
			fn.count<number>('_id').filterWhere('type', '=', 'show').as('shows'),
			fn.count<number>('_id').filterWhere('type', '=', 'season').as('seasons'),
			fn.count<number>('_id').filterWhere('type', '=', 'episode').as('episodes'),
			fn.count<number>('_id').filterWhere('last_state', '!=', 'Completed').as('incomplete')
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
		Unreleased: number;
		Ongoing: number;
		[key: string]: number; // Index signature
	};

	const states = (await locals.db
		.selectFrom('MediaItem')
		.select(({ fn }) =>
			Object.keys(statesName).map((state) =>
				fn.count<number>('_id').filterWhere('last_state', '=', state).as(state)
			)
		)
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
