import type { components } from "$lib/providers/riven";

// Manually define Stream if not in schemas
export interface Stream {
    raw_title: string;
    rank: number;
    parsed_data: ParsedTitleData;
    is_cached: boolean;
    magnet: string;
    size: number;
    [key: string]: unknown;
}

export type AutoScrapeRequestPayload = components["schemas"]["AutoScrapeRequest"];
export type DebridFile = components["schemas"]["DebridFile"];
export type Container = components["schemas"]["Container"];
export type ShowFileData = components["schemas"]["ShowFileData"];
export type ParsedData = components["schemas"]["ParsedFile"];

// Re-export types from riven.ts
export type {
    VideoMetadata,
    AudioTrack,
    SubtitleTrack,
    MediaMetadata,
    FilesystemEntry,
    RivenEpisode,
    RivenSeason,
    RivenMediaItem
} from "./riven";

export interface ScrapeSeasonRequest extends AutoScrapeRequestPayload {
    season_numbers: number[];
}

/**
 * File mapping for manual scraping - maps debrid files to season/episode
 */
export interface FileMapping {
    file_id: string;
    filename: string;
    filesize: number;
    season?: number;
    episode?: number;
    download_url?: string | null;
}

/**
 * Parsed title data from RTN parser
 */
export interface ParsedTitleData {
    filename?: string;
    original_filename?: string;
    seasons?: number[];
    episodes?: number[];
    resolution?: string;
    quality?: string;
    hdr?: string[];
    codec?: string;
    audio?: string[];
    languages?: string[];
    complete?: boolean;
}

/**
 * Batch scraping session state
 */
export interface BatchSession {
    sessionId: string;
    magnet: string;
    stream: Stream;
    sessionData: any;
    mappings: FileMapping[];
    status: "pending" | "completed" | "error";
    error?: string;
}

/**
 * Container body for file selection API calls
 */
export interface ContainerBody {
    [fileId: string]: {
        file_id: number;
        filename: string;
        filesize: number;
    };
}

/**
 * Update body for TV shows - maps seasons to episodes to file data
 */
export interface ShowUpdateBody {
    [seasonKey: string]: {
        [episodeKey: string]: {
            file_id: number;
            filename: string;
            filesize: number;
            download_url?: string;
        };
    };
}
