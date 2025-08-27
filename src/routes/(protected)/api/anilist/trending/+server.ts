import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";

import { getTrending } from "$lib/providers/anilist";

export const GET: RequestHandler = async ({ fetch, locals }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nowPlaying = (await getTrending(fetch)) as any;

        if (nowPlaying && "data" in nowPlaying && nowPlaying.data?.Page?.media) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nowPlaying.data.Page.media = nowPlaying.data.Page.media.map((item: any) => ({
                id: item.id,
                title: item.title.english || item.title.romanji || item.title.native,
                poster_path: item.coverImage.large,
                media_type: item.format,
                year: item.seasonYear
            }));
        }

        return json(nowPlaying);
    } catch (err) {
        console.error("Error fetching anilist trending data:", err);
        error(500, "Failed to fetch anilist trending data");
    }
};
