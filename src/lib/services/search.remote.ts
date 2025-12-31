import { query, getRequestEvent } from "$app/server";
import providers from "$lib/providers";
import { transformTMDBList, transformTVDBList, type TMDBListItem, type TMDBTransformedListItem } from "$lib/providers/parser";
import * as dateUtils from "$lib/utils/date";
import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";
import { error } from "@sveltejs/kit";

const logger = createScopedLogger("search-remote");

interface SearchParams {
    query?: string;
    page?: number;
    year?: number;
    with_genres?: string;
    without_genres?: string;
    "vote_average.gte"?: number;
    "vote_average.lte"?: number;
    "vote_count.gte"?: number;
    "vote_count.lte"?: number;
    searchMode?: "search" | "discover" | "hybrid";
    [key: string]: string | number | undefined;
}

const CLIENT_FILTERABLE = new Set([
    "with_genres",
    "without_genres",
    "vote_average.gte",
    "vote_average.lte",
    "vote_count.gte",
    "vote_count.lte",
    "air_date.gte",
    "air_date.lte",
    "first_air_date.gte",
    "first_air_date.lte"
]);

export interface SearchResult {
    results: TMDBTransformedListItem[];
    page: number;
    total_pages: number;
    total_results: number;
}

/**
 * Apply server-side filters to results
 */
const genreCache = new Map<string, number[]>();

function getParsedGenres(filterValue: string): number[] {
    if (genreCache.has(filterValue)) return genreCache.get(filterValue)!;

    // Single pass parse
    const ids: number[] = [];
    const parts = filterValue.split(/[,|]/);
    for (const p of parts) {
        const num = Number(p.trim());
        if (!isNaN(num)) ids.push(num);
    }
    genreCache.set(filterValue, ids);
    return ids;
}

function applyServerFilters(
    items: TMDBTransformedListItem[],
    filters: Record<string, any>
): TMDBTransformedListItem[] {
    if (!filters || Object.keys(filters).length === 0) {
        return items;
    }

    // Pre-calculate filter values outside the loop
    const withGenres = filters.with_genres ? getParsedGenres(String(filters.with_genres)) : null;
    const withGenresSeparator = withGenres && String(filters.with_genres).includes("|") ? "OR" : "AND";
    const withoutGenres = filters.without_genres ? getParsedGenres(String(filters.without_genres)) : null;

    const voteAvgGte = filters["vote_average.gte"] !== undefined ? Number(filters["vote_average.gte"]) : null;
    const voteAvgLte = filters["vote_average.lte"] !== undefined ? Number(filters["vote_average.lte"]) : null;
    const voteCountGte = filters["vote_count.gte"] !== undefined ? Number(filters["vote_count.gte"]) : null;
    const voteCountLte = filters["vote_count.lte"] !== undefined ? Number(filters["vote_count.lte"]) : null;

    const relDateGte = filters["release_date.gte"] || filters["primary_release_date.gte"];
    const relDateLte = filters["release_date.lte"] || filters["primary_release_date.lte"];

    return items.filter((item) => {
        // Genre filtering
        if (withGenres) {
            if (withGenresSeparator === "AND") {
                for (const gId of withGenres) {
                    if (!item.genre_ids?.includes(gId)) return false;
                }
            } else {
                let found = false;
                for (const gId of withGenres) {
                    if (item.genre_ids?.includes(gId)) {
                        found = true;
                        break;
                    }
                }
                if (!found) return false;
            }
        }

        if (withoutGenres) {
            for (const gId of withoutGenres) {
                if (item.genre_ids?.includes(gId)) return false;
            }
        }

        // Vote average filtering
        if (voteAvgGte !== null) {
            if (!item.vote_average || item.vote_average < voteAvgGte) return false;
        }

        if (voteAvgLte !== null) {
            if (!item.vote_average || item.vote_average > voteAvgLte) return false;
        }

        // Vote count filtering
        if (voteCountGte !== null) {
            if (!item.vote_count || item.vote_count < voteCountGte) return false;
        }

        if (voteCountLte !== null) {
            if (!item.vote_count || item.vote_count > voteCountLte) return false;
        }

        // Date filtering
        const dateField = item.release_date || item.first_air_date;
        if (dateField) {
            if (relDateGte && dateField < String(relDateGte)) return false;
            if (relDateLte && dateField > String(relDateLte)) return false;
        }

        return true;
    });
}

/**
 * Helper to extract client filters from params
 */
function extractClientFilters(params: Record<string, any>) {
    const clientFilters: Record<string, any> = {};
    const apiParams: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        if (CLIENT_FILTERABLE.has(key)) {
            clientFilters[key] = value;
        } else {
            apiParams[key] = value;
        }
    }
    return { clientFilters, apiParams };
}

/**
 * Search movies via TMDB
 */
export const searchMovies = query(
    "unchecked",
    async (params: SearchParams): Promise<SearchResult> => {
        const event = getRequestEvent();
        if (!event?.locals.user || !event?.locals.session) {
            error(401, "Unauthorized");
        }

        const customFetch = createCustomFetch(event.fetch);
        const { searchMode = "discover", ...queryParams } = params;

        const { clientFilters, apiParams } = extractClientFilters(queryParams);

        try {
            const isSearch = searchMode === "search" || searchMode === "hybrid";
            const endpoint = isSearch ? "/3/search/movie" : "/3/discover/movie";
            const method = providers.tmdb.GET; // Both use GET

            const result = await method(endpoint as any, {
                params: { query: apiParams as any },
                fetch: customFetch
            });

            if ((result as any).error) {
                logger.error(`TMDB API error (${endpoint}):`, (result as any).error);
                throw new Error(`Failed to ${isSearch ? "search" : "discover"} movies`);
            }

            const rawResults = (result.data?.results as unknown as TMDBListItem[]) || [];
            const transformedResults = transformTMDBList(rawResults);
            const filteredResults = applyServerFilters(transformedResults, clientFilters);

            return {
                results: transformedResults,
                page: result.data?.page || 1,
                total_pages: result.data?.total_pages || 1,
                total_results: result.data?.total_results || 0
            };
        } catch (err) {
            logger.error("Error searching movies:", err);
            throw err;
        }
    }
);

