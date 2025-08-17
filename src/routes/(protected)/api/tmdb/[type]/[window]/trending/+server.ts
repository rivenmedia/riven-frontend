import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";

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

        return json(trending);
    } catch (err) {
        console.error("Error fetching trending data:", err);
        error(500, "Failed to fetch trending data");
    }
};
