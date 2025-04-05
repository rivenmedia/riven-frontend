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

export const load = (async ({ fetch, setHeaders }) => {
    setHeaders({
        'Cache-Control': 'public, max-age=3600, immutable'
    });

    return {
        nowPlaying: await getMoviesNowPlaying(fetch),
        trendingAllToday: await getTrending(fetch, {
            mediaType: MediaType.All,
            timeWindow: TimeWindow.Day
        }),
        trendingMovies: await getTrending(fetch, {
            mediaType: MediaType.Movie,
            timeWindow: TimeWindow.Week
        }),
        trendingShows: await getTrending(fetch, {
            mediaType: MediaType.TV,
            timeWindow: TimeWindow.Week
        }),
        popularMovies: await getMoviesPopular(fetch),
        popularShows: await getTVPopular(fetch),
        topRatedMovies: await getMoviesTopRated(fetch),
        topRatedShows: await getTVTopRated(fetch)
    };
}) satisfies PageLoad;
