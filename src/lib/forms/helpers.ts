import { type SuperValidated, type Infer } from 'sveltekit-superforms';
import { z } from 'zod';

// General Settings -----------------------------------------------------------------------------------
export const generalSettingsToGet: string[] = [
	'debug',
	'debug_database',
	'log',
	'force_refresh',
	'map_metadata',
	'tracemalloc',
	'symlink',
	'downloaders',
	'database',
	'indexer',
	'notifications',
	'post_processing'
];

export const generalSettingsSchema = z.object({
	debug: z.boolean().default(true),
	debug_database: z.boolean().default(false),
	log: z.boolean().default(true),
	force_refresh: z.boolean().default(false),
	map_metadata: z.boolean().default(false),
	tracemalloc: z.boolean().default(false),
	rclone_path: z.string().min(1),
	library_path: z.string().min(1),
	separate_anime_dirs: z.boolean().default(false),
	repair_symlinks: z.boolean().default(false),
	repair_interval: z.coerce.number().gte(0).int().optional().default(6),
	video_extensions: z.string().array().optional().default([]),
	movie_filesize_mb_min: z.coerce.number().gte(0).int().optional().default(0),
	movie_filesize_mb_max: z.coerce.number().gte(-1).int().optional().default(-1),
	episode_filesize_mb_min: z.coerce.number().gte(0).int().optional().default(0),
	episode_filesize_mb_max: z.coerce.number().gte(-1).int().optional().default(-1),
	proxy_url: z.string().optional().default(''),
	realdebrid_enabled: z.boolean().default(false),
	realdebrid_api_key: z.string().optional().default(''),
	alldebrid_enabled: z.boolean().default(false),
	alldebrid_api_key: z.string().optional().default(''),
	database_host: z
		.string()
		.optional()
		.default('postgresql+psycopg2://postgres:postgres@riven-db:5432/riven'),
	notifications_enabled: z.boolean().default(false),
	notifications_title: z.string().optional().default('Riven completed something'),
	notifications_on_item_type: z.string().array().optional().default([]),
	notifications_service_urls: z.string().array().optional().default([]),
	subliminal_enabled: z.boolean().default(false),
	subliminal_languages: z.string().array().optional().default([]),
	subliminal_providers_opensubtitles_enabled: z.boolean().optional().default(false),
	subliminal_providers_opensubtitles_username: z.string().optional().default(''),
	subliminal_providers_opensubtitles_password: z.string().optional().default(''),
	subliminal_providers_opensubtitlescom_enabled: z.boolean().optional().default(false),
	subliminal_providers_opensubtitlescom_username: z.string().optional().default(''),
	subliminal_providers_opensubtitlescom_password: z.string().optional().default(''),
	indexer_update_interval: z.coerce.number().gte(0).int().optional().default(3600)
});
export type GeneralSettingsSchema = typeof generalSettingsSchema;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generalSettingsToPass(data: any) {
	return {
		debug: data.debug,
		debug_database: data.debug_database,
		log: data.log,
		force_refresh: data.force_refresh,
		map_metadata: data.map_metadata,
		tracemalloc: data.tracemalloc,
		video_extensions: data.downloaders.video_extensions,
		prefer_speed_over_quality: data.downloaders.prefer_speed_over_quality,
		rclone_path: data.symlink.rclone_path,
		library_path: data.symlink.library_path,
		separate_anime_dirs: data.symlink.separate_anime_dirs,
		repair_symlinks: data.symlink.repair_symlinks,
		repair_interval: data.symlink.repair_interval,
		movie_filesize_mb_min: data.downloaders.movie_filesize_mb_min,
		movie_filesize_mb_max: data.downloaders.movie_filesize_mb_max,
		episode_filesize_mb_min: data.downloaders.episode_filesize_mb_min,
		episode_filesize_mb_max: data.downloaders.episode_filesize,
		proxy_url: data.downloaders.proxy_url,
		realdebrid_enabled: data.downloaders.real_debrid.enabled,
		realdebrid_api_key: data.downloaders.real_debrid?.api_key,
		alldebrid_enabled: data.downloaders.all_debrid.enabled,
		alldebrid_api_key: data.downloaders.all_debrid.api_key,
		database_host: data.database.host,
		notifications_enabled: data.notifications.enabled,
		notifications_title: data.notifications.title,
		notifications_on_item_type: data.notifications.on_item_type,
		notifications_service_urls: data.notifications.service_urls,
		subliminal_enabled: data.post_processing.subliminal.enabled,
		subliminal_languages: data.post_processing.subliminal.languages,
		subliminal_providers_opensubtitles_enabled:
			data.post_processing.subliminal.providers.opensubtitles.enabled,
		subliminal_providers_opensubtitles_username:
			data.post_processing.subliminal.providers.opensubtitles.username,
		subliminal_providers_opensubtitles_password:
			data.post_processing.subliminal.providers.opensubtitles.password,
		subliminal_providers_opensubtitlescom_enabled:
			data.post_processing.subliminal.providers.opensubtitlescom.enabled,
		subliminal_providers_opensubtitlescom_username:
			data.post_processing.subliminal.providers.opensubtitlescom.username,
		subliminal_providers_opensubtitlescom_password:
			data.post_processing.subliminal.providers.opensubtitlescom.password,
		indexer_update_interval: data.indexer.update_interval
	};
}

