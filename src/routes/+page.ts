import type { PageLoad } from './$types';
import {
	MediaType,
	TMDB_LANGUAGE,
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
		return await getTrending(fetch, TMDB_LANGUAGE, 1, MediaType.All, TimeWindow.Day);
	}

	async function getTrendingMoviesWeek() {
		return await getTrending(fetch, TMDB_LANGUAGE, 1, MediaType.Movie, TimeWindow.Week);
	}

	async function getTrendingShowsWeek() {
		return await getTrending(fetch, TMDB_LANGUAGE, 1, MediaType.TV, TimeWindow.Week);
	}

	async function getMoviesPopularDefault() {
		return await getMoviesPopular(fetch, TMDB_LANGUAGE, 1);
	}

	async function getMoviesTopRatedDefault() {
		return await getMoviesTopRated(fetch, TMDB_LANGUAGE, 1);
	}

	async function getTVPopularDefault() {
		return await getTVPopular(fetch, TMDB_LANGUAGE, 1);
	}

	async function getTVTopRatedDefault() {
		return await getTVTopRated(fetch, TMDB_LANGUAGE, 1);
	}

	async function getNowPlaying() {
		return await getMoviesNowPlaying(fetch, TMDB_LANGUAGE, 1);
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
