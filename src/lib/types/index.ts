import type { components } from "$lib/providers/riven";

export type AutoScrapeRequestPayload = components["schemas"]["AutoScrapeRequestPayload"];
export type Stream = components["schemas"]["Stream"];
export type StartSessionResponse = components["schemas"]["StartSessionResponse"];
export type DebridFile = components["schemas"]["DebridFile"];
export type Container = components["schemas"]["Container"];
export type ShowFileData = components["schemas"]["ShowFileData"];
export type ParsedData = components["schemas"]["ParsedData"];

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
    sessionData: StartSessionResponse;
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

export interface RivenMediaItem {
    id: number;
    state: string;
    media_metadata?: {
        duration?: number;
        original_filename?: string;
        filename?: string;
        video?: {
            resolution_width?: number;
            resolution_height?: number;
            codec?: string;
            bit_depth?: number;
            hdr_type?: string;
            frame_rate?: number;
        };
        bitrate?: number;
        audio_tracks?: Array<{
            codec?: string;
            channels?: number;
            language?: string;
        }>;
        subtitle_tracks?: Array<{
            codec?: string;
            language?: string;
        }>;
        quality_source?: string;
        container_format?: string[];
        is_remux?: boolean;
        is_proper?: boolean;
        is_repack?: boolean;
    };
    filesystem_entry?: {
        file_size?: number;
        original_filename?: string;
    };
    seasons?: Array<{
        season_number: number;
        state: string;
        episodes?: Array<{
            episode_number: number;
            state: string;
        }>;
    }>;
}