export function generalSettingsToSet(form: SuperValidated<Infer<GeneralSettingsSchema>>) {
	return [
		{
			key: 'debug',
			value: form.data.debug
		},
		{
			key: 'debug_database',
			value: form.data.debug_database
		},
		{
			key: 'log',
			value: form.data.log
		},
		{
			key: 'force_refresh',
			value: form.data.force_refresh
		},
		{
			key: 'map_metadata',
			value: form.data.map_metadata
		},
		{
			key: 'tracemalloc',
			value: form.data.tracemalloc
		},
		{
			key: 'symlink',
			value: {
				rclone_path: form.data.rclone_path,
				library_path: form.data.library_path,
				separate_anime_dirs: form.data.separate_anime_dirs,
				repair_symlinks: form.data.repair_symlinks,
				repair_interval: form.data.repair_interval
			}
		},
		{
			key: 'downloaders',
			value: {
				video_extensions: form.data.video_extensions,
				movie_filesize_mb_min: form.data.movie_filesize_mb_min,
				movie_filesize_mb_max: form.data.movie_filesize_mb_max,
				episode_filesize_mb_min: form.data.episode_filesize_mb_min,
				episode_filesize_mb_max: form.data.episode_filesize_mb_max,
				proxy_url: form.data.proxy_url,
				real_debrid: {
					enabled: form.data.realdebrid_enabled,
					api_key: form.data.realdebrid_api_key
				},
				all_debrid: {
					enabled: form.data.alldebrid_enabled,
					api_key: form.data.alldebrid_api_key
				}
			}
		},
		{
			key: 'database',
			value: {
				host: form.data.database_host
			}
		},
		{
			key: 'indexer',
			value: {
				update_interval: form.data.indexer_update_interval
			}
		},
		{
			key: 'notifications',
			value: {
				enabled: form.data.notifications_enabled,
				title: form.data.notifications_title,
				on_item_type: form.data.notifications_on_item_type,
				service_urls: form.data.notifications_service_urls
			}
		},
		{
			key: 'post_processing',
			value: {
				subliminal: {
					enabled: form.data.subliminal_enabled,
					languages: form.data.subliminal_languages,
					providers: {
						opensubtitles: {
							enabled: form.data.subliminal_providers_opensubtitles_enabled,
							username: form.data.subliminal_providers_opensubtitles_username,
							password: form.data.subliminal_providers_opensubtitles_password
						},
						opensubtitlescom: {
							enabled: form.data.subliminal_providers_opensubtitlescom_enabled,
							username: form.data.subliminal_providers_opensubtitlescom_username,
							password: form.data.subliminal_providers_opensubtitlescom_password
						}
					}
				}
			}
		}
	];
}

// Media Server Settings -----------------------------------------------------------------------------------

export const mediaServerSettingsToGet: string[] = ['updaters'];

export const mediaServerSettingsSchema = z.object({
	// update_interval: z.number().nonnegative().int().optional().default(120), // Moved to coerce due to https://github.com/huntabyte/shadcn-svelte/issues/574
	update_interval: z.coerce.number().gte(0).int().optional().default(120),
	plex_enabled: z.boolean().default(false),
	plex_token: z.string().optional().default(''),
	plex_url: z.string().optional().default(''),
	jellyfin_enabled: z.boolean().default(false),
	jellyfin_token: z.string().optional().default(''),
	jellyfin_url: z.string().optional().default(''),
	emby_enabled: z.boolean().default(false),
	emby_token: z.string().optional().default(''),
	emby_url: z.string().optional().default('')
});
export type MediaServerSettingsSchema = typeof mediaServerSettingsSchema;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mediaServerSettingsToPass(data: any) {
	return {
		update_interval: data.updaters.update_interval,
		plex_token: data.updaters.plex.token,
		plex_url: data.updaters.plex.url,
		plex_enabled: data.updaters.plex.enabled,
		jellyfin_token: data.updaters.jellyfin.api_key,
		jellyfin_url: data.updaters.jellyfin.url,
		jellyfin_enabled: data.updaters.jellyfin.enabled,
		emby_token: data.updaters.emby.api_key,
		emby_url: data.updaters.emby.url,
		emby_enabled: data.updaters.emby.enabled
	};
}

export function mediaServerSettingsToSet(form: SuperValidated<Infer<MediaServerSettingsSchema>>) {
	return [
		{
			key: 'updaters',
			value: {
				update_interval: form.data.update_interval,
				plex: {
					enabled: form.data.plex_enabled,
					token: form.data.plex_token,
					url: form.data.plex_url
				},
				jellyfin: {
					enabled: form.data.jellyfin_enabled,
					api_key: form.data.jellyfin_token,
					url: form.data.jellyfin_url
				},
				emby: {
					enabled: form.data.emby_enabled,
					api_key: form.data.emby_token,
					url: form.data.emby_url
				}
			}
		}
	];
}

// Scrapers Settings -----------------------------------------------------------------------------------

export const scrapersSettingsToGet: string[] = ['scraping'];

