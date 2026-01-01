import providers from "$lib/providers";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("id-resolver");

export type Indexer = "tmdb" | "tvdb" | "imdb" | "anilist" | "riven";
export type MediaType = "movie" | "tv";

export interface ResolveOptions {
    from: Indexer;
    to: Indexer;
    id: number | string;
    mediaType: MediaType;
    tvdbToken?: string;
    customFetch: typeof fetch;
    rivenBaseUrl?: string;
    rivenApiKey?: string;
}

export interface ResolveResult {
    id: number | string;
    resolved: boolean;
}

type Resolver = (options: ResolveOptions) => Promise<ResolveResult>;

// Resolver lookup table - maps "from->to" to resolver function
const resolvers: Record<string, Resolver> = {
    "tmdb->tvdb": tmdbToTvdb,
    "tmdb->imdb": tmdbToImdb,
    "anilist->tvdb": (opts) => anilistToExternal(opts, "tvdb"),
    "anilist->tmdb": (opts) => anilistToExternal(opts, "tmdb"),
    "riven->tvdb": (opts) => rivenToExternal(opts, "tvdb"),
    "riven->tmdb": (opts) => rivenToExternal(opts, "tmdb")
};

/**
 * Universal ID resolver that converts between different indexer ID systems.
 */
export async function resolveId(options: ResolveOptions): Promise<ResolveResult> {
    const { from, to, id } = options;

    if (from === to) {
        return { id, resolved: true };
    }

    const resolver = resolvers[`${from}->${to}`];
    if (!resolver) {
        logger.warn(`Unsupported conversion: ${from}->${to}`);
        return { id, resolved: false };
    }

    return resolver(options);
}

/**
 * Fetch TMDB TV external IDs (includes tvdb_id)
 */
async function getTvExternalIds(tmdbId: number, customFetch: typeof fetch) {
    return providers.tmdb.GET("/3/tv/{series_id}/external_ids", {
        params: { path: { series_id: tmdbId } },
        fetch: customFetch
    });
}

/**
 * Fetch TMDB movie external IDs (includes imdb_id)
 */
async function getMovieExternalIds(tmdbId: number, customFetch: typeof fetch) {
    return providers.tmdb.GET("/3/movie/{movie_id}/external_ids", {
        params: { path: { movie_id: tmdbId } },
        fetch: customFetch
    });
}

/**
 * TMDB -> TVDB (TV shows only)
 */
async function tmdbToTvdb(options: ResolveOptions): Promise<ResolveResult> {
    const { id, mediaType, customFetch, tvdbToken } = options;
    const tmdbId = Number(id);

    if (mediaType === "movie") {
        logger.warn("TMDB->TVDB conversion only supported for TV shows");
        return { id: tmdbId, resolved: false };
    }

    // Primary: TMDB external_ids
    try {
        const { data, error } = await getTvExternalIds(tmdbId, customFetch);
        if (!error && data?.tvdb_id) {
            return { id: data.tvdb_id, resolved: true };
        }
    } catch (e) {
        logger.warn(`TMDB external_ids failed for ${id}:`, e);
    }

    // Fallback: TVDB search by remote ID (TMDB ID)
    if (tvdbToken) {
        try {
            const { data, error } = await providers.tvdb.GET("/search/remoteid/{remoteId}", {
                params: { path: { remoteId: String(id) } },
                headers: { Authorization: `Bearer ${tvdbToken}` },
                fetch: customFetch
            });

            if (!error) {
                // Find a series result (ignore movies - we only resolve TV shows)
                const match = data?.data?.find((r) => r.series)?.series;
                if (match?.id) {
                    return { id: Number(match.id), resolved: true };
                }
            }
        } catch (e) {
            logger.warn(`TVDB remote_id search failed for ${id}:`, e);
        }

        // Final fallback: Check if TMDB ID exists as a TVDB series ID directly
        // (sometimes IDs match between systems)
        try {
            const { data, error } = await providers.tvdb.GET("/series/{id}", {
                params: { path: { id: tmdbId } },
                headers: { Authorization: `Bearer ${tvdbToken}` },
                fetch: customFetch
            });

            if (!error && data?.data?.id) {
                return { id: Number(data.data.id), resolved: true };
            }
        } catch (e) {
            // Series doesn't exist with this ID, that's fine
        }
    }

    logger.warn(`Could not resolve TMDB ${id} to TVDB`);
    return { id: tmdbId, resolved: false };
}

/**
 * TMDB -> IMDB
 */
async function tmdbToImdb(options: ResolveOptions): Promise<ResolveResult> {
    const { id, mediaType, customFetch } = options;
    const tmdbId = Number(id);

    try {
        const { data } =
            mediaType === "movie"
                ? await getMovieExternalIds(tmdbId, customFetch)
                : await getTvExternalIds(tmdbId, customFetch);
        if (data?.imdb_id) {
            return { id: data.imdb_id, resolved: true };
        }
    } catch (e) {
        logger.warn(`Failed to resolve TMDB ${id} to IMDB:`, e);
    }

    return { id: tmdbId, resolved: false };
}

/**
 * AniList -> TVDB/TMDB via ani.zip API
 */
async function anilistToExternal(
    options: ResolveOptions,
    to: "tvdb" | "tmdb"
): Promise<ResolveResult> {
    const { id, customFetch } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await customFetch(`https://api.ani.zip/v1/mappings?anilist_id=${id}`, {
            headers: { "Content-Type": "application/json" },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return { id, resolved: false };
        }

        const data = await response.json();
        const resolvedId = to === "tvdb" ? data.thetvdb_id : data.themoviedb_id;

        if (resolvedId) {
            return { id: resolvedId, resolved: true };
        }
    } catch (e) {
        clearTimeout(timeoutId);
        if (e instanceof Error && e.name === "AbortError") {
            logger.warn(`AniList mappings request timed out for ${id}`);
        } else {
            logger.warn(`Failed to resolve AniList ${id}:`, e);
        }
    }

    return { id, resolved: false };
}

/**
 * Riven -> TVDB/TMDB
 */
async function rivenToExternal(
    options: ResolveOptions,
    to: "tvdb" | "tmdb"
): Promise<ResolveResult> {
    const { id, mediaType, customFetch, rivenBaseUrl, rivenApiKey } = options;

    if (!rivenBaseUrl || !rivenApiKey) {
        logger.warn("Riven credentials not provided");
        return { id, resolved: false };
    }

    try {
        const { data, error } = await providers.riven.GET("/api/v1/items/{id}", {
            params: {
                path: { id: String(id) },
                query: { media_type: mediaType }
            },
            baseUrl: rivenBaseUrl,
            headers: { "x-api-key": rivenApiKey },
            fetch: customFetch
        });

        if (error) {
            return { id, resolved: false };
        }

        const resolvedId = (to === "tvdb" ? data?.tvdb_id : data?.tmdb_id) as
            | string
            | number
            | null
            | undefined;

        if (resolvedId != null) {
            return { id: resolvedId, resolved: true };
        }
    } catch (e) {
        logger.warn(`Failed to resolve Riven ${id}:`, e);
    }

    return { id, resolved: false };
}
