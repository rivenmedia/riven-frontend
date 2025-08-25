import type { RequestHandler } from "./$types";
import { error, redirect, json } from "@sveltejs/kit";
import providers from "$lib/providers";

export const GET: RequestHandler = async ({ params }) => {
    const { indexer, type, id } = params;

    switch (indexer) {
        case "tmdb":
            switch (type) {
                case "movie":
                    throw redirect(307, `/movie/${id}`);
                case "tv": {
                    const showExternalIDs = await providers.tmdb.GET(
                        "/3/tv/{series_id}/external_ids",
                        {
                            params: {
                                path: {
                                    series_id: Number(id)
                                }
                            }
                        }
                    );

                    if (showExternalIDs.error) {
                        throw error(404, "Show not found");
                    }

                    if (showExternalIDs.data.tvdb_id) {
                        throw redirect(307, `/tv/${showExternalIDs.data.tvdb_id}`);
                    } else {
                        throw error(404, "TVDB ID not found for this show");
                    }
                }
                case undefined:
                    throw error(400, "Media type is required for tmdb");
                default:
                    throw error(400, "Invalid media type for tmdb");
            }
    }

    return json({ indexer, type, id });
};
