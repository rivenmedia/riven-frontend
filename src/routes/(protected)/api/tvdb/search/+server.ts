import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import providers from "$lib/providers";
import * as dateUtils from "$lib/utils/date";

/**
 * Apply server-side filters to TVDB results
 */
function applyServerFilters(items: any[], filters: Record<string, any>): any[] {
    if (!filters || Object.keys(filters).length === 0) {
        return items;
    }

    return items.filter((item) => {
        // Vote average filtering (if TVDB provides ratings)
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
        const dateField = item.first_air_date;
        if (dateField) {
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

export const GET: RequestHandler = async ({ fetch, locals, url, cookies }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    // Extract all TVDB search parameters from URL
    const query = url.searchParams.get("query") || url.searchParams.get("q");
    const type = url.searchParams.get("type") || "series";
    const year = url.searchParams.get("year");
    const company = url.searchParams.get("company");
    const country = url.searchParams.get("country");
    const director = url.searchParams.get("director");
    const language = url.searchParams.get("language");
    const network = url.searchParams.get("network");
    const remote_id = url.searchParams.get("remote_id");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    // Extract client-side filters
    const clientFilters: Record<string, any> = {};
    const CLIENT_FILTERABLE = new Set([
        "vote_average.gte",
        "vote_average.lte",
        "vote_count.gte",
        "vote_count.lte",
        "air_date.gte",
        "air_date.lte",
        "first_air_date.gte",
        "first_air_date.lte"
    ]);

    for (const [key, value] of url.searchParams) {
        if (CLIENT_FILTERABLE.has(key)) {
            if (key.includes("vote_")) {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                    clientFilters[key] = numValue;
                }
            } else {
                clientFilters[key] = value;
            }
        }
    }

    if (!query && !remote_id) {
        error(400, "Search query or remote_id is required");
    }

    // Get TVDB token from cookie (set by hooks.server.ts)
    const tvdbToken = cookies.get("tvdb_cookie");

    if (!tvdbToken) {
        error(500, "TVDB authentication token not available");
    }

    try {
        // Build query parameters - only include defined values
        const searchParams: Record<string, string | number> = {
            type: type,
            limit: limit,
            offset: offset
        };

        if (query) searchParams.query = query;
        if (year) searchParams.year = parseInt(year);
        if (company) searchParams.company = company;
        if (country) searchParams.country = country;
        if (director) searchParams.director = director;
        if (language) searchParams.language = language;
        if (network) searchParams.network = network;
        if (remote_id) searchParams.remote_id = remote_id;

        // Make search request to TVDB using the provider client
        const searchResult = await providers.tvdb.GET("/search", {
            params: {
                query: searchParams as any
            },
            headers: {
                Authorization: `Bearer ${tvdbToken}`
            },
            fetch
        });

        if (searchResult.error) {
            console.error("TVDB search error:", searchResult.error);
            error(500, "Failed to search TVDB");
        }

        const transformedResults = (searchResult.data?.data || [])
            .filter((item: any) => item.type === "series")
            .map((item: any) => ({
                id: item.tvdb_id,
                title: item.translations?.eng || item.name || "Unknown",
                poster_path: item.image_url || null,
                media_type: "tv",
                year:
                    item.year ||
                    dateUtils.getYearFromISO(item.first_air_time) ??
                    "N/A",
                vote_average: null,
                vote_count: null,
                overview: item.overview || null,
                first_air_date: item.first_air_time || null,
                indexer: "tvdb"
            }));

        // Apply server-side filters
        const filteredResults = applyServerFilters(transformedResults, clientFilters);

        // Calculate pagination info
        const totalItems = searchResult.data?.links?.total_items || filteredResults.length;
        const totalPages = Math.ceil(totalItems / limit);

        return json({
            results: filteredResults,
            page: page,
            total_pages: totalPages,
            total_results: totalItems
        });
    } catch (err) {
        console.error("Error searching TVDB:", err);
        error(500, err instanceof Error ? err.message : "Failed to search TVDB");
    }
};
