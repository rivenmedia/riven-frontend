import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import providers from "$lib/providers";
import { transformTMDBList, type TMDBListItem } from "$lib/providers/parser";

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

        const transformedResults = transformTMDBList(
            (nowPlaying.data?.results as unknown as TMDBListItem[]) ?? null
        );

        return json({ results: transformedResults });
    } catch (err) {
        console.error("Error fetching now playing data:", err);
        error(500, "Failed to fetch now playing data");
    }
};
