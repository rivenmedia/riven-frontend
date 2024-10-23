import { getMultiSearch } from '$lib/tmdb';

interface ComponentInfo {
	id: string;
	title: string;
	content: string;
	path: string;
}

export interface SearchResult {
	title: string;
	media_type: string;
	path: string;
	excerpt: string;
	type: 'component' | 'media' | 'action';
}

export const componentRegistry: ComponentInfo[] = [
	{
		id: 'settings-about',
		title: 'About Settings',
		content:
			'View information about Riven, including version numbers, support links, and contributors.',
		path: '/settings/about'
	},
	{
		id: 'settings-content',
		title: 'Content Settings',
		content: 'Configure content providers for Riven.',
		path: '/settings/content'
	},
	{
		id: 'settings-general',
		title: 'General Settings',
		content: 'Configure global and default settings for Riven.',
		path: '/settings/general'
	},
	{
		id: 'settings-mediaserver',
		title: 'Media Server Settings',
		content: 'Configure media server settings for Riven.',
		path: '/settings/mediaserver'
	},
	{
		id: 'settings-ranking',
		title: 'Ranking Settings',
		content: 'Configure ranking settings for Riven, including profiles and custom ranks.',
		path: '/settings/ranking'
	},
	{
		id: 'settings-scrapers',
		title: 'Scraper Settings',
		content: 'Configure scraper settings for Riven.',
		path: '/settings/scrapers'
	},
	{
		id: 'settings-layout',
		title: 'Settings Layout',
		content: 'Navigate between different settings pages in Riven.',
		path: '/settings'
	},
	{
		id: 'backend-version',
		title: 'Backend Version',
		content: 'View and check for updates to the Riven backend.',
		path: '/settings/about#backend-version'
	},
	{
		id: 'frontend-version',
		title: 'Frontend Version',
		content: 'View and check for updates to the Riven frontend.',
		path: '/settings/about#frontend-version'
	},
	{
		id: 'rclone-path',
		title: 'Rclone Path',
		content: 'View the configured Rclone path for Riven.',
		path: '/settings/about#rclone-path'
	},
	{
		id: 'library-path',
		title: 'Library Path',
		content: 'View the configured library path for Riven.',
		path: '/settings/about#library-path'
	},
	{
		id: 'support-discord',
		title: 'Discord Support',
		content: 'Get support for Riven through the Discord community.',
		path: '/settings/about#discord'
	},
	{
		id: 'support-github',
		title: 'GitHub Support',
		content: 'Report issues or contribute to Riven on GitHub.',
		path: '/settings/about#github'
	},
	{
		id: 'contributors',
		title: 'Contributors',
		content: 'View the contributors to the Riven project.',
		path: '/settings/about#contributors'
	},
	{
		id: 'ranking-profiles',
		title: 'Ranking Profiles',
		content:
			'Learn about the different ranking profiles available in Riven: default, best, and custom.',
		path: '/settings/ranking#profiles'
	},
	{
		id: 'ranking-wiki',
		title: 'Ranking Wiki',
		content: 'Access detailed information about Riven ranking settings.',
		path: '/settings/ranking#wiki'
	}
];

export async function searchContent(query: string): Promise<SearchResult[]> {
	const lowercaseQuery = query.toLowerCase();

	const results: SearchResult[] = [
		{
			title: `Search as media: "${query}"`,
			media_type: '',
			path: '#',
			excerpt: `Search for "${query}" in TMDB`,
			type: 'action'
		}
	];

	// Search through componentRegistry
	const componentResults = componentRegistry
		.filter(
			(component) =>
				component.id.toLowerCase().includes(lowercaseQuery) ||
				component.title.toLowerCase().includes(lowercaseQuery) ||
				component.content.toLowerCase().includes(lowercaseQuery)
		)
		.map((result) => ({
			title: result.title,
			media_type: '',
			path: result.path,
			excerpt: result.content.substring(0, 100) + '...',
			type: 'component' as const
		}));

	results.push(...componentResults);

	return results;
}

export async function searchTMDB(query: string): Promise<SearchResult[]> {
	try {
		const data = await getMultiSearch(fetch, query);
		return data.results
			.filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
			.map((item) => ({
				title: item.title || item.name || '',
				media_type: item.media_type === 'tv' ? 'Show' : 'Movie',
				path: `/${item.media_type}/${item.id}`,
				excerpt: item.overview
					? item.overview.substring(0, 100) + '...'
					: 'No description available',
				type: 'media' as const,
				posterPath: item.poster_path
					? `https://image.tmdb.org/t/p/w92${item.poster_path}`
					: undefined
			}));
	} catch (error) {
		console.error('Error searching TMDB:', error);
		return [];
	}
}