export const scrapersSettingsSchema = z.object({
	after_2: z.coerce.number().gte(0).int().default(0.5),
	after_5: z.coerce.number().gte(0).int().default(2),
	after_10: z.coerce.number().gte(0).int().default(24),
	enable_aliases: z.boolean().default(false),
	bucket_limit: z.coerce.number().gte(0).lte(20).int().optional().default(5),
	torrentio_enabled: z.boolean().default(false),
	torrentio_url: z.string().optional().default('https://torrentio.strem.fun'),
	torrentio_timeout: z.coerce.number().gte(0).int().optional().default(30),
	torrentio_ratelimit: z.boolean().default(true),
	torrentio_filter: z
		.string()
		.optional()
		.default('sort=qualitysize%7Cqualityfilter=480p,scr,cam,unknown'),
	knightcrawler_enabled: z.boolean().default(false),
	knightcrawler_url: z.string().optional().default('https://knightcrawler.elfhosted.com/'),
	knightcrawler_timeout: z.coerce.number().gte(0).int().optional().default(30),
	knightcrawler_ratelimit: z.boolean().default(true),
	knightcrawler_filter: z
		.string()
		.optional()
		.default('sort=qualitysize%7Cqualityfilter=480p,scr,cam,unknown'),
	orionoid_enabled: z.boolean().default(false),
	orionoid_api_key: z.string().optional().default(''),
	orionoid_timeout: z.coerce.number().gte(0).int().optional().default(10),
	orionoid_ratelimit: z.boolean().default(true),
	orionoid_cached_results_only: z.boolean().default(false),
	orionoid_parameters_video3d: z.boolean().default(false),
	orionoid_parameters_videoquality: z.string().optional().default('sd_hd8k'),
	orionoid_parameters_limitcount: z.coerce.number().gte(0).int().optional().default(5),
	jackett_enabled: z.boolean().default(false),
	jackett_url: z.string().optional().default('http://localhost:9117'),
	jackett_timeout: z.coerce.number().gte(0).int().optional().default(10),
	jackett_ratelimit: z.boolean().default(true),
	jackett_api_key: z.string().optional().default(''),
	mediafusion_enabled: z.boolean().default(false),
	mediafusion_url: z.string().optional().default('https://mediafusion.elfhosted.com'),
	mediafusion_timeout: z.coerce.number().gte(0).int().optional().default(10),
	mediafusion_ratelimit: z.boolean().default(true),
	prowlarr_enabled: z.boolean().default(false),
	prowlarr_url: z.string().optional().default('http://localhost:9696'),
	prowlarr_timeout: z.coerce.number().gte(0).int().optional().default(10),
	prowlarr_ratelimit: z.boolean().default(true),
	prowlarr_limiter_seconds: z.coerce.number().gte(0).int().optional().default(60),
	prowlarr_api_key: z.string().optional().default(''),
	zilean_enabled: z.boolean().default(false),
	zilean_url: z.string().optional().default('http://localhost:8181'),
	zilean_timeout: z.coerce.number().gte(0).int().optional().default(30),
	zilean_ratelimit: z.boolean().default(true),
	comet_enabled: z.boolean().default(false),
	comet_url: z.string().optional().default('http://localhost:8000'),
	comet_indexers: z.array(z.string()).optional().default([]),
	comet_timeout: z.coerce.number().gte(0).int().optional().default(30),
	comet_ratelimit: z.boolean().default(true)
});
export type ScrapersSettingsSchema = typeof scrapersSettingsSchema;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scrapersSettingsToPass(data: any) {
	return {
		after_2: data.scraping.after_2,
		after_5: data.scraping.after_5,
		after_10: data.scraping.after_10,
		enable_aliases: data.scraping.enable_aliases,
		bucket_limit: data.scraping.bucket_limit,
		torrentio_url: data.scraping.torrentio.url,
		torrentio_enabled: data.scraping.torrentio.enabled,
		torrentio_filter: data.scraping.torrentio.filter,
		torrentio_timeout: data.scraping.torrentio.timeout,
		torrentio_ratelimit: data.scraping.torrentio.ratelimit,
		knightcrawler_url: data.scraping.knightcrawler.url,
		knightcrawler_enabled: data.scraping.knightcrawler.enabled,
		knightcrawler_filter: data.scraping.knightcrawler.filter,
		knightcrawler_timeout: data.scraping.knightcrawler.timeout,
		knightcrawler_ratelimit: data.scraping.knightcrawler.ratelimit,
		orionoid_enabled: data.scraping.orionoid.enabled,
		orionoid_api_key: data.scraping.orionoid.api_key,
		orionoid_timeout: data.scraping.orionoid.timeout,
		orionoid_ratelimit: data.scraping.orionoid.ratelimit,
		orionoid_cached_results_only: data.scraping.orionoid.cached_results_only,
		orionoid_parameters_video3d: data.scraping.orionoid.parameters.video3d,
		orionoid_parameters_videoquality: data.scraping.orionoid.parameters.videoquality,
		orionoid_parameters_limitcount: data.scraping.orionoid.parameters.limitcount,
		jackett_enabled: data.scraping.jackett.enabled,
		jackett_url: data.scraping.jackett.url,
		jackett_api_key: data.scraping.jackett.api_key,
		jackett_timeout: data.scraping.jackett.timeout,
		jackett_ratelimit: data.scraping.jackett.ratelimit,
		mediafusion_url: data.scraping.mediafusion.url,
		mediafusion_enabled: data.scraping.mediafusion.enabled,
		mediafusion_timeout: data.scraping.mediafusion.timeout,
		mediafusion_ratelimit: data.scraping.mediafusion.ratelimit,
		prowlarr_enabled: data.scraping.prowlarr.enabled,
		prowlarr_url: data.scraping.prowlarr.url,
		prowlarr_api_key: data.scraping.prowlarr.api_key,
		prowlarr_timeout: data.scraping.prowlarr.timeout,
		prowlarr_ratelimit: data.scraping.prowlarr.ratelimit,
		prowlarr_limiter_seconds: data.scraping.prowlarr.limiter_seconds,
		zilean_enabled: data.scraping.zilean.enabled,
		zilean_url: data.scraping.zilean.url,
		zilean_timeout: data.scraping.zilean.timeout,
		zilean_ratelimit: data.scraping.zilean.ratelimit,
		comet_enabled: data.scraping.comet.enabled,
		comet_url: data.scraping.comet.url,
		comet_indexers: data.scraping.comet.indexers,
		comet_timeout: data.scraping.comet.timeout,
		comet_ratelimit: data.scraping.comet.ratelimit
	};
}

