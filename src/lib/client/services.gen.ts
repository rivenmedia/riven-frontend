// This file is auto-generated by @hey-api/openapi-ts

import { createClient, createConfig, type Options } from '@hey-api/client-fetch';
import type { RootError, RootResponse2, HealthError, HealthResponse, RdError, RdResponse, TorboxError, TorboxResponse, ServicesError, ServicesResponse, TraktOauthInitiateError, TraktOauthInitiateResponse, TraktOauthCallbackData, TraktOauthCallbackError, TraktOauthCallbackResponse, StatsError, StatsResponse2, LogsError, LogsResponse, EventsError, EventsResponse, MountError, MountResponse, OverseerrWebhookOverseerrPostError, OverseerrWebhookOverseerrPostResponse, GetSettingsSchemaError, GetSettingsSchemaResponse, LoadSettingsError, LoadSettingsResponse, SaveSettingsError, SaveSettingsResponse, GetAllSettingsError, GetAllSettingsResponse, GetSettingsData, GetSettingsError, GetSettingsResponse, SetAllSettingsData, SetAllSettingsError, SetAllSettingsResponse, SetSettingsData, SetSettingsError, SetSettingsResponse, GetStatesError, GetStatesResponse, GetItemsData, GetItemsError, GetItemsResponse, AddItemsData, AddItemsError, AddItemsResponse, GetItemData, GetItemError, GetItemResponse, GetItemsByImdbIdsData, GetItemsByImdbIdsError, GetItemsByImdbIdsResponse, ResetItemsData, ResetItemsError, ResetItemsResponse, RetryItemsData, RetryItemsError, RetryItemsResponse, RemoveItemData, RemoveItemError, RemoveItemResponse, SetTorrentRdMagnetData, SetTorrentRdMagnetError, SetTorrentRdMagnetResponse, SetTorrentRdItemsIdSetTorrentRdPostData, SetTorrentRdItemsIdSetTorrentRdPostError, SetTorrentRdItemsIdSetTorrentRdPostResponse, ScrapeData, ScrapeError, ScrapeResponse, GetRdTorrentsData, GetRdTorrentsError, GetRdTorrentsResponse, GetTrendingData, GetTrendingError, GetTrendingResponse, GetMoviesNowPlayingData, GetMoviesNowPlayingError, GetMoviesNowPlayingResponse, GetMoviesPopularData, GetMoviesPopularError, GetMoviesPopularResponse, GetMoviesTopRatedData, GetMoviesTopRatedError, GetMoviesTopRatedResponse, GetMoviesUpcomingData, GetMoviesUpcomingError, GetMoviesUpcomingResponse, GetMovieDetailsData, GetMovieDetailsError, GetMovieDetailsResponse, GetTvAiringTodayData, GetTvAiringTodayError, GetTvAiringTodayResponse, GetTvOnTheAirData, GetTvOnTheAirError, GetTvOnTheAirResponse, GetTvPopularData, GetTvPopularError, GetTvPopularResponse, GetTvTopRatedData, GetTvTopRatedError, GetTvTopRatedResponse, GetTvDetailsData, GetTvDetailsError, GetTvDetailsResponse, GetTvSeasonDetailsData, GetTvSeasonDetailsError, GetTvSeasonDetailsResponse, GetTvEpisodeDetailsData, GetTvEpisodeDetailsError, GetTvEpisodeDetailsResponse, SearchCollectionData, SearchCollectionError, SearchCollectionResponse, SearchMovieData, SearchMovieError, SearchMovieResponse, SearchMultiData, SearchMultiError, SearchMultiResponse, SearchTvData, SearchTvError, SearchTvResponse, GetFromExternalIdData, GetFromExternalIdError, GetFromExternalIdResponse } from './types.gen';

export const client = createClient(createConfig());

