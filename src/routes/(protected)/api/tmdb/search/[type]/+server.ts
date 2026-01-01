import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import providers from "$lib/providers";
import { transformTMDBList, type TMDBListItem } from "$lib/providers/parser";
import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";
import type { paths } from "$lib/providers/tmdb";

const logger = createScopedLogger("tmdb-search");

// Extract query types from TMDB paths
type SearchMovieQuery = paths["/3/search/movie"]["get"]["parameters"]["query"];
type DiscoverMovieQuery = NonNullable<paths["/3/discover/movie"]["get"]["parameters"]["query"]>;
type SearchTVQuery = paths["/3/search/tv"]["get"]["parameters"]["query"];
type DiscoverTVQuery = NonNullable<paths["/3/discover/tv"]["get"]["parameters"]["query"]>;

export const GET: RequestHandler = async ({ fetch, params, locals, url }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    const { type } = params;
    const customFetch = createCustomFetch(fetch);

    if (type !== "movie" && type !== "tv") {
        error(400, "Invalid media type. Must be 'movie' or 'tv'");
    }

    const searchMode = url.searchParams.get("searchMode") || "discover";

    // Log incoming params for debugging
    logger.debug(
        `Search request: type=${type}, searchMode=${searchMode}, params=${url.searchParams.toString()}`
    );

    // Determine mode: if textual query is present (searchMode='search'|'hybrid'), use search endpoint.
    // If only filters are present (searchMode='discover'), use discover endpoint.
    const isSearch = searchMode === "search" || searchMode === "hybrid";

    try {
        const parsed = parseParams(url.searchParams);
        logger.debug("Parsed params:", parsed.discoverMovieQuery);

        // Call the appropriate typed endpoint
        const fetchResults = async () => {
            if (type === "movie" && isSearch) {
                return providers.tmdb.GET("/3/search/movie", {
                    params: { query: parsed.searchMovieQuery },
                    fetch: customFetch
                });
            }
            if (type === "movie" && !isSearch) {
                return providers.tmdb.GET("/3/discover/movie", {
                    params: { query: parsed.discoverMovieQuery },
                    fetch: customFetch
                });
            }
            if (type === "tv" && isSearch) {
                return providers.tmdb.GET("/3/search/tv", {
                    params: { query: parsed.searchTVQuery },
                    fetch: customFetch
                });
            }
            // type === "tv" && !isSearch
            const query = { ...parsed.discoverTVQuery };
            if (typeof query.sort_by === "string" && query.sort_by.includes("primary_release_date")) {
                // TMDB uses 'first_air_date' for TV shows, not 'primary_release_date'
                query.sort_by = query.sort_by.replace(
                    "primary_release_date",
                    "first_air_date"
                ) as typeof query.sort_by;
            }

            return providers.tmdb.GET("/3/discover/tv", {
                params: { query },
                fetch: customFetch
            });
        };

        const { data, error: apiError } = await fetchResults();

        if (apiError) {
            logger.error(`TMDB API error:`, apiError);
            error(500, `Failed to fetch ${type}s`);
        }

        const results = (data?.results as TMDBListItem[]) || [];

        const transformedResults = transformTMDBList(results, type);

        return json({
            results: transformedResults,
            page: data?.page || 1,
            total_pages: data?.total_pages || 1,
            total_results: data?.total_results || 0
        });
    } catch (err) {
        logger.error("Error searching/discovering media:", err);
        error(500, "Failed to search/discover media");
    }
};

interface ParsedParams {
    searchMovieQuery: SearchMovieQuery;
    discoverMovieQuery: DiscoverMovieQuery;
    searchTVQuery: SearchTVQuery;
    discoverTVQuery: DiscoverTVQuery;
}

const BOOLEAN_KEYS = new Set([
    "include_adult",
    "include_video",
    "include_null_first_air_dates",
    "screened_theatrically"
]);

// Keys that ONLY work with /discover endpoints (not supported by /search)


const NUMERIC_KEYS = new Set([
    "year",
    "page",
    "with_networks",
    "with_release_type",
    "first_air_date_year",
    "primary_release_year",
    "vote_average.gte",
    "vote_average.lte",
    "vote_count.gte",
    "vote_count.lte",
    "with_runtime.gte",
    "with_runtime.lte"
]);

function parseParams(searchParams: URLSearchParams): ParsedParams {
    const queryObj: Record<string, unknown> = {};

    for (const [key, value] of searchParams) {
        if (key === "searchMode" || !value) continue;

        if (BOOLEAN_KEYS.has(key)) {
            queryObj[key] = value === "true" || value === "1";
        } else if (NUMERIC_KEYS.has(key)) {
            const n = Number(value);
            if (!isNaN(n)) queryObj[key] = n;
        } else {
            queryObj[key] = value;
        }
    }

    // All query objects share the same params - TMDB ignores irrelevant ones
    return {
        searchMovieQuery: queryObj as SearchMovieQuery,
        discoverMovieQuery: queryObj as DiscoverMovieQuery,
        searchTVQuery: queryObj as SearchTVQuery,
        discoverTVQuery: queryObj as DiscoverTVQuery
    };
}