export function scrapersSettingsToSet(form: SuperValidated<Infer<ScrapersSettingsSchema>>) {
	return [
		{
			key: 'scraping',
			value: {
				after_2: form.data.after_2,
				after_5: form.data.after_5,
				after_10: form.data.after_10,
				enable_aliases: form.data.enable_aliases,
				bucket_limit: form.data.bucket_limit,
				torrentio: {
					enabled: form.data.torrentio_enabled,
					url: form.data.torrentio_url,
					filter: form.data.torrentio_filter,
					timeout: form.data.torrentio_timeout,
					ratelimit: form.data.torrentio_ratelimit
				},
				knightcrawler: {
					enabled: form.data.knightcrawler_enabled,
					url: form.data.knightcrawler_url,
					filter: form.data.knightcrawler_filter,
					timeout: form.data.knightcrawler_timeout,
					ratelimit: form.data.knightcrawler_ratelimit
				},
				orionoid: {
					enabled: form.data.orionoid_enabled,
					api_key: form.data.orionoid_api_key,
					parameters: {
						video3d: form.data.orionoid_parameters_video3d,
						videoquality: form.data.orionoid_parameters_videoquality,
						limitcount: form.data.orionoid_parameters_limitcount
					},
					timeout: form.data.orionoid_timeout,
					ratelimit: form.data.orionoid_ratelimit
				},
				jackett: {
					enabled: form.data.jackett_enabled,
					url: form.data.jackett_url,
					api_key: form.data.jackett_api_key,
					timeout: form.data.jackett_timeout,
					ratelimit: form.data.jackett_ratelimit
				},
				mediafusion: {
					enabled: form.data.mediafusion_enabled,
					url: form.data.mediafusion_url,
					timeout: form.data.mediafusion_timeout,
					ratelimit: form.data.mediafusion_ratelimit
				},
				prowlarr: {
					enabled: form.data.prowlarr_enabled,
					url: form.data.prowlarr_url,
					api_key: form.data.prowlarr_api_key,
					timeout: form.data.prowlarr_timeout,
					ratelimit: form.data.prowlarr_ratelimit,
					limiter_seconds: form.data.prowlarr_limiter_seconds
				},
				zilean: {
					enabled: form.data.zilean_enabled,
					url: form.data.zilean_url,
					timeout: form.data.zilean_timeout,
					ratelimit: form.data.zilean_ratelimit
				},
				comet: {
					enabled: form.data.comet_enabled,
					url: form.data.comet_url,
					indexers: form.data.comet_indexers,
					timeout: form.data.comet_timeout,
					ratelimit: form.data.comet_ratelimit
				}
			}
		}
	];
}

// Content Settings -----------------------------------------------------------------------------------

export const contentSettingsToGet: string[] = ['content'];

export const contentSettingsSchema = z.object({
	overseerr_enabled: z.boolean().default(false),
	overseerr_url: z.string().optional().default(''),
	overseerr_api_key: z.string().optional().default(''),
	overseerr_update_interval: z.coerce.number().gte(0).int().optional().default(30),
	overseerr_use_webhook: z.boolean().optional().default(false),
	mdblist_enabled: z.boolean().default(false),
	mdblist_api_key: z.string().optional().default(''),
	mdblist_update_interval: z.coerce.number().gte(0).int().optional().default(300),
	mdblist_lists: z.string().array().optional().default([]),
	plex_watchlist_enabled: z.boolean().default(false),
	plex_watchlist_rss: z.array(z.string()).optional().default([]),
	plex_watchlist_update_interval: z.coerce.number().gte(0).int().optional().default(60),
	listrr_enabled: z.boolean().default(false),
	listrr_api_key: z.string().optional().default(''),
	listrr_update_interval: z.coerce.number().gte(0).int().optional().default(300),
	listrr_movie_lists: z.string().array().optional().default([]),
	listrr_show_lists: z.string().array().optional().default([]),
	trakt_enabled: z.boolean().default(false),
	trakt_api_key: z.string().optional().default(''),
	trakt_update_interval: z.coerce.number().gte(0).int().optional().default(300),
	trakt_watchlist: z.array(z.string()).optional().default([]),
	trakt_user_lists: z.array(z.string()).optional().default([]),
	trakt_collection: z.array(z.string()).optional().default([]),
	trakt_fetch_trending: z.boolean().default(false),
	trakt_fetch_popular: z.boolean().default(false),
	trakt_trending_count: z.coerce.number().gte(0).int().optional().default(10),
	trakt_popular_count: z.coerce.number().gte(0).int().optional().default(10),
	trakt_fetch_most_watched: z.boolean().default(false),
	trakt_most_watched_count: z.coerce.number().gte(0).int().optional().default(10),
	trakt_most_watched_period: z
		.enum(['daily', 'weekly', 'monthly', 'yearly', 'all'])
		.optional()
		.default('weekly')
});
export type ContentSettingsSchema = typeof contentSettingsSchema;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function contentSettingsToPass(data: any) {
	return {
		overseerr_enabled: data.content.overseerr.enabled,
		overseerr_url: data.content.overseerr?.url,
		overseerr_api_key: data.content.overseerr?.api_key,
		overseerr_update_interval: data.content.overseerr?.update_interval,
		overseerr_use_webhook: data.content.overseerr?.use_webhook,
		mdblist_enabled: data.content.mdblist.enabled,
		mdblist_api_key: data.content.mdblist?.api_key,
		mdblist_update_interval: data.content.mdblist?.update_interval,
		mdblist_lists: data.content.mdblist?.lists,
		plex_watchlist_enabled: data.content.plex_watchlist.enabled,
		plex_watchlist_rss: data.content.plex_watchlist?.rss,
		plex_watchlist_update_interval: data.content.plex_watchlist?.update_interval,
		listrr_enabled: data.content.listrr.enabled,
		listrr_api_key: data.content.listrr?.api_key,
		listrr_update_interval: data.content.listrr?.update_interval,
		listrr_movie_lists: data.content.listrr?.movie_lists,
		listrr_show_lists: data.content.listrr?.show_lists,
		trakt_enabled: data.content.trakt.enabled,
		trakt_api_key: data.content.trakt?.api_key,
		trakt_update_interval: data.content.trakt?.update_interval,
		trakt_watchlist: data.content.trakt?.watchlist,
		trakt_user_lists: data.content.trakt?.user_lists,
		trakt_collection: data.content.trakt?.collection,
		trakt_fetch_trending: data.content.trakt?.fetch_trending,
		trakt_fetch_popular: data.content.trakt?.fetch_popular,
		trakt_trending_count: data.content.trakt?.trending_count,
		trakt_popular_count: data.content.trakt?.popular_count,
		trakt_fetch_most_watched: data.content.trakt.fetch_most_watched,
		trakt_most_watched_count: data.content.trakt.most_watched_count,
		trakt_most_watched_period: data.content.trakt.most_watched_period
	};
}

