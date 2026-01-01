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

/**
 * Apply server-side filters to TMDB results
 */
function applyServerFilters(items: TMDBListItem[], filters: ClientFilters): TMDBListItem[] {
    if (!filters || Object.keys(filters).length === 0) {
        return items;
    }

    return items.filter((item) => {
        // Genre filtering
        if (filters.with_genres) {
            const requiredGenres = String(filters.with_genres)
                .split(/[,|]/)
                .map((g) => Number(g.trim()));
            const separator = String(filters.with_genres).includes("|") ? "OR" : "AND";

            if (separator === "AND") {
                if (!requiredGenres.every((genreId) => item.genre_ids?.includes(genreId))) {
                    return false;
                }
            } else {
                if (!requiredGenres.some((genreId) => item.genre_ids?.includes(genreId))) {
                    return false;
                }
            }
        }

        if (filters.without_genres) {
            const excludedGenres = String(filters.without_genres)
                .split(/[,|]/)
                .map((g) => Number(g.trim()));

            if (excludedGenres.some((genreId) => item.genre_ids?.includes(genreId))) {
                return false;
            }
        }

        // Vote average filtering
        if (filters["vote_average.gte"] !== undefined) {
            if (item.vote_average == null || item.vote_average < filters["vote_average.gte"]) {
                return false;
            }
        }

        if (filters["vote_average.lte"] !== undefined) {
            if (item.vote_average == null || item.vote_average > filters["vote_average.lte"]) {
                return false;
            }
        }

        // Vote count filtering
        if (filters["vote_count.gte"] !== undefined) {
            if (item.vote_count == null || item.vote_count < filters["vote_count.gte"]) {
                return false;
            }
        }

        if (filters["vote_count.lte"] !== undefined) {
            if (item.vote_count == null || item.vote_count > filters["vote_count.lte"]) {
                return false;
            }
        }

        // Date filtering
        const dateField = item.release_date || item.first_air_date;
        if (dateField) {
            if (filters["release_date.gte"] || filters["primary_release_date.gte"]) {
                const minDate = filters["release_date.gte"] || filters["primary_release_date.gte"];
                if (dateField < String(minDate)) {
                    return false;
                }
            }

            if (filters["release_date.lte"] || filters["primary_release_date.lte"]) {
                const maxDate = filters["release_date.lte"] || filters["primary_release_date.lte"];
                if (dateField > String(maxDate)) {
                    return false;
                }
            }

            if (filters["air_date.gte"] || filters["first_air_date.gte"]) {
                const minDate = filters["air_date.gte"] || filters["first_air_date.gte"];
                if (dateField < String(minDate)) {
                    return false;
                }
            }

            if (filters["air_date.lte"] || filters["first_air_date.lte"]) {
                const maxDate = filters["air_date.lte"] || filters["first_air_date.lte"];
                if (dateField > String(maxDate)) {
                    return false;
                }
            }
        }

        return true;
    });
}

