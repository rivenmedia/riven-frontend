export interface VideoMetadata {
    resolution_width?: number;
    resolution_height?: number;
    codec?: string;
    bit_depth?: number;
    hdr_type?: string;
    frame_rate?: number;
}

export interface AudioTrack {
    codec?: string;
    channels?: number;
    language?: string;
}

export interface SubtitleTrack {
    codec?: string;
    language?: string;
}

export interface MediaMetadata {
    duration?: number;
    original_filename?: string;
    filename?: string;
    video?: VideoMetadata;
    bitrate?: number;
    audio_tracks?: AudioTrack[];
    subtitle_tracks?: SubtitleTrack[];
    quality_source?: string;
    container_format?: string[];
    is_remux?: boolean;
    is_proper?: boolean;
    is_repack?: boolean;
}

export interface FilesystemEntry {
    id?: number;
    file_size?: number;
    original_filename?: string;
    download_url?: string;
    provider?: string;
    provider_download_id?: string;
    path?: string;
    plugin?: string;
    ranking_profile_name?: string;
    media_metadata?: MediaMetadata;
}

export interface RivenEpisode {
    episode_number: number;
    state: string;
    media_metadata?: MediaMetadata;
    filesystem_entry?: FilesystemEntry;
    filesystem_entries?: FilesystemEntry[];
}

export interface RivenSeason {
    season_number: number;
    state: string;
    is_requested: boolean;
    episodes?: RivenEpisode[];
}

export interface RivenMediaItem {
    id: number;
    state: string;
    imdb_id?: string;
    tmdb_id?: string;
    tvdb_id?: string;
    media_metadata?: MediaMetadata;
    filesystem_entry?: FilesystemEntry;
    filesystem_entries?: FilesystemEntry[];
    seasons?: RivenSeason[];
}
