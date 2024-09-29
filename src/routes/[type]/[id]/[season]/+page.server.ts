import type { PageServerLoad } from './$types';

export const load = (async ({ locals, params }) => {
	const id = Number(params.id);
	const season = Number(params.season);

	async function getMediaItemDetails(tvID: number) {
		return await locals.db
			.selectFrom('MediaItem as show')
			.select(['episodeItem.number', 'episodeItem.last_state'])
			.innerJoin('Season as season', 'show._id', 'season.parent_id')
			.innerJoin('MediaItem as seasonItem', 'seasonItem._id', 'season._id')
			.innerJoin('Episode as episode', 'episode.parent_id', 'season._id')
			.innerJoin('MediaItem as episodeItem', 'episodeItem._id', 'episode._id')
			.where((eb) =>
				eb.and({
					'show.tmdb_id': String(tvID),
					'seasonItem.number': season
				})
			)
			.distinct()
			.execute();
	}
	return {
		mediaItemDetails: await getMediaItemDetails(id)
	};
}) satisfies PageServerLoad;