export class DefaultService {
    /**
     * Root
     */
    public static root<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<RootResponse2, RootError, ThrowOnError>({
            ...options,
            url: '/'
        });
    }
    
    /**
     * Health
     */
    public static health<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<HealthResponse, HealthError, ThrowOnError>({
            ...options,
            url: '/health'
        });
    }
    
    /**
     * Get Rd User
     */
    public static rd<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<RdResponse, RdError, ThrowOnError>({
            ...options,
            url: '/rd'
        });
    }
    
    /**
     * Get Torbox User
     */
    public static torbox<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<TorboxResponse, TorboxError, ThrowOnError>({
            ...options,
            url: '/torbox'
        });
    }
    
    /**
     * Get Services
     */
    public static services<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<ServicesResponse, ServicesError, ThrowOnError>({
            ...options,
            url: '/services'
        });
    }
    
    /**
     * Initiate Trakt Oauth
     */
    public static traktOauthInitiate<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<TraktOauthInitiateResponse, TraktOauthInitiateError, ThrowOnError>({
            ...options,
            url: '/trakt/oauth/initiate'
        });
    }
    
    /**
     * Trakt Oauth Callback
     */
    public static traktOauthCallback<ThrowOnError extends boolean = false>(options: Options<TraktOauthCallbackData, ThrowOnError>) {
        return (options?.client ?? client).get<TraktOauthCallbackResponse, TraktOauthCallbackError, ThrowOnError>({
            ...options,
            url: '/trakt/oauth/callback'
        });
    }
    
    /**
     * Get Stats
     */
    public static stats<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<StatsResponse2, StatsError, ThrowOnError>({
            ...options,
            url: '/stats'
        });
    }
    
    /**
     * Get Logs
     */
    public static logs<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<LogsResponse, LogsError, ThrowOnError>({
            ...options,
            url: '/logs'
        });
    }
    
    /**
     * Get Events
     */
    public static events<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<EventsResponse, EventsError, ThrowOnError>({
            ...options,
            url: '/events'
        });
    }
    
    /**
     * Get Rclone Files
     * Get all files in the rclone mount.
     */
    public static mount<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<MountResponse, MountError, ThrowOnError>({
            ...options,
            url: '/mount'
        });
    }
    
    /**
     * Overseerr
     * Webhook for Overseerr
     */
    public static overseerrWebhookOverseerrPost<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).post<OverseerrWebhookOverseerrPostResponse, OverseerrWebhookOverseerrPostError, ThrowOnError>({
            ...options,
            url: '/webhook/overseerr'
        });
    }
    
}

export class SettingsService {
    /**
     * Get Settings Schema
     * Get the JSON schema for the settings.
     */
    public static getSettingsSchema<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<GetSettingsSchemaResponse, GetSettingsSchemaError, ThrowOnError>({
            ...options,
            url: '/settings/schema'
        });
    }
    
    /**
     * Load Settings
     */
    public static loadSettings<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<LoadSettingsResponse, LoadSettingsError, ThrowOnError>({
            ...options,
            url: '/settings/load'
        });
    }
    
    /**
     * Save Settings
     */
    public static saveSettings<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).post<SaveSettingsResponse, SaveSettingsError, ThrowOnError>({
            ...options,
            url: '/settings/save'
        });
    }
    
    /**
     * Get All Settings
     */
    public static getAllSettings<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<GetAllSettingsResponse, GetAllSettingsError, ThrowOnError>({
            ...options,
            url: '/settings/get/all'
        });
    }
    
    /**
     * Get Settings
     */
    public static getSettings<ThrowOnError extends boolean = false>(options: Options<GetSettingsData, ThrowOnError>) {
        return (options?.client ?? client).get<GetSettingsResponse, GetSettingsError, ThrowOnError>({
            ...options,
            url: '/settings/get/{paths}'
        });
    }
    
    /**
     * Set All Settings
     */
    public static setAllSettings<ThrowOnError extends boolean = false>(options: Options<SetAllSettingsData, ThrowOnError>) {
        return (options?.client ?? client).post<SetAllSettingsResponse, SetAllSettingsError, ThrowOnError>({
            ...options,
            url: '/settings/set/all'
        });
    }
    
    /**
     * Set Settings
     */
    public static setSettings<ThrowOnError extends boolean = false>(options: Options<SetSettingsData, ThrowOnError>) {
        return (options?.client ?? client).post<SetSettingsResponse, SetSettingsError, ThrowOnError>({
            ...options,
            url: '/settings/set'
        });
    }
    
}