// Client-side filter types
interface ClientFilters {
    with_genres?: string;
    without_genres?: string;
    "vote_average.gte"?: number;
    "vote_average.lte"?: number;
    "vote_count.gte"?: number;
    "vote_count.lte"?: number;
    "release_date.gte"?: string;
    "release_date.lte"?: string;
    "primary_release_date.gte"?: string;
    "primary_release_date.lte"?: string;
    "air_date.gte"?: string;
    "air_date.lte"?: string;
    "first_air_date.gte"?: string;
    "first_air_date.lte"?: string;
}

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
    const isSearch = searchMode === "search" || searchMode === "hybrid";

    try {
        const { clientFilters, ...parsed } = parseFilters(url.searchParams);

        // Call the appropriate typed endpoint and extract results
        const fetchResults = async () => {
            if (type === "movie" && isSearch) {
                const res = await providers.tmdb.GET("/3/search/movie", {
                    params: { query: parsed.searchMovieQuery },
                    fetch: customFetch
                });
                return { data: res.data, error: res.error };
            }
            if (type === "movie" && !isSearch) {
                const res = await providers.tmdb.GET("/3/discover/movie", {
                    params: { query: parsed.discoverMovieQuery },
                    fetch: customFetch
                });
                return { data: res.data, error: res.error };
            }
            if (type === "tv" && isSearch) {
                const res = await providers.tmdb.GET("/3/search/tv", {
                    params: { query: parsed.searchTVQuery },
                    fetch: customFetch
                });
                return { data: res.data, error: res.error };
            }
            // type === "tv" && !isSearch
            const res = await providers.tmdb.GET("/3/discover/tv", {
                params: { query: parsed.discoverTVQuery },
                fetch: customFetch
            });
            return { data: res.data, error: res.error };
        };

        const { data, error: apiError } = await fetchResults();

        if (apiError) {
            logger.error(`TMDB API error:`, apiError);
            error(500, `Failed to fetch ${type}s`);
        }

        const rawResults = (data?.results as TMDBListItem[]) || [];
        const filteredResults = applyServerFilters(rawResults, clientFilters);
        const transformedResults = transformTMDBList(
            filteredResults,
            type === "tv" ? "tv" : undefined
        );

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

interface ParsedFilters {
    searchMovieQuery: SearchMovieQuery;
    discoverMovieQuery: DiscoverMovieQuery;
    searchTVQuery: SearchTVQuery;
    discoverTVQuery: DiscoverTVQuery;
    clientFilters: ClientFilters;
}

const CLIENT_FILTERABLE = new Set([
    "with_genres",
    "without_genres",
    "vote_average.gte",
    "vote_average.lte",
    "vote_count.gte",
    "vote_count.lte"
]);

const BOOLEAN_KEYS = new Set([
    "include_adult",
    "include_video",
    "include_null_first_air_dates",
    "screened_theatrically"
]);

const NUMERIC_EXACT = new Set([
    "year",
    "page",
    "with_networks",
    "with_release_type",
    "first_air_date_year",
    "primary_release_year"
]);

function parseFilters(searchParams: URLSearchParams): ParsedFilters {
    const clientFilters: ClientFilters = {};

    // Build typed query objects for each endpoint type
    const searchMovieQuery: Record<string, unknown> = {};
    const discoverMovieQuery: Record<string, unknown> = {};
    const searchTVQuery: Record<string, unknown> = {};
    const discoverTVQuery: Record<string, unknown> = {};

    const parseNum = (v: string | null | undefined): number | undefined => {
        if (v == null || v.trim() === "") return undefined;
        const n = Number(v.trim());
        return isNaN(n) ? undefined : n;
    };

    for (const [key, value] of searchParams) {
        if (key === "searchMode") continue;

        if (CLIENT_FILTERABLE.has(key)) {
            if (key.includes("vote_")) {
                const n = parseNum(value);
                if (n !== undefined) {
                    (clientFilters as Record<string, unknown>)[key] = n;
                }
            } else {
                (clientFilters as Record<string, unknown>)[key] = value;
            }
            continue;
        }

        // Determine the parsed value
        let parsedValue: string | number | boolean = value;

        if (BOOLEAN_KEYS.has(key)) {
            parsedValue = value === "true" || value === "1";
        } else if (NUMERIC_EXACT.has(key) || key.includes("vote_") || key.includes("runtime")) {
            const n = parseNum(value);
            if (n === undefined) continue;
            parsedValue = n;
        }

        // Add to all query objects - the TMDB client will ignore irrelevant params
        searchMovieQuery[key] = parsedValue;
        discoverMovieQuery[key] = parsedValue;
        searchTVQuery[key] = parsedValue;
        discoverTVQuery[key] = parsedValue;
    }

    // Type assertions: values come from parsed URL params (runtime-untyped).
    // We assert to expected query shapes for downstream typing; runtime validation
    // is not performed here. Add schema validation (e.g., zod) if strict safety is required.
    return {
        searchMovieQuery: searchMovieQuery as SearchMovieQuery,
        discoverMovieQuery: discoverMovieQuery as DiscoverMovieQuery,
        searchTVQuery: searchTVQuery as SearchTVQuery,
        discoverTVQuery: discoverTVQuery as DiscoverTVQuery,
        clientFilters
    };
}
