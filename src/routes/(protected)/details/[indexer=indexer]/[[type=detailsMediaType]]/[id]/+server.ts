import type { RequestHandler } from "./$types";
import { error, redirect, json } from "@sveltejs/kit";
import providers from "$lib/providers";
import { createCustomFetch } from "$lib/custom-fetch";

export const GET: RequestHandler = async ({ params, fetch, locals }) => {
    const { indexer, type, id } = params;
    const customFetch = createCustomFetch(fetch);

    switch (indexer) {
        case "tmdb":
            switch (type) {
                case "movie":
                    throw redirect(307, `/details/media/${id}/movie`);
                case "tv": {
                    try {
                        const showExternalIDs = await providers.tmdb.GET(
                            "/3/tv/{series_id}/external_ids",
                            {
                                params: {
                                    path: {
                                        series_id: Number(id)
                                    }
                                },
                                fetch: customFetch
                            }
                        );

                        if (showExternalIDs.error) {
                            throw error(404, "Show not found");
                        }

                        if (showExternalIDs.data.tvdb_id) {
                            throw redirect(307, `/details/media/${showExternalIDs.data.tvdb_id}/tv`);
                        } else {
                            throw error(404, "TVDB ID not found for this show");
                        }
                    } catch (e) {
                        // Re-throw redirect errors
                        if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 307) {
                            throw e;
                        }
                        console.error("Failed to fetch TMDB external IDs:", e);
                        throw error(503, "Unable to connect to TMDB. Please try again later.");
                    }
                }
                case undefined:
                    throw error(400, "Media type is required for tmdb");
                default:
                    throw error(400, "Invalid media type for tmdb");
            }

        case "tvdb":
            switch (type) {
                case "tv":
                    throw redirect(307, `/details/media/${id}/tv`);
                case undefined:
                    throw error(400, "Media type is required for tvdb");
                default:
                    throw error(400, "Invalid media type for tvdb");
            }

        case "anilist":
            switch (type) {
                case "TV":
                case "TV_SHORT":
                case "MOVIE":
                case "ONA": {
                    const anilistExternalIDsResponse = await customFetch(
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
                            throw redirect(
                                307,
                                `/details/media/${anilistExternalIDs.thetvdb_id}/tv`
                            );
                        } else if (
                            anilistExternalIDs.type === "MOVIE" &&
                            anilistExternalIDs.themoviedb_id
                        ) {
                            throw redirect(
                                307,
                                `/details/media/${anilistExternalIDs.themoviedb_id}/movie`
                            );
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
            break;

        case "riven":
            switch (type) {
                case "tv": {
                    const tvItem = await providers.riven.GET("/api/v1/items/{id}", {
                        params: {
                            path: {
                                id: id
                            },
                            query: {
                                media_type: "tv"
                            }
                        },
                        baseUrl: locals.backendUrl,
                        headers: {
                            "x-api-key": locals.apiKey
                        },
                        fetch: fetch
                    });

                    if (tvItem.error) {
                        throw error(404, "TV item not found");
                    }

                    throw redirect(307, `/details/media/${tvItem.data?.tvdb_id}/tv`);
                }

                case "movie": {
                    const movieItem = await providers.riven.GET("/api/v1/items/{id}", {
                        params: {
                            path: {
                                id: id
                            },
                            query: {
                                media_type: "movie"
                            }
                        },
                        baseUrl: locals.backendUrl,
                        headers: {
                            "x-api-key": locals.apiKey
                        },
                        fetch: fetch
                    });

                    if (movieItem.error) {
                        throw error(404, "Movie item not found");
                    }

                    throw redirect(307, `/details/media/${movieItem.data?.tmdb_id}/movie`);
                }

                default:
                    throw error(400, "Invalid media type for riven");
            }
    }

    return json({ indexer, type, id });
};
