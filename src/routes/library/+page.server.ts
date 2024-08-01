import type { PageServerLoad } from './$types';
// import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';

// const BACKEND_URL = env.BACKEND_URL || 'http://127.0.0.1:8080';

export const load = (async () => {
	// const params = {
	// 	limit: Number(url.searchParams.get('limit')) || 100,
	// 	page: Number(url.searchParams.get('page')) || 1,
	// 	type: url.searchParams.get('type') || 'Movie',
	// 	search: url.searchParams.get('search') || '',
	// 	state: url.searchParams.get('state') || ''
	// };

	async function getLibrary() {
		return await db.selectFrom('MediaItem').selectAll().execute();
	}

	return {
		library: await getLibrary()
	};
}) satisfies PageServerLoad;
