import { ItemsService } from '$/client';
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

	if (dbData && dbData.type === 'show') {
		const seasons = await locals.db
			.selectFrom('MediaItem as seasonItem')
			.selectAll()
			.innerJoin('Season as season', 'seasonItem._id', 'season._id')
			.where('type', '=', 'season')
			.where('season.parent_id', '=', dbData._id)
			.orderBy('seasonItem.number', 'asc')
			.execute();
		dbData.seasons = seasons;
		for (const season of seasons) {
			const episodes = await locals.db
				.selectFrom('MediaItem as episodeItem')
				.selectAll()
				.innerJoin('Episode as episode', 'episodeItem._id', 'episode._id')
				.where('type', '=', 'episode')
				.where('episode.parent_id', '=', season._id)
				.orderBy('episodeItem.number', 'asc')
				.execute();
			season.episodes = episodes;
		}
	}

	const {data} = await ItemsService.getItem({
		path: {
			id: id
		},
		query: {
			use_tmdb_id: true
		}
	})

	if(data) {
		data.requested_at = new Date(data.requested_at as string)
	}

	console.log(dbData, data);

	return {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		db: data as any,
		data
	};
}) satisfies PageServerLoad;
