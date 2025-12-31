import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import type {
    TMDBMovieDetailsExtended,
    ParsedMovieDetails,
    ParsedShowDetails
} from "$lib/providers/parser";
import type { RivenMediaItem } from "$lib/types/riven";
import { error } from "@sveltejs/kit";
import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";
import { resolveId } from "$lib/services/resolver";

const logger = createScopedLogger("media-details");

export type MediaDetails =
    | { type: "movie"; details: ParsedMovieDetails }
    | { type: "tv"; details: ParsedShowDetails };

async function getTraktData(fetch: typeof globalThis.fetch, mediaId: string, isMovie: boolean) {
    const idType = isMovie ? "tmdb" : "tvdb";
    const mediaType = isMovie ? "movie" : "show";
    const endpointPrefix = isMovie ? "movies" : "shows";

    try {
        // First get the Trakt slug
        const { data: traktSlugResp, error: traktSlugError } = await providers.trakt.GET(
            "/search/{id_type}/{id}",
            {
                params: {
                    path: {
                        id_type: idType,
                        id: mediaId
                    },
                    query: {
                        type: mediaType
                    }
                },
                fetch: fetch
            }
        );

        if (traktSlugError || !traktSlugResp || traktSlugResp.length === 0) {
            return { traktSlug: null, traktRecs: null };
        }

        const traktSlug = (traktSlugResp[0] as any)[mediaType]?.ids?.slug;

        if (!traktSlug) {
            return { traktSlug: null, traktRecs: null };
        }

        // Then get recommendations
        const { data: traktRecsData, error: traktRecsError } = await providers.trakt.GET(
            `/${endpointPrefix}/{id}/related`,
            {
                params: {
                    path: {
                        id: traktSlug
                    },
                    query: {
                        extended: "images"
                    } as any
                },
                fetch: fetch
            }
        );

        return {
            traktSlug,
            traktRecs: !traktRecsError && traktRecsData ? traktRecsData : null
        };
    } catch (err) {
        // Return empty data if Trakt fails - don't block the page load
        logger.error(`Trakt fetch failed for ${mediaType} id=${mediaId}:`, err);
        return { traktSlug: null, traktRecs: null };
    }
}