export function contentSettingsToSet(form: SuperValidated<Infer<ContentSettingsSchema>>) {
	return [
		{
			key: 'content',
			value: {
				overseerr: {
					enabled: form.data.overseerr_enabled,
					url: form.data.overseerr_url,
					api_key: form.data.overseerr_api_key,
					update_interval: form.data.overseerr_update_interval,
					use_webhook: form.data.overseerr_use_webhook
				},
				mdblist: {
					enabled: form.data.mdblist_enabled,
					api_key: form.data.mdblist_api_key,
					update_interval: form.data.mdblist_update_interval,
					lists: form.data.mdblist_lists
				},
				plex_watchlist: {
					enabled: form.data.plex_watchlist_enabled,
					rss: form.data.plex_watchlist_rss,
					update_interval: form.data.plex_watchlist_update_interval
				},
				listrr: {
					enabled: form.data.listrr_enabled,
					api_key: form.data.listrr_api_key,
					update_interval: form.data.listrr_update_interval,
					movie_lists: form.data.listrr_movie_lists,
					show_lists: form.data.listrr_show_lists
				},
				trakt: {
					enabled: form.data.trakt_enabled,
					api_key: form.data.trakt_api_key,
					update_interval: form.data.trakt_update_interval,
					watchlist: form.data.trakt_watchlist,
					user_lists: form.data.trakt_user_lists,
					collection: form.data.trakt_collection,
					fetch_trending: form.data.trakt_fetch_trending,
					fetch_popular: form.data.trakt_fetch_popular,
					trending_count: form.data.trakt_trending_count,
					popular_count: form.data.trakt_popular_count,
					fetch_most_watched: form.data.trakt_fetch_most_watched,
					most_watched_count: form.data.trakt_most_watched_count,
					most_watched_period: form.data.trakt_most_watched_period
				}
			}
		}
	];
}

// Ranking Settings -----------------------------------------------------------------------------------

export const rankingSettingsToGet: string[] = ['ranking'];

