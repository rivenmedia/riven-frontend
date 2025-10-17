import type { IMediaPlayerService, MediaInfo, PlaybackResult, MediaPlayerConfig } from "./types";

export class JellyfinService implements IMediaPlayerService {
	private config: MediaPlayerConfig;

	constructor(config: MediaPlayerConfig) {
		this.config = config;
	}

	getDisplayName(): string {
		return "Jellyfin";
	}

	isConfigured(): boolean {
		return !!this.config.serverUrl && !!this.config.token;
	}

	async getStreamUrl(mediaInfo: MediaInfo): Promise<PlaybackResult> {
		if (!this.isConfigured()) {
			return {
				success: false,
				error: "Jellyfin is not configured. Please set server URL and API key."
			};
		}

		try {
			// Search for the item by external ID (IMDb or TMDB)
			let itemId: string | null = null;

			// Try searching by IMDb ID first
			if (mediaInfo.imdbId) {
				const imdbSearchUrl = `${this.config.serverUrl}/Items?AnyProviderIdEquals=imdb.${mediaInfo.imdbId}&api_key=${this.config.token}`;
				const imdbResponse = await fetch(imdbSearchUrl, {
					headers: {
						"X-Emby-Token": this.config.token
					}
				});
				const imdbData = await imdbResponse.json();

				if (imdbData.Items && imdbData.Items.length > 0) {
					itemId = imdbData.Items[0].Id;
				}
			}

			// Fallback to TMDB ID if IMDb didn't work
			if (!itemId && mediaInfo.tmdbId) {
				const tmdbSearchUrl = `${this.config.serverUrl}/Items?AnyProviderIdEquals=tmdb.${mediaInfo.tmdbId}`;
				const tmdbResponse = await fetch(tmdbSearchUrl, {
					headers: {
						"X-Emby-Token": this.config.token
					}
				});
				const tmdbData = await tmdbResponse.json();

				if (tmdbData.Items && tmdbData.Items.length > 0) {
					itemId = tmdbData.Items[0].Id;
				}
			}

			if (!itemId) {
				return {
					success: false,
					error: "Media not found in your Jellyfin library"
				};
			}

			// Construct the HLS streaming URL using the Dynamic HLS endpoint
			// Reference: https://api.jellyfin.org/#tag/DynamicHls/operation/GetLiveHlsStream
			const streamUrl = `${this.config.serverUrl}/Videos/${itemId}/master.m3u8?MediaSourceId=${itemId}&VideoCodec=h264&AudioCodec=aac&MaxStreamingBitrate=4000000&api_key=${this.config.token}`;

			return {
				success: true,
				streamUrl
			};
		} catch (error) {
			console.error("Error loading Jellyfin media:", error);
			return {
				success: false,
				error: "Failed to load media from Jellyfin"
			};
		}
	}
}
