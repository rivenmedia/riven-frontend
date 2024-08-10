import type { PageServerLoad } from './$types';
import type { Expression, SqlBool } from 'kysely';
import Fuse from 'fuse.js';

const fuseOptions = {
	keys: ['_id', 'item_id', 'title'],
	threshold: 0.8
};

export const load = (async ({ url, locals }) => {
	const limit = Number(url.searchParams.get('limit')) || 24;
	const page = Number(url.searchParams.get('page')) || 1;
	const types = url.searchParams.get('types');
	const query = url.searchParams.get('query');
	const states = url.searchParams.get('states');

	let dbQuery = locals.db.selectFrom('MediaItem').selectAll();

	async function getLibrary() {
		if (types) {
			const typesArray = types.split(',');

			dbQuery = dbQuery.where((eb) => {
				const ors: Expression<SqlBool>[] = [];
				typesArray.forEach((type) => {
					if (type === 'anime') {
						ors.push(
							eb('is_anime', '=', true).and(eb('type', '=', 'show').or(eb('type', '=', 'movie')))
						);
					} else {
						ors.push(eb('type', '=', type));
					}
				});

				return eb.or(ors);
			});
		} else {
			dbQuery = dbQuery.where((eb) => eb.or([eb('type', '=', 'movie'), eb('type', '=', 'show')]));
		}

		if (states) {
			const statesArray = states.split(',');
			dbQuery = dbQuery.where((eb) => {
				const ors: Expression<SqlBool>[] = [];
				statesArray.forEach((state) => {
					ors.push(eb('last_state', '=', state));
				});

				return eb.or(ors);
			});
		}

		if (query && query.length > 0) {
			const fuse = new Fuse(await dbQuery.execute(), fuseOptions);
			const searchResults = fuse.search(query).map((result) => result.item);
			return searchResults;
		}

		return await dbQuery.execute();
	}

	const library = await getLibrary();

	return {
		library: library.slice((page - 1) * limit, page * limit),
		total: library.length
	};
}) satisfies PageServerLoad;