export const rankingSettingsSchema = z.object({
	profile: z.enum(['default', 'best', 'custom']).default('default'),
	require: z.array(z.string()).default([]),
	exclude: z.array(z.string()).default([]),
	preferred: z.array(z.string()).default([]),
	resolution_2160p: z.boolean().default(false),
	resolution_1080p: z.boolean().default(false),
	resolution_720p: z.boolean().default(false),
	resolution_480p: z.boolean().default(false),
	resolution_360p: z.boolean().default(false),
	resolution_unknown: z.boolean().default(false),
	title_similarity: z.coerce.number().min(0).max(1).default(0.85),
	remove_all_trash: z.boolean().default(false),
	remove_ranks_under: z.coerce.number().default(-10000),
	remove_unknown_languages: z.boolean().default(false),
	allow_english_in_languages: z.boolean().default(false),
	languages_required: z.array(z.string()).default([]),
	languages_exclude: z.array(z.string()).default([]),
	languages_preferred: z.array(z.string()).default([]),
	// Quality settings
	quality_av1_fetch: z.boolean().default(false),
	quality_av1_use_custom_rank: z.boolean().default(false),
	quality_av1_rank: z.coerce.number().default(0),
	quality_avc_fetch: z.boolean().default(false),
	quality_avc_use_custom_rank: z.boolean().default(false),
	quality_avc_rank: z.coerce.number().default(0),
	quality_bluray_fetch: z.boolean().default(false),
	quality_bluray_use_custom_rank: z.boolean().default(false),
	quality_bluray_rank: z.coerce.number().default(0),
	quality_dvd_fetch: z.boolean().default(false),
	quality_dvd_use_custom_rank: z.boolean().default(false),
	quality_dvd_rank: z.coerce.number().default(0),
	quality_hdtv_fetch: z.boolean().default(false),
	quality_hdtv_use_custom_rank: z.boolean().default(false),
	quality_hdtv_rank: z.coerce.number().default(0),
	quality_hevc_fetch: z.boolean().default(false),
	quality_hevc_use_custom_rank: z.boolean().default(false),
	quality_hevc_rank: z.coerce.number().default(0),
	quality_mpeg_fetch: z.boolean().default(false),
	quality_mpeg_use_custom_rank: z.boolean().default(false),
	quality_mpeg_rank: z.coerce.number().default(0),
	quality_remux_fetch: z.boolean().default(false),
	quality_remux_use_custom_rank: z.boolean().default(false),
	quality_remux_rank: z.coerce.number().default(0),
	quality_vhs_fetch: z.boolean().default(false),
	quality_vhs_use_custom_rank: z.boolean().default(false),
	quality_vhs_rank: z.coerce.number().default(0),
	quality_web_fetch: z.boolean().default(false),
	quality_web_use_custom_rank: z.boolean().default(false),
	quality_web_rank: z.coerce.number().default(0),
	quality_webdl_fetch: z.boolean().default(false),
	quality_webdl_use_custom_rank: z.boolean().default(false),
	quality_webdl_rank: z.coerce.number().default(0),
	quality_webmux_fetch: z.boolean().default(false),
	quality_webmux_use_custom_rank: z.boolean().default(false),
	quality_webmux_rank: z.coerce.number().default(0),
	quality_xvid_fetch: z.boolean().default(false),
	quality_xvid_use_custom_rank: z.boolean().default(false),
	quality_xvid_rank: z.coerce.number().default(0),
	// Rips settings
	rips_bdrip_fetch: z.boolean().default(false),
	rips_bdrip_use_custom_rank: z.boolean().default(false),
	rips_bdrip_rank: z.coerce.number().default(0),
	rips_brrip_fetch: z.boolean().default(false),
	rips_brrip_use_custom_rank: z.boolean().default(false),
	rips_brrip_rank: z.coerce.number().default(0),
	rips_dvdrip_fetch: z.boolean().default(false),
	rips_dvdrip_use_custom_rank: z.boolean().default(false),
	rips_dvdrip_rank: z.coerce.number().default(0),
	rips_hdrip_fetch: z.boolean().default(false),
	rips_hdrip_use_custom_rank: z.boolean().default(false),
	rips_hdrip_rank: z.coerce.number().default(0),
	rips_ppvrip_fetch: z.boolean().default(false),
	rips_ppvrip_use_custom_rank: z.boolean().default(false),
	rips_ppvrip_rank: z.coerce.number().default(0),
	rips_satrip_fetch: z.boolean().default(false),
	rips_satrip_use_custom_rank: z.boolean().default(false),
	rips_satrip_rank: z.coerce.number().default(0),
	rips_tvrip_fetch: z.boolean().default(false),
	rips_tvrip_use_custom_rank: z.boolean().default(false),
	rips_tvrip_rank: z.coerce.number().default(0),
	rips_uhdrip_fetch: z.boolean().default(false),
	rips_uhdrip_use_custom_rank: z.boolean().default(false),
	rips_uhdrip_rank: z.coerce.number().default(0),
	rips_vhsrip_fetch: z.boolean().default(false),
	rips_vhsrip_use_custom_rank: z.boolean().default(false),
	rips_vhsrip_rank: z.coerce.number().default(0),
	rips_webdlrip_fetch: z.boolean().default(false),
	rips_webdlrip_use_custom_rank: z.boolean().default(false),
	rips_webdlrip_rank: z.coerce.number().default(0),
	rips_webrip_fetch: z.boolean().default(false),
	rips_webrip_use_custom_rank: z.boolean().default(false),
	rips_webrip_rank: z.coerce.number().default(0),
	// HDR settings
	hdr_10bit_fetch: z.boolean().default(false),
	hdr_10bit_use_custom_rank: z.boolean().default(false),
	hdr_10bit_rank: z.coerce.number().default(0),
	hdr_dolby_vision_fetch: z.boolean().default(false),
	hdr_dolby_vision_use_custom_rank: z.boolean().default(false),
	hdr_dolby_vision_rank: z.coerce.number().default(0),
	hdr_hdr_fetch: z.boolean().default(false),
	hdr_hdr_use_custom_rank: z.boolean().default(false),
	hdr_hdr_rank: z.coerce.number().default(0),
	hdr_hdr10plus_fetch: z.boolean().default(false),
	hdr_hdr10plus_use_custom_rank: z.boolean().default(false),
	hdr_hdr10plus_rank: z.coerce.number().default(0),
	hdr_sdr_fetch: z.boolean().default(false),
	hdr_sdr_use_custom_rank: z.boolean().default(false),
	hdr_sdr_rank: z.coerce.number().default(0),
	// Audio settings
	audio_aac_fetch: z.boolean().default(false),
	audio_aac_use_custom_rank: z.boolean().default(false),
	audio_aac_rank: z.coerce.number().default(0),
	audio_ac3_fetch: z.boolean().default(false),
	audio_ac3_use_custom_rank: z.boolean().default(false),
	audio_ac3_rank: z.coerce.number().default(0),
	audio_atmos_fetch: z.boolean().default(false),
	audio_atmos_use_custom_rank: z.boolean().default(false),
	audio_atmos_rank: z.coerce.number().default(0),
	audio_dolby_digital_fetch: z.boolean().default(false),
	audio_dolby_digital_use_custom_rank: z.boolean().default(false),
	audio_dolby_digital_rank: z.coerce.number().default(0),
	audio_dolby_digital_plus_fetch: z.boolean().default(false),
	audio_dolby_digital_plus_use_custom_rank: z.boolean().default(false),
	audio_dolby_digital_plus_rank: z.coerce.number().default(0),
	audio_dts_lossy_fetch: z.boolean().default(false),
	audio_dts_lossy_use_custom_rank: z.boolean().default(false),
	audio_dts_lossy_rank: z.coerce.number().default(0),
	audio_dts_lossless_fetch: z.boolean().default(false),
	audio_dts_lossless_use_custom_rank: z.boolean().default(false),
	audio_dts_lossless_rank: z.coerce.number().default(0),
	audio_eac3_fetch: z.boolean().default(false),
	audio_eac3_use_custom_rank: z.boolean().default(false),
	audio_eac3_rank: z.coerce.number().default(0),
	audio_flac_fetch: z.boolean().default(false),
	audio_flac_use_custom_rank: z.boolean().default(false),
	audio_flac_rank: z.coerce.number().default(0),
	audio_mono_fetch: z.boolean().default(false),
	audio_mono_use_custom_rank: z.boolean().default(false),
	audio_mono_rank: z.coerce.number().default(0),
	audio_mp3_fetch: z.boolean().default(false),
	audio_mp3_use_custom_rank: z.boolean().default(false),
	audio_mp3_rank: z.coerce.number().default(0),
	audio_stereo_fetch: z.boolean().default(false),
	audio_stereo_use_custom_rank: z.boolean().default(false),
	audio_stereo_rank: z.coerce.number().default(0),
	audio_surround_fetch: z.boolean().default(false),
	audio_surround_use_custom_rank: z.boolean().default(false),
	audio_surround_rank: z.coerce.number().default(0),
	audio_truehd_fetch: z.boolean().default(false),
	audio_truehd_use_custom_rank: z.boolean().default(false),
	audio_truehd_rank: z.coerce.number().default(0),
	// Extras settings
	extras_3d_fetch: z.boolean().default(false),
	extras_3d_use_custom_rank: z.boolean().default(false),
	extras_3d_rank: z.coerce.number().default(0),
	extras_converted_fetch: z.boolean().default(false),
	extras_converted_use_custom_rank: z.boolean().default(false),
	extras_converted_rank: z.coerce.number().default(0),
	extras_documentary_fetch: z.boolean().default(false),
	extras_documentary_use_custom_rank: z.boolean().default(false),
	extras_documentary_rank: z.coerce.number().default(0),
	extras_dubbed_fetch: z.boolean().default(false),
	extras_dubbed_use_custom_rank: z.boolean().default(false),
	extras_dubbed_rank: z.coerce.number().default(0),
	extras_edition_fetch: z.boolean().default(false),
	extras_edition_use_custom_rank: z.boolean().default(false),
	extras_edition_rank: z.coerce.number().default(0),
	extras_hardcoded_fetch: z.boolean().default(false),
	extras_hardcoded_use_custom_rank: z.boolean().default(false),
	extras_hardcoded_rank: z.coerce.number().default(0),
	extras_network_fetch: z.boolean().default(false),
	extras_network_use_custom_rank: z.boolean().default(false),
	extras_network_rank: z.coerce.number().default(0),
	extras_proper_fetch: z.boolean().default(false),
	extras_proper_use_custom_rank: z.boolean().default(false),
	extras_proper_rank: z.coerce.number().default(0),
	extras_repack_fetch: z.boolean().default(false),
	extras_repack_use_custom_rank: z.boolean().default(false),
	extras_repack_rank: z.coerce.number().default(0),
	extras_retail_fetch: z.boolean().default(false),
	extras_retail_use_custom_rank: z.boolean().default(false),
	extras_retail_rank: z.coerce.number().default(0),
	extras_site_fetch: z.boolean().default(false),
	extras_site_use_custom_rank: z.boolean().default(false),
	extras_site_rank: z.coerce.number().default(0),
	extras_subbed_fetch: z.boolean().default(false),
	extras_subbed_use_custom_rank: z.boolean().default(false),
	extras_subbed_rank: z.coerce.number().default(0),
	extras_upscaled_fetch: z.boolean().default(false),
	extras_upscaled_use_custom_rank: z.boolean().default(false),
	extras_upscaled_rank: z.coerce.number().default(0),
	// Trash settings
	trash_cam_fetch: z.boolean().default(false),
	trash_cam_use_custom_rank: z.boolean().default(false),
	trash_cam_rank: z.coerce.number().default(0),
	trash_clean_audio_fetch: z.boolean().default(false),
	trash_clean_audio_use_custom_rank: z.boolean().default(false),
	trash_clean_audio_rank: z.coerce.number().default(0),
	trash_pdtv_fetch: z.boolean().default(false),
	trash_pdtv_use_custom_rank: z.boolean().default(false),
	trash_pdtv_rank: z.coerce.number().default(0),
	trash_r5_fetch: z.boolean().default(false),
	trash_r5_use_custom_rank: z.boolean().default(false),
	trash_r5_rank: z.coerce.number().default(0),
	trash_screener_fetch: z.boolean().default(false),
	trash_screener_use_custom_rank: z.boolean().default(false),
	trash_screener_rank: z.coerce.number().default(0),
	trash_size_fetch: z.boolean().default(false),
	trash_size_use_custom_rank: z.boolean().default(false),
	trash_size_rank: z.coerce.number().default(0),
	trash_telecine_fetch: z.boolean().default(false),
	trash_telecine_use_custom_rank: z.boolean().default(false),
	trash_telecine_rank: z.coerce.number().default(0),
	trash_telesync_fetch: z.boolean().default(false),
	trash_telesync_use_custom_rank: z.boolean().default(false),
	trash_telesync_rank: z.coerce.number().default(0)
});

