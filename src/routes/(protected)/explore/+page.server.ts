import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { searchSchema } from "$lib/schemas/search";
import type { PageServerLoad } from "./$types";
import { parseSearchQuery } from "$lib/search-parser";
import providers from "$lib/providers";
import { transformTMDBList, type TMDBListItem, type TMDBTransformedListItem } from "$lib/providers/parser";
import { createCustomFetch } from "$lib/custom-fetch";

export const load: PageServerLoad = async ({ url, fetch }) => {
    // Parse and validate search params from the URL
    const form = await superValidate(url.searchParams, zod4(searchSchema));
    const parsed = parseSearchQuery(form.data.query || "");

    // Fetch trending content for search examples and hero
    let heroItems: TMDBTransformedListItem[] = [];
    let feelingLuckyItems: TMDBTransformedListItem[] = [];
    let searchExamples: string[] = [];

    try {
        const customFetch = createCustomFetch(fetch);

        // Generate 4 distinct random pages to ensure variety
        const randomPagePopMovie = Math.floor(Math.random() * 50) + 1;
        const randomPagePopTV = Math.floor(Math.random() * 50) + 1;
        const randomPageTopMovie = Math.floor(Math.random() * 50) + 1;
        const randomPageTopTV = Math.floor(Math.random() * 50) + 1;

        const [
            trendingMovies,
            trendingTV,
            popularMovies,
            popularTV,
            topRatedMovies,
            topRatedTV
        ] = await Promise.all([
            // High quality for Hero/Examples
            providers.tmdb.GET("/3/trending/movie/{time_window}", {
                params: {
                    path: { time_window: "week" },
                    query: { language: "en-US" }
                },
                fetch: customFetch
            }),
            providers.tmdb.GET("/3/trending/tv/{time_window}", {
                params: {
                    path: { time_window: "week" },
                    query: { language: "en-US" }
                },
                fetch: customFetch
            }),
            // Random popular content
            providers.tmdb.GET("/3/movie/popular", {
                params: {
                    query: { page: randomPagePopMovie, language: "en-US" }
                },
                fetch: customFetch
            }),
            providers.tmdb.GET("/3/tv/popular", {
                params: {
                    query: { page: randomPagePopTV, language: "en-US" }
                },
                fetch: customFetch
            }),
            // Random top rated content
            providers.tmdb.GET("/3/movie/top_rated", {
                params: {
                    query: { page: randomPageTopMovie, language: "en-US" }
                },
                fetch: customFetch
            }),
            providers.tmdb.GET("/3/tv/top_rated", {
                params: {
                    query: { page: randomPageTopTV, language: "en-US" }
                },
                fetch: customFetch
            })
        ]);

        const heroMovieResults = transformTMDBList(
            (trendingMovies.data?.results as TMDBListItem[]) ?? []
        );
        const heroTvResults = transformTMDBList(
            (trendingTV.data?.results as TMDBListItem[]) ?? [],
            "tv"
        );

        const popularMovieResults = transformTMDBList(
            (popularMovies.data?.results as TMDBListItem[]) ?? []
        );
        const popularTvResults = transformTMDBList(
            (popularTV.data?.results as TMDBListItem[]) ?? [],
            "tv"
        );

        const topRatedMovieResults = transformTMDBList(
            (topRatedMovies.data?.results as TMDBListItem[]) ?? []
        );
        const topRatedTvResults = transformTMDBList(
            (topRatedTV.data?.results as TMDBListItem[]) ?? [],
            "tv"
        );

        // Hero items: Top trending
        heroItems = [...heroMovieResults.slice(0, 5), ...heroTvResults.slice(0, 5)].sort(
            () => 0.5 - Math.random()
        );

        // Feeling Lucky: Massive pool of random high-quality content
        feelingLuckyItems = [
            ...heroItems,
            ...popularMovieResults,
            ...popularTvResults,
            ...topRatedMovieResults,
            ...topRatedTvResults
        ].sort(() => 0.5 - Math.random());

        // Extract titles for search examples from hero items
        searchExamples = heroItems.slice(0, 6).map((item) => item.title?.toLowerCase() || "");
    } catch (err) {
        logger.error("Failed to fetch trending content", err);
    }

    return {
        form,
        parsed,
        searchExamples,
        heroItems,
        feelingLuckyItems
    };
};
