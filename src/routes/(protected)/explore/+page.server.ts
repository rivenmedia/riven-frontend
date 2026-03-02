import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { searchSchema } from "$lib/schemas/search";
import type { PageServerLoad } from "./$types";
import { parseSearchQuery } from "$lib/search-parser";
import providers from "$lib/providers";
import {
    transformTMDBList,
    type TMDBListItem,
    type TMDBTransformedListItem
} from "$lib/providers/parser";
import { createCustomFetch } from "$lib/custom-fetch";
import { logger } from "$lib/logger";
import { endPerfMark, perfCount, startPerfMark } from "$lib/perf";

const EXPLORE_LANDING_CACHE_TTL_MS = 5 * 60 * 1000;
const EXPLORE_RANDOM_PAGE_MAX = 50;

interface ExploreLandingData {
    heroItems: TMDBTransformedListItem[];
    feelingLuckyItems: TMDBTransformedListItem[];
    searchExamples: string[];
}

interface ExploreLandingCacheEntry extends ExploreLandingData {
    expiresAt: number;
    seedBucket: number;
}

let exploreLandingCache: ExploreLandingCacheEntry | null = null;

function getSeedBucket(now: number): number {
    return Math.floor(now / EXPLORE_LANDING_CACHE_TTL_MS);
}

function seededRandom(seed: number): () => number {
    let t = seed >>> 0;
    return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function getDeterministicPage(rng: () => number): number {
    return Math.floor(rng() * EXPLORE_RANDOM_PAGE_MAX) + 1;
}

async function loadExploreLandingData(
    customFetch: typeof fetch,
    seedBucket: number,
    signal?: AbortSignal
): Promise<ExploreLandingData> {
    const rng = seededRandom(seedBucket);

    const randomPagePopMovie = getDeterministicPage(rng);
    const randomPagePopTV = getDeterministicPage(rng);
    const randomPageTopMovie = getDeterministicPage(rng);
    const randomPageTopTV = getDeterministicPage(rng);

    perfCount("explore.landing.seed", 1, {
        seedBucket,
        randomPagePopMovie,
        randomPagePopTV,
        randomPageTopMovie,
        randomPageTopTV
    });

    const [trendingMovies, trendingTV, popularMovies, popularTV, topRatedMovies, topRatedTV] =
        await Promise.all([
            providers.tmdb.GET("/3/trending/movie/{time_window}", {
                params: {
                    path: { time_window: "week" },
                    query: { language: "en-US" }
                },
                fetch: customFetch,
                signal
            }),
            providers.tmdb.GET("/3/trending/tv/{time_window}", {
                params: {
                    path: { time_window: "week" },
                    query: { language: "en-US" }
                },
                fetch: customFetch,
                signal
            }),
            providers.tmdb.GET("/3/movie/popular", {
                params: {
                    query: { page: randomPagePopMovie, language: "en-US" }
                },
                fetch: customFetch,
                signal
            }),
            providers.tmdb.GET("/3/tv/popular", {
                params: {
                    query: { page: randomPagePopTV, language: "en-US" }
                },
                fetch: customFetch,
                signal
            }),
            providers.tmdb.GET("/3/movie/top_rated", {
                params: {
                    query: { page: randomPageTopMovie, language: "en-US" }
                },
                fetch: customFetch,
                signal
            }),
            providers.tmdb.GET("/3/tv/top_rated", {
                params: {
                    query: { page: randomPageTopTV, language: "en-US" }
                },
                fetch: customFetch,
                signal
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

    const heroItems = shuffleArray([...heroMovieResults.slice(0, 5), ...heroTvResults.slice(0, 5)]);

    const feelingLuckyItems = shuffleArray([
        ...heroItems,
        ...popularMovieResults,
        ...popularTvResults,
        ...topRatedMovieResults,
        ...topRatedTvResults
    ]);

    const searchExamples = heroItems.slice(0, 6).map((item) => item.title?.toLowerCase() || "");

    return {
        heroItems,
        feelingLuckyItems,
        searchExamples
    };
}

export const load: PageServerLoad = async ({ url, fetch, request }) => {
    const loadMark = startPerfMark("explore.page.load", {
        route: "/explore"
    });

    // Parse and validate search params from the URL
    const form = await superValidate(url.searchParams, zod4(searchSchema));
    const parsed = parseSearchQuery(form.data.query || "");

    logger.info(`Explore load: query="${form.data.query || ""}", parsedQuery="${parsed.query}", searchMode=${parsed.searchMode}`);
    // Merge any other parameters from the URL that aren't 'query' or 'type'
    // into tmdbParams so they are correctly synced to the SearchStore
    const { query: _, type: __, ...filters } = form.data;
    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== "") {
            (parsed.tmdbParams as any)[key] = value;
        }
    }

    const hasQuery = (form.data.query || "").trim().length > 0;

    // Fetch trending content for search examples and hero only on landing (empty query)
    let heroItems: TMDBTransformedListItem[] = [];
    let feelingLuckyItems: TMDBTransformedListItem[] = [];
    let searchExamples: string[] = [];

    if (!hasQuery) {
        const now = Date.now();
        const seedBucket = getSeedBucket(now);

        try {
            const customFetch = createCustomFetch(fetch);

            if (
                exploreLandingCache &&
                exploreLandingCache.expiresAt > now &&
                exploreLandingCache.seedBucket === seedBucket
            ) {
                perfCount("explore.landing.cache.hit");
                heroItems = exploreLandingCache.heroItems;
                feelingLuckyItems = exploreLandingCache.feelingLuckyItems;
                searchExamples = exploreLandingCache.searchExamples;
            } else {
                perfCount("explore.landing.cache.miss");
                const landingData = await loadExploreLandingData(
                    customFetch,
                    seedBucket,
                    request.signal
                );

                heroItems = landingData.heroItems;
                feelingLuckyItems = landingData.feelingLuckyItems;
                searchExamples = landingData.searchExamples;

                exploreLandingCache = {
                    ...landingData,
                    seedBucket,
                    expiresAt: now + EXPLORE_LANDING_CACHE_TTL_MS
                };
            }
        } catch (err) {
            logger.error("Failed to fetch trending content", err);
        }
    } else {
        perfCount("explore.landing.skipped_for_query");
    }

    endPerfMark(loadMark, {
        hasQuery,
        heroItems: heroItems.length,
        searchExamples: searchExamples.length,
        feelingLuckyItems: feelingLuckyItems.length
    });

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
