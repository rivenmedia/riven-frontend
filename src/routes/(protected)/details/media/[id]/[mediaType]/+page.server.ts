import type { PageServerLoad } from "./$types";
import type {
    TMDBMovieDetailsExtended,
    ParsedMovieDetails,
    ParsedShowDetails,
    TVDBBaseItem
} from "$lib/metadata/parser";
import { parseTMDBMovieDetails, parseTVDBShowDetails } from "$lib/metadata/parser";
import { error } from "@sveltejs/kit";
import { createScopedLogger } from "$lib/logger";
import { gql } from "$lib/graphql-client";
import {
    fetchTmdbDetails,
    resolveExternalId,
    fetchTvdbEpisodes,
    fetchTvdbSeriesExtended
} from "$lib/services/backend-metadata";
import {
    MEDIA_ITEM_STATE_BY_TMDB_QUERY,
    MEDIA_ITEM_STATE_BY_TVDB_QUERY,
    mapMediaItemStateTree,
    type GqlMediaItemStateTree
} from "$lib/services/riven-media";

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

type GqlTraktRecommendation = {
    id: number;
    title: string;
    posterPath: string | null;
    mediaType: "movie" | "tv";
    year: string;
    indexer: "tmdb" | "tvdb";
};

type TVDBTranslations = NonNullable<TVDBBaseItem["translations"]>;

const TRAKT_RECOMMENDATIONS_QUERY = `query($id: String!, $idType: String!, $mediaType: String!) {
    traktRecommendations(id: $id, idType: $idType, mediaType: $mediaType) {
        id
        title
        posterPath
        mediaType
        year
        indexer
    }
}`;

function mapTraktRecommendations(items: GqlTraktRecommendation[]) {
    const seen = new Set<string>();
    return items.reduce<
        Array<{
            id: number;
            title: string;
            poster_path: string | null;
            media_type: "movie" | "tv";
            year: string;
            indexer: "tmdb" | "tvdb";
            vote_average: null;
            vote_count: null;
        }>
    >((acc, item) => {
        const key = `${item.mediaType}-${item.id}`;
        if (seen.has(key)) return acc;
        seen.add(key);
        acc.push({
            id: item.id,
            title: item.title,
            poster_path: item.posterPath,
            media_type: item.mediaType,
            year: item.year,
            indexer: item.indexer,
            vote_average: null,
            vote_count: null
        });
        return acc;
    }, []);
}

