export interface Stream {
    raw_title: string;
    rank: number;
    parsed_data: ParsedTitleData;
    is_cached: boolean;
    magnet: string;
    size: number;
    [key: string]: unknown;
}

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

export interface AutoScrapeRequestPayload {
    imdb_id?: string | null;
    tmdb_id?: string | null;
    tvdb_id?: string | null;
    title?: string | null;
    year?: number | null;
    media_type?: string | null;
    season_numbers?: number[] | null;
    [key: string]: unknown;
}

export interface DebridFile {
    id?: string | number;
    file_id?: string | number;
    filename?: string;
    filesize?: number;
    size?: number;
    download_url?: string | null;
    [key: string]: unknown;
}

export type Container = Record<string, DebridFile>;
export type ShowFileData = Record<string, Record<string, DebridFile>>;
export type ParsedData = ParsedTitleData & Record<string, unknown>;

export interface StartSessionResponse {
    session_id?: string;
    sessionId?: string;
    files?: Container | null;
    file_data?: DebridFile | ShowFileData | null;
    [key: string]: unknown;
}

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