export class ItemsService {
    /**
     * Get States
     */
    public static getStates<ThrowOnError extends boolean = false>(options?: Options<unknown, ThrowOnError>) {
        return (options?.client ?? client).get<GetStatesResponse, GetStatesError, ThrowOnError>({
            ...options,
            url: '/items/states'
        });
    }
    
    /**
     * Retrieve Media Items
     * Fetch media items with optional filters and pagination
     */
    public static getItems<ThrowOnError extends boolean = false>(options?: Options<GetItemsData, ThrowOnError>) {
        return (options?.client ?? client).get<GetItemsResponse, GetItemsError, ThrowOnError>({
            ...options,
            url: '/items'
        });
    }
    
    /**
     * Add Media Items
     * Add media items with bases on imdb IDs
     */
    public static addItems<ThrowOnError extends boolean = false>(options?: Options<AddItemsData, ThrowOnError>) {
        return (options?.client ?? client).post<AddItemsResponse, AddItemsError, ThrowOnError>({
            ...options,
            url: '/items/add'
        });
    }
    
    /**
     * Retrieve Media Item
     * Fetch a single media item by ID
     */
    public static getItem<ThrowOnError extends boolean = false>(options: Options<GetItemData, ThrowOnError>) {
        return (options?.client ?? client).get<GetItemResponse, GetItemError, ThrowOnError>({
            ...options,
            url: '/items/{id}'
        });
    }
    
    /**
     * Retrieve Media Items By IMDb IDs
     * Fetch media items by IMDb IDs
     */
    public static getItemsByImdbIds<ThrowOnError extends boolean = false>(options: Options<GetItemsByImdbIdsData, ThrowOnError>) {
        return (options?.client ?? client).get<GetItemsByImdbIdsResponse, GetItemsByImdbIdsError, ThrowOnError>({
            ...options,
            url: '/items/{imdb_ids}'
        });
    }
    
    /**
     * Reset Media Items
     * Reset media items with bases on item IDs
     */
    public static resetItems<ThrowOnError extends boolean = false>(options: Options<ResetItemsData, ThrowOnError>) {
        return (options?.client ?? client).post<ResetItemsResponse, ResetItemsError, ThrowOnError>({
            ...options,
            url: '/items/reset'
        });
    }
    
    /**
     * Retry Media Items
     * Retry media items with bases on item IDs
     */
    public static retryItems<ThrowOnError extends boolean = false>(options: Options<RetryItemsData, ThrowOnError>) {
        return (options?.client ?? client).post<RetryItemsResponse, RetryItemsError, ThrowOnError>({
            ...options,
            url: '/items/retry'
        });
    }
    
    /**
     * Remove Media Items
     * Remove media items based on item IDs
     */
    public static removeItem<ThrowOnError extends boolean = false>(options: Options<RemoveItemData, ThrowOnError>) {
        return (options?.client ?? client).delete<RemoveItemResponse, RemoveItemError, ThrowOnError>({
            ...options,
            url: '/items/remove'
        });
    }
    
    /**
     * Set Torrent Rd Magnet
     * Set a torrent for a media item using a magnet link.
     */
    public static setTorrentRdMagnet<ThrowOnError extends boolean = false>(options: Options<SetTorrentRdMagnetData, ThrowOnError>) {
        return (options?.client ?? client).post<SetTorrentRdMagnetResponse, SetTorrentRdMagnetError, ThrowOnError>({
            ...options,
            url: '/items/{id}/set_torrent_rd_magnet'
        });
    }
    
