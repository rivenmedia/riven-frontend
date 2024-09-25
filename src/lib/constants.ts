export const statesName: Record<string, string> = {
	Unknown: 'Unknown',
	Requested: 'Requested',
	Indexed: 'Indexed',
	Scraped: 'Scraped',
	Downloaded: 'Downloaded',
	Symlinked: 'Symlinked',
	Completed: 'Completed',
	PartiallyCompleted: 'Partially Completed',
	Failed: 'Failed',
	Ongoing: 'Ongoing',
	Unreleased: 'Unreleased'
};

export const servicesObject: Record<string, string> = {
	symlinklibrary: 'Symlink Library',
	traktindexer: 'Trakt Indexer',
	overseerr: 'Overseerr',
	plex_watchlist: 'Plex Watchlist',
	listrr: 'Listrr',
	mdblist: 'MDB List',
	trakt: 'Trakt',
	scraping: 'Scraping',
	annatar: 'Annatar',
	torrentio: 'Torrentio',
	knightcrawler: 'Knightcrawler',
	orionoid: 'Orionoid',
	jackett: 'Jackett',
	torbox: 'Torbox',
	mediafusion: 'Media Fusion',
	Prowlarr: 'Prowlarr',
	zilean: 'Zilean',
	comet: 'Comet',
	symlink: 'Symlink',
	updater: 'Updater',
	plexupdater: 'Plex Updater',
	post_processing: 'Post Processing',
	subliminal: 'Subliminal'
};

export const coreServices = [
	'symlinklibrary',
	'symlink',
	'scraping',
	'updater',
	'post_processing',
	'subliminal'
];
export const downloaderServices = ['torbox'];
export const contentServices = ['mdblist', 'overseerr', 'plex_watchlist', 'listrr', 'trakt'];
export const scrapingServices = [
	'torrentio',
	'knightcrawler',
	'annatar',
	'jackett',
	'orionoid',
	'mediafusion',
	'Prowlarr',
	'zilean',
	'torbox',
	'comet'
];
