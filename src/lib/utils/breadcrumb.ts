import type { BreadcrumbItem, DropdownItem } from '$lib/components/navigation-breadcrumb.svelte';
import { statesName } from '$lib/constants';

interface BreadcrumbOptions {
	mediaType?: 'movie' | 'tv';
	mediaId?: string;
	mediaTitle?: string;
	seasonNumber?: number;
	seasonData?: any;
	episodeNumber?: number;
	episodeTitle?: string;
	allSeasons?: any[];
	allEpisodes?: any[];
	rivenData?: any;
}

export function buildBreadcrumbs(options: BreadcrumbOptions): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [];

	// Always start with Library/Browse
	items.push({
		label: 'Library',
		href: '/browse',
		isActive: false
	});

	// Add media type if available
	if (options.mediaType) {
		const mediaTypeLabel = options.mediaType === 'movie' ? 'Movies' : 'TV Shows';
		const apiMediaType = options.mediaType === 'tv' ? 'show' : 'movie';
		items.push({
			label: mediaTypeLabel,
			href: `/browse?type=${apiMediaType}`,
			isActive: !options.mediaId
		});
	}

	// Add media title if available
	if (options.mediaId && options.mediaTitle) {
		items.push({
			label: options.mediaTitle,
			href: `/${options.mediaType}/${options.mediaId}`,
			isActive: options.seasonNumber === undefined
		});
	}

	// Add season if available
	if (options.seasonNumber !== undefined && options.mediaType === 'tv') {
		const seasonItem: BreadcrumbItem = {
			label: `Season ${options.seasonNumber}`,
			href: `/tv/${options.mediaId}/${options.seasonNumber}`,
			isActive: options.episodeNumber === undefined
		};

		// Add dropdown for other seasons if available
		if (options.allSeasons && options.allSeasons.length > 1) {
			seasonItem.dropdown = options.allSeasons
				.filter(season => season.season_number !== 0) // Filter out specials
				.sort((a, b) => a.season_number - b.season_number) // Sort by season number
				.map(season => {
					// Handle different Riven data structures
					let rivenSeason = null;
					if (options.rivenData) {
						if (options.rivenData.seasons) {
							// Full show data structure
							rivenSeason = options.rivenData.seasons.find((s: any) => s.number === season.season_number);
						}
					}
					
					return {
						label: `Season ${season.season_number}`,
						href: `/tv/${options.mediaId}/${season.season_number}`,
						isActive: season.season_number === options.seasonNumber,
						badge: rivenSeason ? statesName[rivenSeason.state] : undefined
					};
				});
		}

		items.push(seasonItem);
	}

	// Add episode if available
	if (options.episodeNumber !== undefined && options.mediaType === 'tv') {
		const episodeItem: BreadcrumbItem = {
			label: options.episodeTitle || `Episode ${options.episodeNumber}`,
			href: `/tv/${options.mediaId}/${options.seasonNumber}/${options.episodeNumber}`,
			isActive: true
		};

		// Add dropdown for other episodes if available
		if (options.allEpisodes && options.allEpisodes.length > 1) {
			// Get the current season's riven data
			let currentSeasonRivenData = null;
			if (options.rivenData) {
				if (options.rivenData.episodes) {
					// We already have season-level data
					currentSeasonRivenData = options.rivenData;
				} else if (options.rivenData.seasons) {
					// We have show-level data, find the current season
					currentSeasonRivenData = options.rivenData.seasons.find((s: any) => s.number === options.seasonNumber);
				}
			}

			episodeItem.dropdown = options.allEpisodes
				.sort((a, b) => a.episode_number - b.episode_number) // Sort by episode number
				.map(episode => {
					// Find the riven episode data
					let rivenEpisode = null;
					if (currentSeasonRivenData && currentSeasonRivenData.episodes) {
						rivenEpisode = currentSeasonRivenData.episodes.find((e: any) => e.number === episode.episode_number);
					}
					
					return {
						label: `E${episode.episode_number}: ${episode.name || `Episode ${episode.episode_number}`}`,
						href: `/tv/${options.mediaId}/${options.seasonNumber}/${episode.episode_number}`,
						isActive: episode.episode_number === options.episodeNumber,
						badge: rivenEpisode ? statesName[rivenEpisode.state] : undefined
					};
				});
		}

		items.push(episodeItem);
	}

	return items;
} 