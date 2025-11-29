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
