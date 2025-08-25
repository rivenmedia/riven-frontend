import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import providers from "$lib/providers";

export const GET: RequestHandler = async ({ fetch, locals }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    try {
        const nowPlaying = await providers.tmdb.GET("/3/movie/now_playing", {
            params: {
                query: {
                    language: "en-US",
                    page: 1
                }
            },
            fetch
        });

        if (nowPlaying.error) {
            error(500, "Failed to fetch now playing movies");
        }

        return json(nowPlaying.data);
    } catch (err) {
        console.error("Error fetching now playing data:", err);
        error(500, "Failed to fetch now playing data");
    }
};