/**
 * Search TV shows via TVDB
 */
export const searchTV = query("unchecked", async (params: SearchParams): Promise<SearchResult> => {
    const event = getRequestEvent();
    if (!event?.locals.user || !event?.locals.session) {
        error(401, "Unauthorized");
    }

    const tvdbToken = event.cookies.get("tvdb_cookie");
    if (!tvdbToken) {
        error(500, "TVDB authentication token not available");
    }

    const customFetch = createCustomFetch(event.fetch);
    const { page = 1, ...restParams } = params;
    const limit = 20;

    const { clientFilters } = extractClientFilters(restParams);

    // Build TVDB search params
    const searchParams: Record<string, string | number> = {
        type: "series",
        limit,
        offset: (page - 1) * limit
    };

    const TVDB_SEARCH_FIELDS = [
        "query",
        "year",
        "company",
        "country",
        "director",
        "network",
        "remote_id"
    ];

    let hasCriteria = false;
    for (const key of TVDB_SEARCH_FIELDS) {
        if (params[key] !== undefined) {
            searchParams[key] = params[key];
            hasCriteria = true;
        }
    }

    if (!hasCriteria) {
        return { results: [], page: 1, total_pages: 0, total_results: 0 };
    }

    try {
        let searchResult;

        // Strategy 1: Genre-Only Search (Use /series/filter)
        if (!params.query && clientFilters.with_genres) {
            const genresRaw = String(clientFilters.with_genres).split(",");
            const firstGenreId = Number(genresRaw[0]);
            const tvdbGenreId = TMDB_TO_TVDB_GENRE[firstGenreId];

            if (tvdbGenreId) {
                searchResult = await providers.tvdb.GET("/series/filter", {
                    params: { query: { genre: tvdbGenreId, country: "usa", lang: "eng" } as any },
                    headers: { Authorization: `Bearer ${tvdbToken}` },
                    fetch: customFetch
                });
            } else {
                return { results: [], page: 1, total_pages: 0, total_results: 0 };
            }
        }
        // Strategy 2: Standard Text Search
        else {
            searchResult = await providers.tvdb.GET("/search", {
                params: { query: searchParams as any },
                headers: { Authorization: `Bearer ${tvdbToken}` },
                fetch: customFetch
            });
        }

        if (searchResult.error) {
            logger.error("TVDB search error:", searchResult.error);
            throw new Error("Failed to search TVDB");
        }

        const rawData = searchResult.data?.data || [];

        // Strategy 3: Hybrid Enrichment
        // If searching by text AND filtering by genre, standard search lacks genre data.
        // We must enrich the top results with full details.
        if (params.query && (clientFilters.with_genres || clientFilters.without_genres)) {
            await enrichTVDBResults(rawData, tvdbToken, customFetch);
        }

        const transformedResults = transformTVDBList(rawData);
        const filteredResults = applyServerFilters(transformedResults, clientFilters);

        const totalItems = (searchResult.data as any)?.links?.total_items || filteredResults.length;
        const totalPages = Math.ceil(totalItems / limit);

        return {
            results: filteredResults,
            page,
            total_pages: totalPages,
            total_results: totalItems
        };
    } catch (err) {
        logger.error("Error searching TVDB:", err);
        throw err;
    }
});

// TMDB to TVDB Genre ID Mapping
// Move outside to avoid recreation on every request
const TMDB_TO_TVDB_GENRE: Record<number, number> = {
    28: 19, // Action
    12: 18, // Adventure
    16: 17, // Animation
    35: 15, // Comedy
    80: 14, // Crime
    99: 13, // Documentary
    18: 12, // Drama
    10751: 11, // Family
    14: 10, // Fantasy
    27: 6, // Horror
    10402: 29, // Musical
    9648: 31, // Mystery
    10749: 28, // Romance
    878: 2, // Science Fiction
    10770: 5, // TV Movie -> Mini-Series
    53: 24, // Thriller
    10752: 34, // War
    37: 26, // Western
    10759: 19, // Action & Adventure -> Action
    10765: 2, // Sci-Fi & Fantasy -> Sci-Fi
    10764: 3, // Reality
    10763: 4, // News
    10762: 16, // Kids -> Children
    10767: 23, // Talk -> Talk Show
    10766: 1, // Soap
    10768: 34 // Politics
};

/**
 * Enriches TVDB search results with genre data by fetching extended details.
 * Limits to top 10 results for performance.
 */
async function enrichTVDBResults(items: any[], token: string, fetchImpl: any) {
    const itemsToEnrich = items.slice(0, 10);

    await Promise.all(itemsToEnrich.map(async (item) => {
        const id = item.tvdb_id || item.id;
        if (!id) return;

        try {
            const details = await providers.tvdb.GET(`/series/{id}/extended`, {
                params: { path: { id } },
                headers: { Authorization: `Bearer ${token}` },
                fetch: fetchImpl
            });

            const data = (details.data as any)?.data;
            if (data?.genres) {
                item.genres = data.genres;
            }
        } catch (err) {
            // Fail silently to prevent partial failures from blocking results
        }
    }));
}
