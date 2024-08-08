import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
const BACKEND_URL = env.BACKEND_URL || 'http://127.0.0.1:8080';
import { db } from '$lib/server/db';

export const load = (async () => {
	const statistics = await db
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
		[key: string]: number; // Index signature
	};

	const states = (await db
		.selectFrom('MediaItem')
		.select(({ fn }) => [
			fn.count<number>('_id').filterWhere('last_state', '=', 'Completed').as('Completed'),
			fn.count<number>('_id').filterWhere('last_state', '=', 'Failed').as('Failed'),
			fn.count<number>('_id').filterWhere('last_state', '=', 'Requested').as('Requested'),
			fn.count<number>('_id').filterWhere('last_state', '=', 'Indexed').as('Indexed'),
			fn.count<number>('_id').filterWhere('last_state', '=', 'Scraped').as('Scraped'),
			fn.count<number>('_id').filterWhere('last_state', '=', 'Downloaded').as('Downloaded'),
			fn.count<number>('_id').filterWhere('last_state', '=', 'Symlinked').as('Symlinked'),
			fn
				.count<number>('_id')
				.filterWhere('last_state', '=', 'Partially Completed')
				.as('PartiallyCompleted'),
			fn.count<number>('_id').filterWhere('last_state', '=', 'Unknown').as('Unknown')
		])
		.executeTakeFirst()) as States;

	const incompleteItems = await db
		.selectFrom('MediaItem')
		.selectAll()
		.where((eb) => eb.or([eb('type', '=', 'movie'), eb('type', '=', 'show')]))
		.where('last_state', '!=', 'Completed')
		.execute();

	async function getServices() {
		try {
			const res = await fetch(`${BACKEND_URL}/services`);
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
		incompleteItems: incompleteItems,
		states: states,
		services: await getServices()
	};
}) satisfies PageServerLoad;