    /**
     * Set Torrent Rd
     * Set a torrent for a media item using RD torrent ID.
     */
    public static setTorrentRdItemsIdSetTorrentRdPost<ThrowOnError extends boolean = false>(options: Options<SetTorrentRdItemsIdSetTorrentRdPostData, ThrowOnError>) {
        return (options?.client ?? client).post<SetTorrentRdItemsIdSetTorrentRdPostResponse, SetTorrentRdItemsIdSetTorrentRdPostError, ThrowOnError>({
            ...options,
            url: '/items/{id}/set_torrent_rd'
        });
    }
    
}

export class ScrapeService {
    /**
     * Scrape Media Item
     * Scrape media item based on IMDb ID.
     */
    public static scrape<ThrowOnError extends boolean = false>(options: Options<ScrapeData, ThrowOnError>) {
        return (options?.client ?? client).get<ScrapeResponse, ScrapeError, ThrowOnError>({
            ...options,
            url: '/scrape'
        });
    }
    
    /**
     * Get Real-Debrid Torrents
     * Get torrents from Real-Debrid.
     */
    public static getRdTorrents<ThrowOnError extends boolean = false>(options?: Options<GetRdTorrentsData, ThrowOnError>) {
        return (options?.client ?? client).get<GetRdTorrentsResponse, GetRdTorrentsError, ThrowOnError>({
            ...options,
            url: '/scrape/rd'
        });
    }
    
}

export class TmdbService {
    /**
     * Get Trending
     */
    public static getTrending<ThrowOnError extends boolean = false>(options: Options<GetTrendingData, ThrowOnError>) {
        return (options?.client ?? client).get<GetTrendingResponse, GetTrendingError, ThrowOnError>({
            ...options,
            url: '/tmdb/trending/{type}/{window}'
        });
    }
    
    /**
     * Get Movies Now Playing
     */
    public static getMoviesNowPlaying<ThrowOnError extends boolean = false>(options?: Options<GetMoviesNowPlayingData, ThrowOnError>) {
        return (options?.client ?? client).get<GetMoviesNowPlayingResponse, GetMoviesNowPlayingError, ThrowOnError>({
            ...options,
            url: '/tmdb/movie/now_playing'
        });
    }
    
    /**
     * Get Movies Popular
     */
    public static getMoviesPopular<ThrowOnError extends boolean = false>(options?: Options<GetMoviesPopularData, ThrowOnError>) {
        return (options?.client ?? client).get<GetMoviesPopularResponse, GetMoviesPopularError, ThrowOnError>({
            ...options,
            url: '/tmdb/movie/popular'
        });
    }
    
    /**
     * Get Movies Top Rated
     */
    public static getMoviesTopRated<ThrowOnError extends boolean = false>(options?: Options<GetMoviesTopRatedData, ThrowOnError>) {
        return (options?.client ?? client).get<GetMoviesTopRatedResponse, GetMoviesTopRatedError, ThrowOnError>({
            ...options,
            url: '/tmdb/movie/top_rated'
        });
    }
    
    /**
     * Get Movies Upcoming
     */
    public static getMoviesUpcoming<ThrowOnError extends boolean = false>(options?: Options<GetMoviesUpcomingData, ThrowOnError>) {
        return (options?.client ?? client).get<GetMoviesUpcomingResponse, GetMoviesUpcomingError, ThrowOnError>({
            ...options,
            url: '/tmdb/movie/upcoming'
        });
    }
    
    /**
     * Get Movie Details
     */
    public static getMovieDetails<ThrowOnError extends boolean = false>(options: Options<GetMovieDetailsData, ThrowOnError>) {
        return (options?.client ?? client).get<GetMovieDetailsResponse, GetMovieDetailsError, ThrowOnError>({
            ...options,
            url: '/tmdb/movie/{movie_id}'
        });
    }
    
    /**
     * Get Tv Airing Today
     */
    public static getTvAiringToday<ThrowOnError extends boolean = false>(options?: Options<GetTvAiringTodayData, ThrowOnError>) {
        return (options?.client ?? client).get<GetTvAiringTodayResponse, GetTvAiringTodayError, ThrowOnError>({
            ...options,
            url: '/tmdb/tv/airing_today'
        });
    }
    
