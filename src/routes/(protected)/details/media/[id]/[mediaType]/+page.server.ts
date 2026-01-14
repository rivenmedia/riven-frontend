import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import type {
    TMDBMovieDetailsExtended,
    ParsedMovieDetails,
    ParsedShowDetails,
    TVDBBaseItem
} from "$lib/providers/parser";
import type { RivenMediaItem } from "$lib/types/riven";
import { error } from "@sveltejs/kit";
import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";
import { resolveId } from "$lib/services/resolver";

const logger = createScopedLogger("media-details");

async function normalizeFetch<T>(p: Promise<T>): Promise<
    | T
    | {
          data: null;
          error: {
              status: number;
              message: string;
          };
      }
> {
    try {
        return await p;
    } catch (e) {
        return {
            data: null,
            error: {
                status: 503,
                message: e instanceof Error ? e.message : String(e)
            }
        };
    }
}

/**
 * Validates that a TVDB API response contains required fields for parsing.
 * Throws if validation fails, otherwise returns the typed value.
 */
function assertTVDBShowData(data: unknown): TVDBBaseItem {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid TVDB response: data is not an object");
    }
    const obj = data as Record<string, unknown>;
    if (typeof obj.id !== "number") {
        throw new Error("Invalid TVDB response: missing or invalid 'id' field");
    }
    if (typeof obj.name !== "string") {
        throw new Error("Invalid TVDB response: missing or invalid 'name' field");
    }
    return data as TVDBBaseItem;
}

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

        const traktSlug = (
            traktSlugResp[0] as unknown as Record<
                string,
                { ids: { slug: string } | undefined } | undefined
            >
        )[mediaType]?.ids?.slug;

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
                    }
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

export const load = (async ({ fetch, params, cookies, locals, url }) => {
    const { id, mediaType } = params;
    const customFetch = createCustomFetch(fetch);

    try {
        if (mediaType !== "movie" && mediaType !== "tv") {
            error(400, "Invalid media type");
        }

        if (!id || isNaN(Number(id))) {
            error(400, "Invalid ID");
        }

        if (mediaType === "movie") {
            // Fetch Riven data in parallel with other requests (non-blocking)
            const rivenPromise = providers.riven
                .GET("/api/v1/items/{id}", {
                    params: {
                        path: { id },
                        query: { media_type: mediaType, extended: true }
                    },
                    baseUrl: locals.backendUrl,
                    headers: { "x-api-key": locals.apiKey },
                    fetch
                })
                .catch(() => null);

            // Fetch TMDB details and Trakt data in parallel
            const [tmdbResult, traktResult, rivenData] = await Promise.all([
                normalizeFetch(
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
                    })
                ),
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

            // Check if the ID is already a TVDB ID (passed via query param from library)
            const indexerParam = url.searchParams.get("indexer");
            const isAlreadyTvdbId = indexerParam === "tvdb";

            let tvdbId: number;

            if (isAlreadyTvdbId) {
                // ID is already a TVDB ID, no resolution needed
                tvdbId = Number(id);
            } else {
                // Resolve TMDB ID to TVDB ID
                const resolved = await normalizeFetch(
                    resolveId({
                        from: "tmdb",
                        to: "tvdb",
                        id: Number(id),
                        mediaType: "tv",
                        tvdbToken,
                        customFetch
                    })
                );

                if (!resolved || !resolved.resolved) {
                    logger.error(`Failed to resolve TMDB ID ${id} to TVDB ID`);
                    error(502, "Unable to resolve TV show ID. Please try again later.");
                }

                tvdbId = Number(resolved.id);
            }

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

            // Fetch TVDB details (episodes + translations separately), Trakt data, and Riven data in parallel
            const [tvdbEpisodesResult, tvdbTranslationsResult, traktResult, rivenData] =
                await Promise.all([
                    normalizeFetch(
                        providers.tvdb.GET(`/series/{id}/extended`, {
                            params: {
                                path: { id: tvdbId },
                                query: { meta: "episodes" }
                            },
                            headers: { Authorization: `Bearer ${tvdbToken}` },
                            fetch: customFetch
                        })
                    ),
                    normalizeFetch(
                        providers.tvdb.GET(`/series/{id}/extended`, {
                            params: {
                                path: { id: tvdbId },
                                query: { meta: "translations" }
                            },
                            headers: { Authorization: `Bearer ${tvdbToken}` },
                            fetch: customFetch
                        })
                    ),
                    getTraktData(customFetch, String(tvdbId), false),
                    rivenPromise
                ]);

            const { data: episodesData, error: episodesError } = tvdbEpisodesResult;
            const { data: translationsData, error: translationsError } = tvdbTranslationsResult;

            // Use episodes result as base
            const detailsError = episodesError;
            const details = episodesData;

            // Log translation error if present, but don't fail the request
            if (translationsError) {
                logger.error(
                    `TVDB translations fetch failed for ID ${tvdbId} (Original: ${id}):`,
                    translationsError
                );
            }

            // Merge translations into the details if both requests succeeded
            if (details?.data && translationsData?.data?.translations) {
                details.data.translations = translationsData.data.translations;
            }

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
                    const { data: engEpisodesData, error: engEpisodesError } = await normalizeFetch(
                        providers.tvdb.GET("/series/{id}/episodes/{season-type}/{lang}", {
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
                        })
                    );

                    // The generated types for this endpoint are incorrect (expects data.series.episodes),
                    // but the actual API returns data.episodes.
                    type EpisodeType = ParsedShowDetails["episodes"][number];
                    interface EngEpisodesResponse {
                        data: {
                            episodes: EpisodeType[];
                        };
                    }

                    if (!engEpisodesError && engEpisodesData && engEpisodesData.data) {
                        const rawData = engEpisodesData as unknown as EngEpisodesResponse;
                        if (rawData.data?.episodes) {
                            // Cast to unknown first to avoid direct overlap error, then to expected structure
                            (details.data as unknown as { episodes: EpisodeType[] }).episodes =
                                rawData.data.episodes;
                        }
                    }
                } catch (err) {
                    logger.warn("Failed to fetch English episodes fallback:", err);
                    // Don't fail the page load if this optional fetch fails
                }
            }

            const validatedData = assertTVDBShowData(details.data);
            const parsedDetails = providers.parser.parseTVDBShowDetails(
                validatedData,
                traktResult.traktRecs
            );

            return {
                riven: rivenData?.data as RivenMediaItem | undefined,
                mediaDetails: {
                    type: "tv" as const,
                    details: parsedDetails as ParsedShowDetails
                } as MediaDetails
            };
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
