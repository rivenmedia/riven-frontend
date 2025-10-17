import { PlexService } from "./plex";
import { EmbyService } from "./emby";
import { JellyfinService } from "./jellyfin";
import type { IMediaPlayerService, MediaPlayerConfig, MediaInfo, PlaybackResult } from "./types";

export * from "./types";
export { PlexService, EmbyService, JellyfinService };

/**
 * MediaPlayerManager - Manages multiple media player services
 */
export class MediaPlayerManager {
	private services: Map<string, IMediaPlayerService> = new Map();
	private activeService: IMediaPlayerService | null = null;

	/**
	 * Register a media player service
	 */
	registerService(name: string, service: IMediaPlayerService): void {
		this.services.set(name, service);
	}

	/**
	 * Set the active service to use for playback
	 */
	setActiveService(name: string): boolean {
		const service = this.services.get(name);
		if (service && service.isConfigured()) {
			this.activeService = service;
			return true;
		}
		return false;
	}

	/**
	 * Get the active service
	 */
	getActiveService(): IMediaPlayerService | null {
		return this.activeService;
	}

	/**
	 * Get all registered services
	 */
	getServices(): Map<string, IMediaPlayerService> {
		return this.services;
	}

	/**
	 * Get all configured and ready services
	 */
	getConfiguredServices(): Array<{ name: string; service: IMediaPlayerService }> {
		const configured: Array<{ name: string; service: IMediaPlayerService }> = [];
		this.services.forEach((service, name) => {
			if (service.isConfigured()) {
				configured.push({ name, service });
			}
		});
		return configured;
	}

	/**
	 * Play media using the active service
	 */
	async playMedia(mediaInfo: MediaInfo): Promise<PlaybackResult> {
		if (!this.activeService) {
			return {
				success: false,
				error: "No media player service is active"
			};
		}

		return this.activeService.getStreamUrl(mediaInfo);
	}
}

/**
 * Create a pre-configured MediaPlayerManager with all services
 */
export function createMediaPlayerManager(configs: {
	plex?: MediaPlayerConfig;
	emby?: MediaPlayerConfig;
	jellyfin?: MediaPlayerConfig;
}): MediaPlayerManager {
	const manager = new MediaPlayerManager();

	if (configs.plex) {
		manager.registerService("plex", new PlexService(configs.plex));
	}

	if (configs.emby) {
		manager.registerService("emby", new EmbyService(configs.emby));
	}

	if (configs.jellyfin) {
		manager.registerService("jellyfin", new JellyfinService(configs.jellyfin));
	}

	return manager;
}
