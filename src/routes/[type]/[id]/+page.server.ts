import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
	// const type = params.type;
	const id = Number(params.id);

	const dbData = await locals.db
		.selectFrom('MediaItem')
		.selectAll()
		.where('type', 'in', ['movie', 'show'])
		.where('tmdb_id', '=', String(id))
		.executeTakeFirst();

	return {
		db: dbData
	};
}) satisfies PageServerLoad;
