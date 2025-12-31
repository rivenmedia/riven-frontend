import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { TMDB_IMAGE_BASE_URL } from "$lib/providers";
import providers from "$lib/providers";
import { transformTMDBList, type TMDBListItem } from "$lib/providers/parser";
import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("tmdb-search");

/**
 * Apply server-side filters to TMDB results
 */
function applyServerFilters(items: any[], filters: Record<string, any>): any[] {
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
                // All genres must be present
                if (!requiredGenres.every((genreId) => item.genre_ids?.includes(genreId))) {
                    return false;
                }
            } else {
                // At least one genre must be present
                if (!requiredGenres.some((genreId) => item.genre_ids?.includes(genreId))) {
                    return false;
                }
            }
        }

        if (filters.without_genres) {
            const excludedGenres = String(filters.without_genres)
                .split(/[,|]/)
                .map((g) => Number(g.trim()));

            // None of the excluded genres should be present
            if (excludedGenres.some((genreId) => item.genre_ids?.includes(genreId))) {
                return false;
            }
        }

        // Vote average filtering
        if (filters["vote_average.gte"] !== undefined) {
            if (!item.vote_average || item.vote_average < Number(filters["vote_average.gte"])) {
                return false;
            }
        }

        if (filters["vote_average.lte"] !== undefined) {
            if (!item.vote_average || item.vote_average > Number(filters["vote_average.lte"])) {
                return false;
            }
        }

        // Vote count filtering
        if (filters["vote_count.gte"] !== undefined) {
            if (!item.vote_count || item.vote_count < Number(filters["vote_count.gte"])) {
                return false;
            }
        }

        if (filters["vote_count.lte"] !== undefined) {
            if (!item.vote_count || item.vote_count > Number(filters["vote_count.lte"])) {
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
    // logger.info(`Searching ${type} with mode: ${searchMode}`);

    try {
        const { queryParams, clientFilters } = parseFilters(url.searchParams);

        const endpoint = getEndpoint(type, searchMode);

        // Log query only for search mode to catch issues
        // if (searchMode !== "discover") {
        //    logger.debug("Search params:", queryParams);
        // }

        const apiResult = await providers.tmdb.GET(endpoint as any, {
            params: { query: queryParams as any },
            fetch: customFetch
        });

        if ((apiResult as any).error) {
            logger.error(`TMDB API error (${endpoint}):`, (apiResult as any).error);
            error(500, `Failed to fetch ${type}s`);
        }

        const rawResults = (apiResult.data?.results as unknown as TMDBListItem[]) || [];
        const filteredResults = applyServerFilters(rawResults, clientFilters);
        const transformedResults = transformTMDBList(filteredResults, type === "tv" ? "tv" : undefined);

        return json({
            results: transformedResults,
            page: apiResult.data?.page || 1,
            total_pages: apiResult.data?.total_pages || 1,
            total_results: apiResult.data?.total_results || 0
        });

    } catch (err) {
        logger.error("Error searching/discovering media:", err);
        error(500, "Failed to search/discover media");
    }
};

function getEndpoint(type: "movie" | "tv", mode: string) {
    const isSearch = mode === "search" || mode === "hybrid";
    if (type === "movie") {
        return isSearch ? "/3/search/movie" : "/3/discover/movie";
    } else {
        return isSearch ? "/3/search/tv" : "/3/discover/tv";
    }
}

function parseFilters(searchParams: URLSearchParams) {
    const queryParams: Record<string, any> = {};
    const clientFilters: Record<string, any> = {};

    const CLIENT_FILTERABLE = new Set([
        "with_genres",
        "without_genres",
        "vote_average.gte",
        "vote_average.lte",
        "vote_count.gte",
        "vote_count.lte"
    ]);

    for (const [key, value] of searchParams) {
        if (key === "searchMode") continue;

        // Numeric parsing helper
        const parseNum = (v: string) => {
            const n = Number(v);
            return isNaN(n) ? undefined : n;
        };

        if (CLIENT_FILTERABLE.has(key)) {
            // Client-side filters
            if (key.includes("vote_")) {
                const n = parseNum(value);
                if (n !== undefined) clientFilters[key] = n;
            } else {
                clientFilters[key] = value;
            }
        } else {
            // Query Params
            if (
                ["year", "page", "with_networks", "with_release_type"].some(k => key.includes(k)) ||
                key.includes("vote_") ||
                key.includes("runtime")
            ) {
                const n = parseNum(value);
                if (n !== undefined) queryParams[key] = n;
            } else if (
                ["include_adult", "include_video", "include_null_first_air_dates", "screened_theatrically"].includes(key)
            ) {
                queryParams[key] = value === "true" || value === "1";
            } else {
                queryParams[key] = value;
            }
        }
    }
    return { queryParams, clientFilters };
}
