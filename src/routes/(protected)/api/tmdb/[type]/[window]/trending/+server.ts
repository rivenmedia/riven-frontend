import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { TMDB_IMAGE_BASE_URL, TMDBMediaType, TMDBTimeWindow } from "$lib/providers";
import providers from "$lib/providers";
import { transformTMDBList } from "$lib/providers/parser";

export const GET: RequestHandler = async ({ fetch, params, locals, url }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }
    const { type, window } = params;
    const page = parseInt(url.searchParams.get("page") || "1");

    if (!Object.values(TMDBMediaType).includes(type as TMDBMediaType)) {
        error(400, "Invalid media type");
    }

    if (!Object.values(TMDBTimeWindow).includes(window as TMDBTimeWindow)) {
        error(400, "Invalid time window");
    }

    console.log(`Fetching trending ${type} for window ${window}`);

    try {
        if (type === "movie") {
            const trending = await providers.tmdb.GET("/3/trending/movie/{time_window}", {
                params: {
                    path: {
                        time_window: window as TMDBTimeWindow
                    },
                    query: {
                        page
                    }
                },
                fetch
            });

            if (trending.error) {
                error(500, "Failed to fetch trending movies");
            }

            const transformedResults = transformTMDBList(trending.data.results ?? null);

            return json({ results: transformedResults });
        } else if (type === "tv") {
            const trending = await providers.tmdb.GET("/3/trending/tv/{time_window}", {
                params: {
                    path: {
                        time_window: window as TMDBTimeWindow
                    },
                    query: {
                        page
                    }
                },
                fetch
            });

            if (trending.error) {
                error(500, "Failed to fetch trending TV shows");
            }

            const transformedResults = trending.data.results?.map((item) => ({
                id: item.id,
                title: item.name || item.original_name,
                poster_path: item.poster_path
                    ? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`
                    : null,
                media_type: "TV",
                year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : "N/A"
            }));

            return json({ results: transformedResults });
        }

        error(400, "Invalid media type");
    } catch (err) {
        console.error("Error fetching trending data:", err);
        error(500, "Failed to fetch trending data");
    }
};