export type RankingSettingsSchema = typeof rankingSettingsSchema;

type CustomRank = {
	fetch: boolean;
	use_custom_rank: boolean;
	rank: number;
};

type Ranks = {
	[key: string]: CustomRank;
};

type CustomRanks = {
	quality: Ranks;
	rips: Ranks;
	hdr: Ranks;
	audio: Ranks;
	extras: Ranks;
	trash: Ranks;
};

export type RankingData = {
	ranking: {
		custom_ranks: CustomRanks;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

export function rankingSettingsToPass(data: RankingData) {
	return {
		profile: data.ranking.profile,
		require: data.ranking.require,
		exclude: data.ranking.exclude,
		preferred: data.ranking.preferred,
		resolution_2160p: data.ranking.resolutions['r2160p'],
		resolution_1080p: data.ranking.resolutions['r1080p'],
		resolution_720p: data.ranking.resolutions['r720p'],
		resolution_480p: data.ranking.resolutions['r480p'],
		resolution_360p: data.ranking.resolutions['r360p'],
		resolution_unknown: data.ranking.resolutions.unknown,
		title_similarity: data.ranking.options.title_similarity,
		remove_all_trash: data.ranking.options.remove_all_trash,
		remove_ranks_under: data.ranking.options.remove_ranks_under,
		remove_unknown_languages: data.ranking.options.remove_unknown_languages,
		allow_english_in_languages: data.ranking.options.allow_english_in_languages,
		languages_required: data.ranking.languages.required,
		languages_exclude: data.ranking.languages.exclude,
		languages_preferred: data.ranking.languages.preferred,
		// Quality
		...Object.entries(data.ranking.custom_ranks.quality).reduce(
			(acc, [key, value]: [string, CustomRank]) => ({
				...acc,
				[`quality_${key}_fetch`]: value.fetch,
				[`quality_${key}_use_custom_rank`]: value.use_custom_rank,
				[`quality_${key}_rank`]: value.rank
			}),
			{}
		),
		// Rips
		...Object.entries(data.ranking.custom_ranks.rips).reduce(
			(acc, [key, value]: [string, CustomRank]) => ({
				...acc,
				[`rips_${key}_fetch`]: value.fetch,
				[`rips_${key}_use_custom_rank`]: value.use_custom_rank,
				[`rips_${key}_rank`]: value.rank
			}),
			{}
		),
		// HDR
		...Object.entries(data.ranking.custom_ranks.hdr).reduce(
			(acc, [key, value]: [string, CustomRank]) => ({
				...acc,
				[`hdr_${key}_fetch`]: value.fetch,
				[`hdr_${key}_use_custom_rank`]: value.use_custom_rank,
				[`hdr_${key}_rank`]: value.rank
			}),
			{}
		),
		// Audio
		...Object.entries(data.ranking.custom_ranks.audio).reduce(
			(acc, [key, value]: [string, CustomRank]) => ({
				...acc,
				[`audio_${key}_fetch`]: value.fetch,
				[`audio_${key}_use_custom_rank`]: value.use_custom_rank,
				[`audio_${key}_rank`]: value.rank
			}),
			{}
		),
		// Extras
		...Object.entries(data.ranking.custom_ranks.extras).reduce(
			(acc, [key, value]: [string, CustomRank]) => ({
				...acc,
				[`extras_${key}_fetch`]: value.fetch,
				[`extras_${key}_use_custom_rank`]: value.use_custom_rank,
				[`extras_${key}_rank`]: value.rank
			}),
			{}
		),
		// Trash
		...Object.entries(data.ranking.custom_ranks.trash).reduce(
			(acc, [key, value]: [string, CustomRank]) => ({
				...acc,
				[`trash_${key}_fetch`]: value.fetch,
				[`trash_${key}_use_custom_rank`]: value.use_custom_rank,
				[`trash_${key}_rank`]: value.rank
			}),
			{}
		)
	};
}

export function rankingSettingsToSet(form: SuperValidated<Infer<RankingSettingsSchema>>) {
	// Helper function to group related settings
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function groupCustomRanks(prefix: string, data: Record<string, any>) {
		const grouped: Record<string, { fetch: boolean; use_custom_rank: boolean; rank: number }> = {};

		Object.keys(data)
			.filter((key) => key.startsWith(prefix))
			.forEach((key) => {
				// Remove the prefix first
				let baseName = key.replace(`${prefix}_`, '');

				// Remove the known suffixes
				baseName = baseName
					.replace('_fetch', '')
					.replace('_use_custom_rank', '')
					.replace('_rank', '');

				if (!grouped[baseName]) {
					grouped[baseName] = {
						fetch: false,
						use_custom_rank: false,
						rank: 0
					};
				}

				// Now check which suffix the original key had
				if (key.endsWith('_fetch')) {
					grouped[baseName].fetch = data[key];
				} else if (key.endsWith('_use_custom_rank')) {
					grouped[baseName].use_custom_rank = data[key];
				} else if (key.endsWith('_rank')) {
					grouped[baseName].rank = data[key];
				}
			});

		return grouped;
	}

	return [
		{
			key: 'ranking',
			value: {
				profile: form.data.profile,
				require: form.data.require,
				exclude: form.data.exclude,
				preferred: form.data.preferred,
				resolutions: {
					r2160p: form.data.resolution_2160p,
					r1080p: form.data.resolution_1080p,
					r720p: form.data.resolution_720p,
					r480p: form.data.resolution_480p,
					r360p: form.data.resolution_360p,
					unknown: form.data.resolution_unknown
				},
				options: {
					title_similarity: form.data.title_similarity,
					remove_all_trash: form.data.remove_all_trash,
					remove_ranks_under: form.data.remove_ranks_under,
					remove_unknown_languages: form.data.remove_unknown_languages,
					allow_english_in_languages: form.data.allow_english_in_languages
				},
				languages: {
					required: form.data.languages_required,
					exclude: form.data.languages_exclude,
					preferred: form.data.languages_preferred
				},
				custom_ranks: {
					quality: groupCustomRanks('quality', form.data),
					rips: groupCustomRanks('rips', form.data),
					hdr: groupCustomRanks('hdr', form.data),
					audio: groupCustomRanks('audio', form.data),
					extras: groupCustomRanks('extras', form.data),
					trash: groupCustomRanks('trash', form.data)
				}
			}
		}
	];
}
