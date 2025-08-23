import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { TMDB_IMAGE_BASE_URL } from "$lib/providers/tmdb";

import { MediaType, TimeWindow, getTrending } from "$lib/providers/tmdb";

export const GET: RequestHandler = async ({ fetch, params, locals }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }
    const { type, window } = params;

    if (!Object.values(MediaType).includes(type as MediaType)) {
        error(400, "Invalid media type");
    }

    if (!Object.values(TimeWindow).includes(window as TimeWindow)) {
        error(400, "Invalid time window");
    }

    console.log(`Fetching trending ${type} for window ${window}`);

    try {
        const trending = await getTrending(fetch, {
            mediaType: type as MediaType,
            timeWindow: window as TimeWindow
        });

        if ("results" in trending) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            trending.results = trending.results.map((item: any) => ({
                id: item.id,
                title: item.title || item.name || item.original_title || item.original_name,
                poster_path: `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`,
                media_type: type === "movie" ? "Movie" : type === "tv" ? "TV" : item.media_type,
                year: item.release_date
                    ? new Date(item.release_date).getFullYear()
                    : item.first_air_date
                      ? new Date(item.first_air_date).getFullYear()
                      : "N/A"
            }));
        }

        return json(trending);
    } catch (err) {
        console.error("Error fetching trending data:", err);
        error(500, "Failed to fetch trending data");
    }
};
