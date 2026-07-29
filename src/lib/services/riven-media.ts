/**
 * Riven media GraphQL operations and response mappers.
 *
 * Unlike `backend-metadata.ts` (whose operations are server-only and thus
 * wrapped in `ctx`-based fetch helpers), the operations here are exported as
 * raw, transport-agnostic strings on purpose: the same constant is consumed
 * across all three transports — `gql` (server load), `gqlClient` (client proxy)
 * and `gqlSubscribeClient` (WebSocket). Do not "consolidate" these into fetch
 * wrappers; a single wrapper cannot serve all three transports.
 */

import type { RivenMediaItem } from "$lib/types/riven";

export interface GqlFilesystemEntry {
    id?: number | null;
    fileSize?: number | null;
    originalFilename?: string | null;
    downloadUrl?: string | null;
    provider?: string | null;
    providerDownloadId?: string | null;
    path?: string | null;
    plugin?: string | null;
    rankingProfileName?: string | null;
    mediaMetadata?: unknown;
}

export interface GqlEpisodeFull {
    episodeNumber: number;
    state: string;
    filesystemEntry?: GqlFilesystemEntry | null;
    filesystemEntries?: GqlFilesystemEntry[];
}

export interface GqlSeasonFull {
    seasonNumber: number;
    state: string;
    isRequested: boolean;
    episodes?: GqlEpisodeFull[];
}

export interface GqlMediaItemFull {
    id: number;
    state: string;
    imdbId?: string | null;
    tmdbId?: string | null;
    tvdbId?: string | null;
    filesystemEntry?: GqlFilesystemEntry | null;
    filesystemEntries?: GqlFilesystemEntry[];
    seasons?: GqlSeasonFull[];
}

export interface GqlEpisodeState {
    id: number;
    episodeNumber?: number | null;
    state: string;
}

export interface GqlSeasonState {
    id: number;
    seasonNumber?: number | null;
    state: string;
    isRequested: boolean;
    episodes?: GqlEpisodeState[];
}

export interface GqlMediaItemStateTree {
    id: number;
    state: string;
    imdbId?: string | null;
    tmdbId?: string | null;
    tvdbId?: string | null;
    seasons?: GqlSeasonState[];
}

const MEDIA_ITEM_FULL_FIELDS = `
    id state imdbId tmdbId tvdbId
    filesystemEntry {
        id fileSize originalFilename downloadUrl
        provider providerDownloadId path plugin rankingProfileName mediaMetadata
    }
    filesystemEntries {
        id fileSize originalFilename downloadUrl
        provider providerDownloadId path plugin rankingProfileName mediaMetadata
    }
    seasons {
        seasonNumber state isRequested
        episodes {
            episodeNumber state
            filesystemEntry {
                id fileSize originalFilename downloadUrl
                provider providerDownloadId path plugin rankingProfileName mediaMetadata
            }
            filesystemEntries {
                id fileSize originalFilename downloadUrl
                provider providerDownloadId path plugin rankingProfileName mediaMetadata
            }
        }
    }
`;

const RAW_FILESYSTEM_ENTRY_FIELDS = `
    id fileSize createdAt updatedAt mediaItemId entryType path
    originalFilename downloadUrl plugin provider providerDownloadId
    libraryProfiles mediaMetadata language parentOriginalFilename subtitleContent
    fileHash videoFileSize opensubtitlesId streamId resolution rankingProfileName
`;

const RAW_MEDIA_ITEM_FULL_FIELDS = `
    id title fullTitle state imdbId tmdbId tvdbId posterPath
    createdAt updatedAt indexedAt scrapedAt scrapedTimes
    aliases network country language isAnime airedAt year genres rating contentRating
    failedAttempts itemType isRequested showStatus seasonNumber isSpecial parentId
    episodeNumber absoluteNumber runtime itemRequestId activeStreamId
    filesystemEntry {
        ${RAW_FILESYSTEM_ENTRY_FIELDS}
    }
    filesystemEntries {
        ${RAW_FILESYSTEM_ENTRY_FIELDS}
    }
    seasons {
        id title seasonNumber isSpecial parentId createdAt updatedAt indexedAt scrapedAt
        scrapedTimes failedAttempts itemType state isRequested
        episodes {
            id title episodeNumber absoluteNumber runtime airedAt parentId createdAt updatedAt
            indexedAt scrapedAt scrapedTimes failedAttempts itemType state isRequested
            filesystemEntry {
                ${RAW_FILESYSTEM_ENTRY_FIELDS}
            }
            filesystemEntries {
                ${RAW_FILESYSTEM_ENTRY_FIELDS}
            }
        }
    }
`;

const MEDIA_ITEM_STATE_FIELDS = `
    id state imdbId tmdbId tvdbId
    seasons {
        id seasonNumber state isRequested
        episodes {
            id episodeNumber state
        }
    }
`;

export const MEDIA_ITEM_FULL_BY_TMDB_QUERY = `query($tmdbId: String!) {
    mediaItemFullByTmdb(tmdbId: $tmdbId) {
        ${MEDIA_ITEM_FULL_FIELDS}
    }
}`;

export const MEDIA_ITEM_FULL_BY_TVDB_QUERY = `query($tvdbId: String!) {
    mediaItemFullByTvdb(tvdbId: $tvdbId) {
        ${MEDIA_ITEM_FULL_FIELDS}
    }
}`;

