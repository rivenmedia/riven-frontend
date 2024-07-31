import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load = (async ({ fetch, params }) => {
	const type = params.type;
	const id = Number(params.id);

	let dbData = await db
		.selectFrom('MediaItem')
		.selectAll()
		.where('type', 'in', ['movie', 'show'])
		.where('tmdb_id', '=', String(id))
		.executeTakeFirst();

	return {
		db: dbData
	};
}) satisfies PageServerLoad;
