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
	torrentio: 'Torrentio',
	knightcrawler: 'Knightcrawler',
	orionoid: 'Orionoid',
	jackett: 'Jackett',
	realdebrid: 'Real Debrid',
	alldebrid: 'All Debrid',
	torbox: 'Torbox',
	mediafusion: 'Media Fusion',
	prowlarr: 'Prowlarr',
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
export const downloaderServices = ['realdebrid', 'alldebrid', 'torbox'];
export const contentServices = ['mdblist', 'overseerr', 'plex_watchlist', 'listrr', 'trakt'];
export const scrapingServices = [
	'torrentio',
	'knightcrawler',
	'jackett',
	'orionoid',
	'mediafusion',
	'prowlarr',
	'zilean',
	'torbox',
	'comet'
];
