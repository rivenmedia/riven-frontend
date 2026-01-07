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
type SearchPersonQuery = paths["/3/search/person"]["get"]["parameters"]["query"];
type SearchCompanyQuery = paths["/3/search/company"]["get"]["parameters"]["query"];

export const GET: RequestHandler = async ({ fetch, params, locals, url }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    const { type } = params;
    const customFetch = createCustomFetch(fetch);

    if (type !== "movie" && type !== "tv" && type !== "person" && type !== "company") {
        error(400, "Invalid media type. Must be 'movie', 'tv', 'person', or 'company'");
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

        // Call the appropriate typed endpoint
        const fetchResults = async () => {
            const routeKey = `${type}-${isSearch ? "search" : "discover"}` as const;

            const ROUTE_MAP = {
                "movie-search": { endpoint: "/3/search/movie", queryKey: "searchMovieQuery" },
                "movie-discover": { endpoint: "/3/discover/movie", queryKey: "discoverMovieQuery" },
                "tv-search": { endpoint: "/3/search/tv", queryKey: "searchTVQuery" },
                "tv-discover": { endpoint: "/3/discover/tv", queryKey: "discoverTVQuery" },
                "person-search": { endpoint: "/3/search/person", queryKey: "searchPersonQuery" },
                // Person discover doesn't exist, fallback to search
                "person-discover": { endpoint: "/3/search/person", queryKey: "searchPersonQuery" },
                "company-search": { endpoint: "/3/search/company", queryKey: "searchCompanyQuery" },
                // Company discover doesn't exist, fallback to search
                "company-discover": { endpoint: "/3/search/company", queryKey: "searchCompanyQuery" }
            } as const;

            const route = ROUTE_MAP[routeKey as keyof typeof ROUTE_MAP];
            const query = { ...parsed[route.queryKey] };

            logger.debug(`Route: ${routeKey}, endpoint: ${route.endpoint}, query:`, query);

            if (routeKey === "tv-discover") {
                const q = query as DiscoverTVQuery;
                if (typeof q.sort_by === "string" && q.sort_by.includes("primary_release_date")) {
                    // TMDB uses 'first_air_date' for TV shows, not 'primary_release_date'
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (query as any).sort_by = q.sort_by.replace(
                        "primary_release_date",
                        "first_air_date"
                    );
                }
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return providers.tmdb.GET(route.endpoint as any, {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                params: { query: query as any },
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
    searchPersonQuery: SearchPersonQuery;
    searchCompanyQuery: SearchCompanyQuery;
}

const BOOLEAN_KEYS = new Set([
    "include_adult",
    "include_video",
    "include_null_first_air_dates",
    "screened_theatrically"
]);

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
            const trimmed = value.trim();
            if (trimmed !== "") {
                const n = Number(trimmed);
                if (!isNaN(n)) queryObj[key] = n;
            }
        } else {
            queryObj[key] = value;
        }
    }

    // All query objects share the same params - TMDB ignores irrelevant ones
    return {
        searchMovieQuery: queryObj as SearchMovieQuery,
        discoverMovieQuery: queryObj as DiscoverMovieQuery,
        searchTVQuery: queryObj as SearchTVQuery,
        discoverTVQuery: queryObj as DiscoverTVQuery,
        searchPersonQuery: queryObj as SearchPersonQuery,
        searchCompanyQuery: queryObj as SearchCompanyQuery
    };
}