export const RAW_RIVEN_DATA_BY_TMDB_QUERY = `query($tmdbId: String!) {
    mediaItemFullByTmdb(tmdbId: $tmdbId) {
        ${RAW_MEDIA_ITEM_FULL_FIELDS}
    }
}`;

export const RAW_RIVEN_DATA_BY_TVDB_QUERY = `query($tvdbId: String!) {
    mediaItemFullByTvdb(tvdbId: $tvdbId) {
        ${RAW_MEDIA_ITEM_FULL_FIELDS}
    }
}`;

export const MEDIA_ITEM_STATE_UPDATES_BY_TMDB_SUBSCRIPTION = `subscription($tmdbId: String!) {
    mediaItemStateUpdatesByTmdb(tmdbId: $tmdbId) {
        ${MEDIA_ITEM_STATE_FIELDS}
    }
}`;

export const MEDIA_ITEM_STATE_UPDATES_BY_TVDB_SUBSCRIPTION = `subscription($tvdbId: String!) {
    mediaItemStateUpdatesByTvdb(tvdbId: $tvdbId) {
        ${MEDIA_ITEM_STATE_FIELDS}
    }
}`;

// ── New pub-sub subscriptions ──

export interface GqlIndexedShow {
    id: number;
    tvdbId?: string | null;
    tmdbId?: string | null;
    imdbId?: string | null;
    state: string;
}

/** Fires whenever a movie item request is created. */
export const MOVIE_REQUESTED_SUBSCRIPTION = `subscription {
    movieRequested {
        id tmdbId imdbId requestType state
    }
}`;

/** Fires whenever a show item request is created. */
export const SHOW_REQUESTED_SUBSCRIPTION = `subscription {
    showRequested {
        id tvdbId imdbId requestType state
    }
}`;

/** Fires whenever an existing show item request is updated (e.g. new seasons added). */
export const SHOW_REQUEST_UPDATED_SUBSCRIPTION = `subscription {
    showRequestUpdated {
        id tvdbId imdbId requestType state
    }
}`;

/** Fires whenever a show has been indexed (metadata + episode structure persisted). */
export const SHOW_INDEXED_SUBSCRIPTION = `subscription {
    showIndexed {
        id tvdbId tmdbId imdbId state
    }
}`;

export const MEDIA_ITEM_STATE_BY_TMDB_QUERY = `query($tmdbId: String!) {
    mediaItemStateByTmdb(tmdbId: $tmdbId) {
        ${MEDIA_ITEM_STATE_FIELDS}
    }
}`;

export const MEDIA_ITEM_STATE_BY_TVDB_QUERY = `query($tvdbId: String!) {
    mediaItemStateByTvdb(tvdbId: $tvdbId) {
        ${MEDIA_ITEM_STATE_FIELDS}
    }
}`;

function mapFsEntry(
    entry: GqlFilesystemEntry
): RivenMediaItem["filesystem_entry"] & { id?: number; ranking_profile_name?: string } {
    return {
        id: entry.id ?? undefined,
        file_size: entry.fileSize ?? undefined,
        original_filename: entry.originalFilename ?? undefined,
        download_url: entry.downloadUrl ?? undefined,
        provider: entry.provider ?? undefined,
        provider_download_id: entry.providerDownloadId ?? undefined,
        path: entry.path ?? undefined,
        plugin: entry.plugin ?? undefined,
        ranking_profile_name: entry.rankingProfileName ?? undefined,
        media_metadata: entry.mediaMetadata as import("$lib/types/riven").MediaMetadata | undefined
    };
}

export function mapMediaItemFull(raw: GqlMediaItemFull | null | undefined): RivenMediaItem | null {
    if (!raw) {
        return null;
    }

    return {
        id: raw.id,
        state: raw.state,
        imdb_id: raw.imdbId ?? undefined,
        tmdb_id: raw.tmdbId ?? undefined,
        tvdb_id: raw.tvdbId ?? undefined,
        media_metadata: raw.filesystemEntry?.mediaMetadata as RivenMediaItem["media_metadata"],
        filesystem_entry: raw.filesystemEntry ? mapFsEntry(raw.filesystemEntry) : undefined,
        filesystem_entries: raw.filesystemEntries?.map(mapFsEntry) ?? [],
        seasons: raw.seasons?.map((season) => ({
            season_number: season.seasonNumber,
            state: season.state,
            is_requested: season.isRequested,
            episodes: season.episodes?.map((episode) => ({
                episode_number: episode.episodeNumber,
                state: episode.state,
                media_metadata: episode.filesystemEntry
                    ?.mediaMetadata as RivenMediaItem["media_metadata"],
                filesystem_entry: episode.filesystemEntry
                    ? mapFsEntry(episode.filesystemEntry)
                    : undefined,
                filesystem_entries: episode.filesystemEntries?.map(mapFsEntry) ?? []
            }))
        }))
    };
}

export function mapMediaItemStateTree(
    raw: GqlMediaItemStateTree | null | undefined
): RivenMediaItem | null {
    if (!raw) {
        return null;
    }

    return {
        id: raw.id,
        state: raw.state,
        imdb_id: raw.imdbId ?? undefined,
        tmdb_id: raw.tmdbId ?? undefined,
        tvdb_id: raw.tvdbId ?? undefined,
        seasons: raw.seasons?.map((season) => ({
            season_number: season.seasonNumber ?? 0,
            state: season.state,
            is_requested: season.isRequested,
            episodes: season.episodes?.map((episode) => ({
                episode_number: episode.episodeNumber ?? 0,
                state: episode.state
            }))
        }))
    };
}
