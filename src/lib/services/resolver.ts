import providers from "$lib/providers";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("tmdb-resolver");

export async function resolveTmdbToTvdb(
    id: number | string,
    tvdbToken: string,
    customFetch: typeof fetch
): Promise<number> {
    const tmdbId = Number(id);
    let tvdbId = tmdbId;
    let resolved = false;

    // Method 1: Ask TMDB for the TVDB ID (Best/Fastest)
    try {
        const tmdbExternalIds = await providers.tmdb.GET("/3/tv/{series_id}/external_ids", {
            params: { path: { series_id: tmdbId } },
            fetch: customFetch
        });
        if (tmdbExternalIds.data && tmdbExternalIds.data.tvdb_id) {
            tvdbId = tmdbExternalIds.data.tvdb_id;
            resolved = true;
        }
    } catch (e) {
        logger.warn(`Failed to resolve TMDB ID ${id} via TMDB external_ids:`, e);
    }

    // Method 2: Ask TVDB for the show via TMDB ID (Backup)
    if (!resolved) {
        try {
            const searchRes = await providers.tvdb.GET("/search", {
                params: { query: { remote_id: id } as any }, // 'remote_id' param support depends on client
                headers: { Authorization: `Bearer ${tvdbToken}` },
                fetch: customFetch
            });

            if (searchRes.data && searchRes.data.data && searchRes.data.data.length > 0) {
                const match = searchRes.data.data[0];
                // Prefer tvdb_id, fallback to id
                if (match.tvdb_id) {
                    tvdbId = Number(match.tvdb_id);
                    resolved = true;
                    logger.info(`Resolved TMDB ID ${id} to TVDB ID ${tvdbId} via TVDB remote_id search`);
                } else if (match.id) {
                    // Sometimes 'id' is the TVDB ID string/number
                    tvdbId = Number(match.id);
                    resolved = true;
                    logger.info(
                        `Resolved TMDB ID ${id} to TVDB ID ${tvdbId} via TVDB remote_id search (id field)`
                    );
                }
            }
        } catch (e) {
            logger.warn(`Failed to resolve TMDB ID ${id} via TVDB remote_id search:`, e);
        }
    }

    if (!resolved) {
        logger.warn(
            `Could not resolve TMDB ID ${id} to TVDB ID. Attempting to use as-is (Legacy/Fallback).`
        );
    }

    return tvdbId;
}
