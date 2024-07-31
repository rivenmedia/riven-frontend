export const statesName: Record<string, string> = {
	Unknown: 'Unknown',
	Requested: 'Requested',
	Indexed: 'Indexed',
	Scraped: 'Scraped',
	Downloaded: 'Downloaded',
	Symlinked: 'Symlinked',
	Completed: 'Completed',
	PartiallyCompleted: 'Partially Completed',
	Failed: 'Failed'
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
	symlink: 'Symlink',
	updater: 'Updater',
	plexupdater: 'Plex Updater',
	localupdater: 'Local Updater',
	realdebrid: 'Real Debrid',
	torbox_downloader: 'Torbox Downloader'
};

export const coreServices = ['symlinklibrary', 'symlink', 'scraping', 'updater'];
export const downloaderServices = ['realdebrid', 'torbox', 'torbox_downloader'];
export const contentServices = ['mdblist', 'overseerr', 'plex_watchlist', 'listrr', 'trakt'];
export const scrapingServices = [
	'torrentio',
	'knightcrawler',
	'annatar',
	'jackett',
	'orionoid',
	'mediafusion',
	'Prowlarr',
	'zilean'
];
