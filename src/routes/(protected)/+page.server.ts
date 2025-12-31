import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import providers from "$lib/providers";
import { transformTMDBList, type TMDBListItem } from "$lib/providers/parser";
import { createCustomFetch } from "$lib/custom-fetch";

export const load: PageServerLoad = async ({ locals, fetch }) => {
    if (!locals.user || !locals.session) redirect(302, "/auth/login");

    try {
        const { data } = await providers.tmdb.GET("/3/movie/now_playing", {
            fetch: createCustomFetch(fetch),
            params: { query: { language: "en-US", page: 1 } }
        });

        return {
            nowPlaying: transformTMDBList((data?.results as unknown as TMDBListItem[]) ?? [])
        };
    } catch (err) {
        console.error("Error fetching now playing data:", err);
        return { nowPlaying: [] };
    }
};
