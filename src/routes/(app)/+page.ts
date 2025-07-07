import type { PageLoad } from './$types';

import { MediaType, TimeWindow } from '$lib/tmdb';

export const load = (async ({ fetch }) => {
	const trendingAll = await fetch(`/api/tmdb/${MediaType.All}/${TimeWindow.Day}/trending`);
	if (!trendingAll.ok) {
		throw new Error(`Failed to fetch trending data: ${trendingAll.statusText}`);
	}

	const trendingMovies = await fetch(`/api/tmdb/${MediaType.Movie}/${TimeWindow.Day}/trending`);
	if (!trendingMovies.ok) {
		throw new Error(`Failed to fetch trending movies: ${trendingMovies.statusText}`);
	}

	const trendingTv = await fetch(`/api/tmdb/${MediaType.TV}/${TimeWindow.Day}/trending`);
	if (!trendingTv.ok) {
		throw new Error(`Failed to fetch trending TV shows: ${trendingTv.statusText}`);
	}

	return {
		trendingAll: await trendingAll.json(),
		trendingMovies: await trendingMovies.json(),
		trendingTV: await trendingTv.json()
	};
}) satisfies PageLoad;