    /**
     * Get Tv On The Air
     */
    public static getTvOnTheAir<ThrowOnError extends boolean = false>(options?: Options<GetTvOnTheAirData, ThrowOnError>) {
        return (options?.client ?? client).get<GetTvOnTheAirResponse, GetTvOnTheAirError, ThrowOnError>({
            ...options,
            url: '/tmdb/tv/on_the_air'
        });
    }
    
    /**
     * Get Tv Popular
     */
    public static getTvPopular<ThrowOnError extends boolean = false>(options?: Options<GetTvPopularData, ThrowOnError>) {
        return (options?.client ?? client).get<GetTvPopularResponse, GetTvPopularError, ThrowOnError>({
            ...options,
            url: '/tmdb/tv/popular'
        });
    }
    
    /**
     * Get Tv Top Rated
     */
    public static getTvTopRated<ThrowOnError extends boolean = false>(options?: Options<GetTvTopRatedData, ThrowOnError>) {
        return (options?.client ?? client).get<GetTvTopRatedResponse, GetTvTopRatedError, ThrowOnError>({
            ...options,
            url: '/tmdb/tv/top_rated'
        });
    }
    
    /**
     * Get Tv Details
     */
    public static getTvDetails<ThrowOnError extends boolean = false>(options: Options<GetTvDetailsData, ThrowOnError>) {
        return (options?.client ?? client).get<GetTvDetailsResponse, GetTvDetailsError, ThrowOnError>({
            ...options,
            url: '/tmdb/tv/{series_id}'
        });
    }
    
    /**
     * Get Tv Season Details
     */
    public static getTvSeasonDetails<ThrowOnError extends boolean = false>(options: Options<GetTvSeasonDetailsData, ThrowOnError>) {
        return (options?.client ?? client).get<GetTvSeasonDetailsResponse, GetTvSeasonDetailsError, ThrowOnError>({
            ...options,
            url: '/tmdb/tv/{series_id}/season/{season_number}'
        });
    }
    
    /**
     * Get Tv Episode Details
     */
    public static getTvEpisodeDetails<ThrowOnError extends boolean = false>(options: Options<GetTvEpisodeDetailsData, ThrowOnError>) {
        return (options?.client ?? client).get<GetTvEpisodeDetailsResponse, GetTvEpisodeDetailsError, ThrowOnError>({
            ...options,
            url: '/tmdb/tv/{series_id}/season/{season_number}/episode/{episode_number}'
        });
    }
    
    /**
     * Search Collection
     */
    public static searchCollection<ThrowOnError extends boolean = false>(options: Options<SearchCollectionData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchCollectionResponse, SearchCollectionError, ThrowOnError>({
            ...options,
            url: '/tmdb/search/collection'
        });
    }
    
    /**
     * Search Movie
     */
    public static searchMovie<ThrowOnError extends boolean = false>(options: Options<SearchMovieData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchMovieResponse, SearchMovieError, ThrowOnError>({
            ...options,
            url: '/tmdb/search/movie'
        });
    }
    
    /**
     * Search Multi
     */
    public static searchMulti<ThrowOnError extends boolean = false>(options: Options<SearchMultiData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchMultiResponse, SearchMultiError, ThrowOnError>({
            ...options,
            url: '/tmdb/search/multi'
        });
    }
    
    /**
     * Search Tv
     */
    public static searchTv<ThrowOnError extends boolean = false>(options: Options<SearchTvData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchTvResponse, SearchTvError, ThrowOnError>({
            ...options,
            url: '/tmdb/search/tv'
        });
    }
    
    /**
     * Get From External Id
     */
    public static getFromExternalId<ThrowOnError extends boolean = false>(options: Options<GetFromExternalIdData, ThrowOnError>) {
        return (options?.client ?? client).get<GetFromExternalIdResponse, GetFromExternalIdError, ThrowOnError>({
            ...options,
            url: '/tmdb/external_id/{external_id}'
        });
    }
    
}