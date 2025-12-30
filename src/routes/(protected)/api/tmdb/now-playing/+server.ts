import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import providers from "$lib/providers";
import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("tmdb-now-playing");

export const GET: RequestHandler = async ({ fetch, locals }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    const customFetch = createCustomFetch(fetch);

    try {
        const nowPlaying = await providers.tmdb.GET("/3/movie/now_playing", {
            params: {
                query: {
                    language: "en-US",
                    page: 1
                }
            },
            fetch: customFetch
        });

        if (nowPlaying.error) {
            error(500, "Failed to fetch now playing movies");
        }

        return json(nowPlaying.data);
    } catch (err) {
        logger.error("Error fetching now playing data:", err);
        error(500, "Failed to fetch now playing data");
    }
};
