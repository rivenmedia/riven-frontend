import type { IMediaPlayerService, MediaInfo, PlaybackResult, MediaPlayerConfig } from "./types";

export class PlexService implements IMediaPlayerService {
	private config: MediaPlayerConfig;

	constructor(config: MediaPlayerConfig) {
		this.config = config;
	}

	getDisplayName(): string {
		return "Plex";
	}

	isConfigured(): boolean {
		return !!this.config.serverUrl && !!this.config.token;
	}

	async getStreamUrl(mediaInfo: MediaInfo): Promise<PlaybackResult> {
		if (!this.isConfigured()) {
			return {
				success: false,
				error: "Plex is not configured. Please set server URL and token."
			};
		}

		if (!mediaInfo.title) {
			return {
				success: false,
				error: "Title not found for this media"
			};
		}

		try {
			// Search Plex for the media item using title
			const searchUrl = `${this.config.serverUrl}/search?query=${encodeURIComponent(mediaInfo.title)}&X-Plex-Token=${this.config.token}`;
			const searchResponse = await fetch(searchUrl);
			const searchText = await searchResponse.text();

			// Parse XML response to get ratingKey
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(searchText, "text/xml");
			const videoElement = xmlDoc.querySelector(
				'Video[type="movie"], Directory[type="show"]'
			);

			if (!videoElement) {
				return {
					success: false,
					error: "Media not found in your Plex library"
				};
			}

			const ratingKey = videoElement.getAttribute("ratingKey");
			if (!ratingKey) {
				return {
					success: false,
					error: "Could not retrieve Plex rating key"
				};
			}

			// Construct the HLS playback URL
			const streamUrl = `${this.config.serverUrl}/video/:/transcode/universal/start.m3u8?path=/library/metadata/${ratingKey}&X-Plex-Token=${this.config.token}&mediaIndex=0&partIndex=0&protocol=hls&fastSeek=1&X-Plex-Platform=Web&X-Plex-Client-Identifier=riven`;

			return {
				success: true,
				streamUrl
			};
		} catch (error) {
			console.error("Error loading Plex media:", error);
			return {
				success: false,
				error: "Failed to load media from Plex"
			};
		}
	}
}
