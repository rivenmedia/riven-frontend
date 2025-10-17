import type { IMediaPlayerService, MediaInfo, PlaybackResult, MediaPlayerConfig } from "./types";

export class EmbyService implements IMediaPlayerService {
	private config: MediaPlayerConfig;

	constructor(config: MediaPlayerConfig) {
		this.config = config;
	}

	getDisplayName(): string {
		return "Emby";
	}

	isConfigured(): boolean {
		return !!this.config.serverUrl && !!this.config.token;
	}

	async getStreamUrl(mediaInfo: MediaInfo): Promise<PlaybackResult> {
		if (!this.isConfigured()) {
			return {
				success: false,
				error: "Emby is not configured. Please set server URL and API key."
			};
		}

		try {
			// Search for the item by external ID (IMDb or TMDB)
			let itemId: string | null = null;

			// Try searching by IMDb ID first
			if (mediaInfo.imdbId) {
				const imdbSearchUrl = `${this.config.serverUrl}/Items?AnyProviderIdEquals=imdb.${mediaInfo.imdbId}&api_key=${this.config.token}`;
				const imdbResponse = await fetch(imdbSearchUrl);
				const imdbData = await imdbResponse.json();

				if (imdbData.Items && imdbData.Items.length > 0) {
					itemId = imdbData.Items[0].Id;
				}
			}

			// Fallback to TMDB ID if IMDb didn't work
			if (!itemId && mediaInfo.tmdbId) {
				const tmdbSearchUrl = `${this.config.serverUrl}/Items?AnyProviderIdEquals=tmdb.${mediaInfo.tmdbId}&api_key=${this.config.token}`;
				const tmdbResponse = await fetch(tmdbSearchUrl);
				const tmdbData = await tmdbResponse.json();

				if (tmdbData.Items && tmdbData.Items.length > 0) {
					itemId = tmdbData.Items[0].Id;
				}
			}

			if (!itemId) {
				return {
					success: false,
					error: "Media not found in your Emby library"
				};
			}

			// Construct the HLS streaming URL
			// Using the master.m3u8 endpoint for HLS streaming
			const streamUrl = `${this.config.serverUrl}/Videos/${itemId}/master.m3u8?api_key=${this.config.token}&MediaSourceId=${itemId}&VideoCodec=h264&AudioCodec=aac&MaxStreamingBitrate=4000000`;

			return {
				success: true,
				streamUrl
			};
		} catch (error) {
			console.error("Error loading Emby media:", error);
			return {
				success: false,
				error: "Failed to load media from Emby"
			};
		}
	}
}
