import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { TMDB_IMAGE_BASE_URL } from "$lib/providers";
import providers from "$lib/providers";
import { transformTMDBList, type TMDBListItem } from "$lib/providers/parser";

export const GET: RequestHandler = async ({ fetch, params, locals, url }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    const { type } = params;

    if (type !== "movie" && type !== "tv") {
        error(400, "Invalid media type. Must be 'movie' or 'tv'");
    }

    console.log(`Discovering ${type}s with params:`, Object.fromEntries(url.searchParams));

    try {
        // Get all query parameters from the URL
        const queryParams: Record<string, unknown> = {};

        // Convert URL search params to object
        for (const [key, value] of url.searchParams) {
            // Handle numeric parameters
            if (
                key.includes("year") ||
                key.includes("vote_") ||
                key.includes("runtime") ||
                key === "page" ||
                key === "with_networks" ||
                key === "with_release_type"
            ) {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                    queryParams[key] = numValue;
                }
            }
            // Handle boolean parameters
            else if (
                key === "include_adult" ||
                key === "include_video" ||
                key === "include_null_first_air_dates" ||
                key === "screened_theatrically"
            ) {
                queryParams[key] = value === "true" || value === "1";
            }
            // Handle string parameters
            else {
                queryParams[key] = value;
            }
        }

        if (type === "movie") {
            const discover = await providers.tmdb.GET("/3/discover/movie", {
                params: {
                    query: queryParams
                },
                fetch
            });

            if ((discover as any).error) {
                console.error("TMDB API error:", discover.error);
                error(500, "Failed to discover movies");
            }
            const transformedResults = transformTMDBList(
                (discover.data?.results as unknown as TMDBListItem[]) || []
            );

            return json({
                results: transformedResults,
                page: discover.data?.page,
                total_pages: discover.data?.total_pages,
                total_results: discover.data?.total_results
            });
        } else {
            const discover = await providers.tmdb.GET("/3/discover/tv", {
                params: {
                    query: queryParams
                },
                fetch
            });

            if ((discover as any).error) {
                console.error("TMDB API error:", discover.error);
                error(500, "Failed to discover TV shows");
            }
            const transformedResults = transformTMDBList(
                (discover.data?.results as unknown as TMDBListItem[]) || [],
                "tv"
            );

            return json({
                results: transformedResults,
                page: discover.data?.page,
                total_pages: discover.data?.total_pages,
                total_results: discover.data?.total_results
            });
        }
    } catch (err) {
        console.error("Error discovering media:", err);
        error(500, "Failed to discover media");
    }
};
