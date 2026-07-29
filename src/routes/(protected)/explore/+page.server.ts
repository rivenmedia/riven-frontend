import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { searchSchema } from "$lib/schemas/search";
import type { PageServerLoad } from "./$types";
import { parseSearchQuery } from "$lib/search-parser";
import { type TMDBTransformedListItem } from "$lib/metadata/parser";
import { logger } from "$lib/logger";
import {
    fetchTmdbCategory,
    fetchTmdbTrending,
    mapGqlTmdbList
} from "$lib/services/backend-metadata";

export const load: PageServerLoad = async ({ url, fetch, locals }) => {
    // Parse and validate search params from the URL
    const form = await superValidate(url.searchParams, zod4(searchSchema));
    const parsed = parseSearchQuery(form.data.query || "");

    // Fetch trending content for search examples and hero
    let heroItems: TMDBTransformedListItem[] = [];
    let feelingLuckyItems: TMDBTransformedListItem[] = [];
    let searchExamples: string[] = [];

    try {
        // Generate 4 distinct random pages to ensure variety
        const randomPagePopMovie = Math.floor(Math.random() * 50) + 1;
        const randomPagePopTV = Math.floor(Math.random() * 50) + 1;
        const randomPageTopMovie = Math.floor(Math.random() * 50) + 1;
        const randomPageTopTV = Math.floor(Math.random() * 50) + 1;

        const [trendingMovies, trendingTV, popularMovies, popularTV, topRatedMovies, topRatedTV] =
            await Promise.all([
                fetchTmdbTrending(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    { type: "movie", timeWindow: "week", page: 1 }
                ),
                fetchTmdbTrending(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    { type: "tv", timeWindow: "week", page: 1 }
                ),
                fetchTmdbCategory(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    { type: "movie", category: "popular", page: randomPagePopMovie }
                ),
                fetchTmdbCategory(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    { type: "tv", category: "popular", page: randomPagePopTV }
                ),
                fetchTmdbCategory(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    { type: "movie", category: "top_rated", page: randomPageTopMovie }
                ),
                fetchTmdbCategory(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    { type: "tv", category: "top_rated", page: randomPageTopTV }
                )
            ]);

        const heroMovieResults = mapGqlTmdbList(trendingMovies);
        const heroTvResults = mapGqlTmdbList(trendingTV);

        const popularMovieResults = mapGqlTmdbList(popularMovies);
        const popularTvResults = mapGqlTmdbList(popularTV);

        const topRatedMovieResults = mapGqlTmdbList(topRatedMovies);
        const topRatedTvResults = mapGqlTmdbList(topRatedTV);

        // Hero items: Top trending
        heroItems = shuffleArray([...heroMovieResults.slice(0, 5), ...heroTvResults.slice(0, 5)]);

        // Feeling Lucky: Massive pool of random high-quality content
        feelingLuckyItems = shuffleArray([
            ...heroItems,
            ...popularMovieResults,
            ...popularTvResults,
            ...topRatedMovieResults,
            ...topRatedTvResults
        ]);

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

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
