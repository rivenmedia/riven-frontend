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

        case "anilist":
            switch (type) {
                case "TV":
                case "TV_SHORT":
                case "ONA": {
                    const anilistExternalIDsResponse = await fetch(
                        `https://api.ani.zip/v1/mappings?anilist_id=${id}`,
                        {
                            headers: {
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    if (!anilistExternalIDsResponse.ok) {
                        return json({
                            error: "Failed to fetch external IDs from AniList",
                            indexer,
                            type,
                            id
                        });
                    }

                    const anilistExternalIDs = await anilistExternalIDsResponse.json();

                    if ("type" in anilistExternalIDs) {
                        if (anilistExternalIDs.type === "TV" && anilistExternalIDs.thetvdb_id) {
                            throw redirect(307, `/tv/${anilistExternalIDs.thetvdb_id}`);
                        } else if (
                            anilistExternalIDs.type === "MOVIE" &&
                            anilistExternalIDs.themoviedb_id
                        ) {
                            throw redirect(307, `/movie/${anilistExternalIDs.themoviedb_id}`);
                        } else {
                            return json({
                                error: "No suitable external ID found",
                                indexer,
                                type,
                                id,
                                data: anilistExternalIDs
                            });
                        }
                    }
                }
            }
    }

    return json({ indexer, type, id });
};
