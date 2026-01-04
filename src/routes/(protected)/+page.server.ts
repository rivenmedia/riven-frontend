import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import providers from "$lib/providers";
import { transformTMDBList, type TMDBListItem } from "$lib/providers/parser";
import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("home");

export const load: PageServerLoad = async ({ locals, fetch }) => {
    if (!locals.user || !locals.session) redirect(302, "/auth/login");

    try {
        const { data } = await providers.tmdb.GET("/3/trending/all/{time_window}", {
            fetch: createCustomFetch(fetch),
            params: {
                path: { time_window: "day" },
                query: { language: "en-US" }
            }
        });

        // Filter to only movies and TV shows with backdrops
        const filtered = (data?.results ?? []).filter(
            (item: any) =>
                (item.media_type === "movie" || item.media_type === "tv") &&
                item.backdrop_path
        );

        return {
            nowPlaying: transformTMDBList((filtered as unknown as TMDBListItem[]) ?? [])
        };
    } catch (err) {
        logger.error("Error fetching now playing data:", err);
        return { nowPlaying: [] };
    }
};
