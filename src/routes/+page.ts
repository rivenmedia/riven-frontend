import type { PageLoad } from './$types';
import {
	MediaType,
	TimeWindow,
	getMoviesNowPlaying,
	getMoviesPopular,
	getMoviesTopRated,
	getTVPopular,
	getTVTopRated,
	getTrending
} from '$lib/tmdb';

export const load = (async ({ fetch }) => {
	async function getTrendingAllToday() {
		return await getTrending(fetch, 'en-US', 1, MediaType.All, TimeWindow.Day);
	}

	async function getTrendingMoviesWeek() {
		return await getTrending(fetch, 'en-US', 1, MediaType.Movie, TimeWindow.Week);
	}

	async function getTrendingShowsWeek() {
		return await getTrending(fetch, 'en-US', 1, MediaType.TV, TimeWindow.Week);
	}

	async function getMoviesPopularDefault() {
		return await getMoviesPopular(fetch, 'en-US', 1);
	}

	async function getMoviesTopRatedDefault() {
		return await getMoviesTopRated(fetch, 'en-US', 1);
	}

	async function getTVPopularDefault() {
		return await getTVPopular(fetch, 'en-US', 1);
	}

	async function getTVTopRatedDefault() {
		return await getTVTopRated(fetch, 'en-US', 1);
	}

	async function getNowPlaying() {
		return await getMoviesNowPlaying(fetch, 'en-US', 1);
	}

	return {
		nowPlaying: await getNowPlaying(),
		trendingAll: await getTrendingAllToday(),
		trendingMovies: await getTrendingMoviesWeek(),
		trendingShows: await getTrendingShowsWeek(),
		moviesPopular: await getMoviesPopularDefault(),
		moviesTopRated: await getMoviesTopRatedDefault(),
		showsPopular: await getTVPopularDefault(),
		showsTopRated: await getTVTopRatedDefault()
	};
}) satisfies PageLoad;