export const load = (async ({ fetch, params, locals, url }) => {
    const { id, mediaType } = params;

    try {
        if (mediaType !== "movie" && mediaType !== "tv") {
            error(400, "Invalid media type");
        }

        if (!id || isNaN(Number(id))) {
            error(400, "Invalid ID");
        }

        if (mediaType === "movie") {
            const [tmdbResult, traktResult, rivenResult] = await Promise.all([
                normalizeFetch(
                    fetchTmdbDetails<TMDBMovieDetailsExtended>(
                        { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                        {
                            type: "movie",
                            id: Number(id),
                            appendToResponse:
                                "external_ids,images,recommendations,similar,videos,credits,release_dates"
                        }
                    ).then((data) => ({ data, error: null }))
                ),
                gql<{
                    traktRecommendations: GqlTraktRecommendation[];
                }>(
                    locals.backendUrl,
                    locals.apiKey,
                    TRAKT_RECOMMENDATIONS_QUERY,
                    { id, idType: "tmdb", mediaType: "movie" },
                    fetch
                )
                    .then((data) => mapTraktRecommendations(data.traktRecommendations))
                    .catch((err) => {
                        logger.error(`Trakt fetch failed for movie id=${id}:`, err);
                        return null;
                    }),
                gql<{ mediaItemStateByTmdb: GqlMediaItemStateTree | null }>(
                    locals.backendUrl,
                    locals.apiKey,
                    MEDIA_ITEM_STATE_BY_TMDB_QUERY,
                    { tmdbId: id },
                    fetch
                )
                    .then((data) => mapMediaItemStateTree(data.mediaItemStateByTmdb) ?? undefined)
                    .catch(() => undefined)
            ]);

            const { data: details, error: detailsError } = tmdbResult;

            if (detailsError) {
                logger.error("TMDB movie details fetch failed:", detailsError);
                error(503, "Unable to connect to TMDB. Please try again later.");
            }

            const parsedDetails = parseTMDBMovieDetails(details as TMDBMovieDetailsExtended, null);
            if (!parsedDetails) {
                error(500, "Failed to parse movie details");
            }
            parsedDetails.trakt_recommendations = traktResult ?? [];

            return {
                riven: rivenResult,
                rivenPending: false,
                resolvedTvdbId: null,
                mediaDetails: {
                    type: "movie" as const,
                    details: parsedDetails as ParsedMovieDetails
                } as MediaDetails
            };
        } else if (mediaType === "tv") {
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
                    resolveExternalId(
                        { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                        {
                            from: "tmdb",
                            to: "tvdb",
                            id,
                            mediaType: "tv"
                        }
                    )
                );

                if (!resolved || !("resolved" in resolved) || !resolved.resolved) {
                    logger.error(`Failed to resolve TMDB ID ${id} to TVDB ID`);
                    error(502, "Unable to resolve TV show ID. Please try again later.");
                }

                tvdbId = Number(resolved.id);
            }

            const [tvdbEpisodesResult, tvdbTranslationsResult, traktResult, rivenResult] =
                await Promise.all([
                    normalizeFetch(
                        fetchTvdbSeriesExtended<{ data: TVDBBaseItem }>(
                            { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                            tvdbId,
                            "episodes"
                        ).then((data) => ({ data, error: null }))
                    ),
                    normalizeFetch(
                        fetchTvdbSeriesExtended<{
                            data: { translations: TVDBTranslations | null };
                        }>(
                            { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                            tvdbId,
                            "translations"
                        ).then((data) => ({ data, error: null }))
                    ),
                    gql<{
                        traktRecommendations: GqlTraktRecommendation[];
                    }>(
                        locals.backendUrl,
                        locals.apiKey,
                        TRAKT_RECOMMENDATIONS_QUERY,
                        {
                            id: isAlreadyTvdbId ? String(tvdbId) : id,
                            idType: isAlreadyTvdbId ? "tvdb" : "tmdb",
                            mediaType: "show"
                        },
                        fetch
                    )
                        .then((data) => mapTraktRecommendations(data.traktRecommendations))
                        .catch((err) => {
                            logger.error(`Trakt fetch failed for show id=${id}:`, err);
                            return null;
                        }),
                    gql<{ mediaItemStateByTvdb: GqlMediaItemStateTree | null }>(
                        locals.backendUrl,
                        locals.apiKey,
                        MEDIA_ITEM_STATE_BY_TVDB_QUERY,
                        { tvdbId: String(tvdbId) },
                        fetch
                    )
                        .then(
                            (data) => mapMediaItemStateTree(data.mediaItemStateByTvdb) ?? undefined
                        )
                        .catch(() => undefined)
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
                    type EpisodeType = ParsedShowDetails["episodes"][number];
                    const { data: engEpisodesData, error: engEpisodesError } = await normalizeFetch(
                        fetchTvdbEpisodes<{ data: { episodes: EpisodeType[] } }>(
                            { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                            {
                                id: tvdbId,
                                seasonType: "official",
                                lang: "eng",
                                page: 0
                            }
                        ).then((data) => ({ data, error: null }))
                    );

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
            const parsedDetails = parseTVDBShowDetails(validatedData, null);
            if (!parsedDetails) {
                error(500, "Failed to parse TV show details");
            }
            parsedDetails.trakt_recommendations = traktResult ?? [];

            return {
                riven: rivenResult,
                rivenPending: false,
                resolvedTvdbId: tvdbId,
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