export const load = (async ({ fetch, params, cookies, locals }) => {
    const { id, mediaType } = params;
    const customFetch = createCustomFetch(fetch);

    try {
        if (mediaType !== "movie" && mediaType !== "tv") {
            error(400, "Invalid media type");
        }

        if (!id || isNaN(Number(id))) {
            error(400, "Invalid ID");
        }

        // Fetch Riven data in parallel with other requests (non-blocking)
        const rivenPromise = providers.riven
            .GET("/api/v1/items/{id}", {
                params: {
                    path: {
                        id: id
                    },
                    query: {
                        media_type: mediaType,
                        extended: true
                    }
                },
                baseUrl: locals.backendUrl,
                headers: {
                    "x-api-key": locals.apiKey
                },
                fetch: fetch
            })
            .catch(() => null);

        if (mediaType === "movie") {
            // Fetch TMDB details and Trakt data in parallel
            const [tmdbResult, traktResult, rivenData] = await Promise.all([
                providers.tmdb.GET(`/3/movie/{movie_id}`, {
                    params: {
                        path: {
                            movie_id: Number(id)
                        },
                        query: {
                            append_to_response:
                                "external_ids,images,recommendations,similar,videos,credits,release_dates"
                        }
                    },
                    fetch: customFetch
                }),
                getTraktData(customFetch, id, true),
                rivenPromise
            ]);

            const { data: details, error: detailsError } = tmdbResult;

            if (detailsError) {
                logger.error("TMDB movie details fetch failed:", detailsError);
                error(503, "Unable to connect to TMDB. Please try again later.");
            }

            const parsedDetails = providers.parser.parseTMDBMovieDetails(
                details as TMDBMovieDetailsExtended,
                traktResult.traktRecs
            );

            return {
                riven: rivenData?.data as RivenMediaItem | undefined,
                mediaDetails: {
                    type: "movie" as const,
                    details: parsedDetails as ParsedMovieDetails
                } as MediaDetails
            };
        } else if (mediaType === "tv") {
            const tvdbToken = cookies.get("tvdb_cookie") || "";

            // Resolve TMDB ID to TVDB ID
            const resolved = await resolveId({
                from: "tmdb",
                to: "tvdb",
                id: Number(id),
                mediaType: "tv",
                tvdbToken,
                customFetch
            });
            const tvdbId = Number(resolved.id);

            // Fetch Riven data based on TVDB ID
            const rivenPromise = providers.riven
                .GET("/api/v1/items/{id}", {
                    params: {
                        path: { id: String(tvdbId) },
                        query: { media_type: mediaType, extended: true }
                    },
                    baseUrl: locals.backendUrl,
                    headers: { "x-api-key": locals.apiKey },
                    fetch: fetch
                })
                .catch(() => null);

            // Fetch TVDB details, Trakt data (using TVDB ID), and Riven data in parallel
            const [tvdbResult, traktResult, rivenData] = await Promise.all([
                providers.tvdb.GET(`/series/{id}/extended`, {
                    params: {
                        path: {
                            id: tvdbId
                        },
                        query: {
                            // @ts-expect-error schema says only one meta allowed but multiple are valid
                            meta: "episodes,translations"
                        }
                    },
                    headers: {
                        Authorization: `Bearer ${tvdbToken}`
                    },
                    fetch: customFetch
                }),
                getTraktData(customFetch, String(tvdbId), false),
                rivenPromise
            ]);

            const { data: details, error: detailsError } = tvdbResult;

            if (detailsError) {
                logger.error(
                    `TVDB show details fetch failed for ID ${tvdbId} (Original: ${id}):`,
                    detailsError
                );
                error(503, "Unable to connect to TVDB. Please try again later.");
            }

            if (!details) {
                error(500, "Failed to fetch TV show details");
            }

            // Check if we need English episodes (for Asian content) - this is a follow-up request
            const languagesToCheck = ["jpn", "kor", "chi", "zho"];

            if (
                details?.data &&
                details?.data.originalLanguage &&
                languagesToCheck.includes(details.data.originalLanguage)
            ) {
                try {
                    const { data: engEpisodesData, error: engEpisodesError } =
                        await providers.tvdb.GET("/series/{id}/episodes/{season-type}/{lang}", {
                            params: {
                                path: {
                                    id: tvdbId,
                                    "season-type": "official",
                                    lang: "eng"
                                },
                                query: {
                                    page: 0
                                }
                            },
                            headers: {
                                Authorization: `Bearer ${tvdbToken}`
                            },
                            fetch: customFetch
                        });

                    if (
                        !engEpisodesError &&
                        engEpisodesData &&
                        engEpisodesData.data &&
                        // @ts-expect-error it says data.series.episodes but it's actually data.episodes
                        engEpisodesData.data.episodes
                    ) {
                        // @ts-expect-error it says data.series.episodes but it's actually data.episodes
                        details.data.episodes = engEpisodesData.data.episodes;
                    }
                } catch (err) {
                    logger.warn("Failed to fetch English episodes fallback:", err);
                    // Don't fail the page load if this optional fetch fails
                }
            }

            const parsedDetails = providers.parser.parseTVDBShowDetails(
                // Type assertion needed: TVDB extended response differs from TVDBBaseItem in generated types
                details.data as unknown as Parameters<
                    typeof providers.parser.parseTVDBShowDetails
                >[0],
                traktResult.traktRecs
            );

            return {
                riven: rivenData?.data as RivenMediaItem | undefined,
                mediaDetails: {
                    type: "tv" as const,
                    details: parsedDetails as ParsedShowDetails
                } as MediaDetails
            };
        } else {
            error(400, "Invalid media type");
        }
    } catch (err) {
        // Re-throw SvelteKit errors (like 400, 503) so they render the error page
        if (err && typeof err === "object" && "status" in err && "body" in err) {
            throw err;
        }
        logger.error("Unexpected error loading media details:", err);
        throw error(500, "Internal Server Error loading media details");
    }
}) satisfies PageServerLoad;
