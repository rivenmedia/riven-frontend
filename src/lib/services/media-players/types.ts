/**
 * Media player types and interfaces
 */

export type MediaPlayerType = "plex" | "emby" | "jellyfin";

export interface MediaPlayerConfig {
	type: MediaPlayerType;
	serverUrl: string;
	token: string;
}

export interface MediaInfo {
	imdbId?: string;
	tmdbId?: string;
	tvdbId?: string;
	title: string;
	year?: number;
	mediaType: "movie" | "tv";
}

export interface PlaybackResult {
	success: boolean;
	streamUrl?: string;
	error?: string;
}

/**
 * Base interface that all media player services must implement
 */
export interface IMediaPlayerService {
	/**
	 * Get the streaming URL for the media
	 */
	getStreamUrl(mediaInfo: MediaInfo): Promise<PlaybackResult>;

	/**
	 * Validate if the service is properly configured
	 */
	isConfigured(): boolean;

	/**
	 * Get the display name of the service
	 */
	getDisplayName(): string;
}
