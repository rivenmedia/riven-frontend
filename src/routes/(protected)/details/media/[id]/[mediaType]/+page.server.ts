import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import type {
    TMDBMovieDetailsExtended,
    ParsedMovieDetails,
    ParsedShowDetails,
    TVDBBaseItem
} from "$lib/providers/parser";
import type { RivenMediaItem } from "$lib/types/riven";
import { error, redirect } from "@sveltejs/kit";
import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";
import { resolveId, type ResolveResult } from "$lib/services/resolver";
import { calculateSimilarity } from "$lib/utils/string";
import * as dateUtils from "$lib/utils/date";

const logger = createScopedLogger("media-details");

/**
 * Cache for failed ID resolutions to prevent hitting APIs repeatedly for unresolvable content.
 * Keyed by "mediaType:id" (e.g., "tv:12345"). Stores expiry timestamp.
 * Note: This is in-memory and per-process.
 */
const failedResolutionCache = new Map<string, number>();

async function fetchWithStatus<T>(p: Promise<T>): Promise<{
    data: any | null;
    error: any | null;
    status: number;
}> {
    try {
        const result = (await p) as any;
        // openapi-fetch returns { data, error, response }
        if (result && typeof result === "object" && "response" in result) {
            return {
                data: result.data || null,
                error: result.error || null,
                status: result.response?.status || 200
            };
        }
        // Fallback for non-openapi-fetch promises
        return {
            data: result,
            error: null,
            status: 200
        };
    } catch (e: any) {
        // Capture status from error object if present, otherwise 0 for network/DNS errors
        return {
            data: null,
            error: e,
            status: e?.status || 0
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
                fetchWithStatus(
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

            const { data: details, error: detailsError, status: detailsStatus } = tmdbResult;

            if (detailsError) {
                logger.error("TMDB movie details fetch failed:", detailsError);
                if (detailsStatus === 404) {
                    error(404, "The requested movie could not be found.");
                }
                error(
                    503,
                    "Something went wrong while fetching movie details. Please try again later."
                );
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
                const { data: resolved, error: resolveError } = await fetchWithStatus(
                    resolveId({
                        from: "tmdb",
                        to: "tvdb",
                        id: Number(id),
                        mediaType: "tv",
                        tvdbToken,
                        customFetch
                    })
                );

                if (resolveError || !resolved?.resolved) {
                    logger.error(`Failed to resolve TMDB ID ${id} to TVDB ID`, resolveError);
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
                    fetchWithStatus(
                        providers.tvdb.GET(`/series/{id}/extended`, {
                            params: {
                                path: { id: tvdbId },
                                query: { meta: "episodes" }
                            },
                            headers: { Authorization: `Bearer ${tvdbToken}` },
                            fetch: customFetch
                        })
                    ),
                    fetchWithStatus(
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

            const {
                data: episodesData,
                error: episodesError,
                status: episodesStatus
            } = tvdbEpisodesResult;
            const { data: translationsData, error: translationsError } = tvdbTranslationsResult;

            // HAIL MARY Fallback: if indexer=tvdb failed with 404, the ID might be for an Episode, Season, or actually a TMDB ID
            if (episodesStatus === 404 && isAlreadyTvdbId) {
                const cacheKey = `tv:${id}`;
                const cachedExpiry = failedResolutionCache.get(cacheKey);
                if (cachedExpiry && Date.now() < cachedExpiry) {
                    logger.info(`Hail Mary skipped (cached failure) for TVDB ID: ${id}`);
                    error(404, "The requested TV show could not be found.");
                }

                logger.info(`Initiating Hail Mary resolution for failing TVDB ID: ${id}`);

                // 1. Try resolving as an Episode ID
                try {
                    const { data: episodeData } = await providers.tvdb.GET("/episodes/{id}", {
                        params: { path: { id: Number(id) } },
                        headers: { Authorization: `Bearer ${tvdbToken}` },
                        fetch: customFetch
                    });

                    if (episodeData?.data?.seriesId) {
                        logger.info(
                            `Resolved TVDB Episode ID ${id} to Series ID ${episodeData.data.seriesId}`
                        );
                        const newUrl = new URL(url);
                        newUrl.pathname = `/details/media/${episodeData.data.seriesId}/tv`;
                        newUrl.searchParams.delete("indexer"); // new URL(url) copies existing params; strip indexer for clean redirect
                        // Add/Update season and episode params if they aren't already there (or let them be overwritten)
                        if (episodeData.data.seasonNumber != null)
                            newUrl.searchParams.set(
                                "season",
                                String(episodeData.data.seasonNumber)
                            );
                        if (episodeData.data.number != null)
                            newUrl.searchParams.set("episode", String(episodeData.data.number));
                        throw redirect(307, newUrl.pathname + newUrl.search);
                    }
                } catch (e: any) {
                    if (e?.status === 307 || e?.status === 308) throw e;
                }

                // 2. Try resolving as a Season ID
                try {
                    const { data: seasonData } = await providers.tvdb.GET("/seasons/{id}", {
                        params: { path: { id: Number(id) } },
                        headers: { Authorization: `Bearer ${tvdbToken}` },
                        fetch: customFetch
                    });

                    if (seasonData?.data?.seriesId) {
                        logger.info(
                            `Resolved TVDB Season ID ${id} to Series ID ${seasonData.data.seriesId}`
                        );
                        const newUrl = new URL(url);
                        newUrl.pathname = `/details/media/${seasonData.data.seriesId}/tv`;
                        newUrl.searchParams.delete("indexer"); // new URL(url) copies existing params; strip indexer for clean redirect
                        if (seasonData.data.number != null)
                            newUrl.searchParams.set("season", String(seasonData.data.number));
                        throw redirect(307, newUrl.pathname + newUrl.search);
                    }
                } catch (e: any) {
                    if (e?.status === 307 || e?.status === 308) throw e;
                }

                // 3. Try title search + year fallback from TMDB
                try {
                    const tmdbData = await providers.tmdb.GET("/3/tv/{series_id}", {
                        params: { path: { series_id: Number(id) } },
                        fetch: customFetch
                    });

                    if (tmdbData.data?.name) {
                        const title = tmdbData.data.name;
                        const year =
                            dateUtils.getYearFromISO(tmdbData.data.first_air_date as string) ??
                            undefined;

                        logger.info(
                            `Attempting TVDB title search for "${title}" (${year}) as part of Hail Mary`
                        );

                        const { data: searchResults } = await providers.tvdb.GET("/search", {
                            params: { query: { query: title, type: "series", year } },
                            headers: { Authorization: `Bearer ${tvdbToken}` },
                            fetch: customFetch
                        });

                        if (searchResults?.data && searchResults.data.length > 0) {
                            // Find highest similarity match with > 0.9 confidence
                            let bestMatch: (typeof searchResults.data)[0] | null = null;
                            let maxSim = 0;

                            for (const result of searchResults.data) {
                                if (!result.name) continue;
                                const sim = calculateSimilarity(title, result.name);
                                if (sim > maxSim) {
                                    maxSim = sim;
                                    bestMatch = result;
                                }
                            }

                            if (bestMatch && maxSim > 0.9 && bestMatch.tvdb_id) {
                                // Prefer year-matching result if multiple high-similarity candidates exist
                                if (year) {
                                    const yearMatch = searchResults.data.find(
                                        (r) =>
                                            r.name &&
                                            calculateSimilarity(title, r.name) > 0.9 &&
                                            r.year &&
                                            String(r.year) === String(year)
                                    );
                                    if (yearMatch?.tvdb_id) bestMatch = yearMatch;
                                }
                                logger.info(
                                    `Hail Mary title search match: "${bestMatch.name}" (TVDB:${bestMatch.tvdb_id}, Similarity:${maxSim.toFixed(2)})`
                                );
                                const newUrl = new URL(url);
                                newUrl.pathname = `/details/media/${bestMatch.tvdb_id}/tv`;
                                newUrl.searchParams.delete("indexer"); // new URL(url) copies existing params; strip indexer for clean redirect
                                throw redirect(307, newUrl.pathname + newUrl.search);
                            }
                        }
                    }
                } catch (e: any) {
                    if (e?.status === 307 || e?.status === 308) throw e;
                    logger.warn(`Hail Mary title search failed or no match found:`, e);
                }

                logger.warn(`Hail Mary resolution failed for TVDB ID: ${id}`);
                failedResolutionCache.set(cacheKey, Date.now() + 5 * 60 * 1000); // 5 min TTL
                error(404, "The requested TV show could not be found.");
            }

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

            if (episodesError) {
                logger.error(
                    `TVDB show details fetch failed for ID ${tvdbId} (Original: ${id}):`,
                    episodesError
                );
                if (episodesStatus === 404) {
                    // If we haven't already tried a Hail Mary (e.g., it was resolveId that set tvdbId),
                    // then we should retry with a redirect to trigger the Hail Mary block.
                    const retryCount = Number(url.searchParams.get("_retry") || "0");
                    if (!isAlreadyTvdbId && retryCount < 2) {
                        logger.info(
                            `TVDB ID ${tvdbId} 404'd. Re-triggering as Hail Mary via indexer=tvdb (retry ${retryCount + 1})`
                        );
                        const newUrl = new URL(url);
                        newUrl.searchParams.set("indexer", "tvdb");
                        newUrl.searchParams.set("_retry", String(retryCount + 1));
                        // Set ID to the failing ID to force resolution search
                        newUrl.pathname = `/details/media/${tvdbId}/tv`;
                        throw redirect(307, newUrl.pathname + newUrl.search);
                    }
                    error(404, "The requested TV show could not be found.");
                }
                error(
                    503,
                    "Something went wrong while fetching TV show details. Please try again later."
                );
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
                        await fetchWithStatus(
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
