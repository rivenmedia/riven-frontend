import { env } from '$env/dynamic/public';

export type TMDBItem = {
    backdrop_path: string | null;
    id: number;
    title: string | null;
    name: string | null;
    original_title: string;
    overview: string;
    poster_path: string | null;
    media_type: 'movie' | 'tv' | 'person';
    adult: boolean;
    original_language: string;
    genre_ids: number[];
    popularity: number;
    release_date?: string;
    first_air_date?: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
};

export interface TMDBSearchResponse {
    page: number;
    results: TMDBItem[];
    total_pages: number;
    total_results: number;
}

const TMDB_READ_ACCESS_TOKEN: string =
    env.PUBLIC_TMDB_READ_ACCESS_TOKEN ||
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNTkxMmVmOWFhM2IxNzg2Zjk3ZTE1NWY1YmQ3ZjY1MSIsInN1YiI6IjY1M2NjNWUyZTg5NGE2MDBmZjE2N2FmYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xrIXsMFJpI1o1j5g2QpQcFP1X3AfRjFA5FlBFO5Naw8';
const HEADERS: Record<string, string> = {
    Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
    'Content-Type': 'application/json;charset=utf-8'
};
const TMDB_BASE_URL: string = 'https://api.themoviedb.org/3';
export const TMDB_LANGUAGE: string = env.PUBLIC_TMDB_LANGUAGE || 'en-US';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dictToQueryString(params: Record<string, any>): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const filteredParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null));
    return new URLSearchParams(filteredParams).toString();
}

export enum MediaType {
    All = 'all',
    Movie = 'movie',
    TV = 'tv',
    Person = 'person'
}

export enum TimeWindow {
    Day = 'day',
    Week = 'week'
}

interface BaseOptions {
    language?: string;
    page?: number;
}

interface TrendingOptions extends BaseOptions {
    mediaType?: MediaType;
    timeWindow?: TimeWindow;
}

interface MovieDetailsOptions extends BaseOptions {
    movieId: string;
    append_to_response?: string | null;
}

interface TVDetailsOptions extends BaseOptions {
    tvId: string;
    append_to_response?: string | null;
}

interface TVSeasonOptions extends TVDetailsOptions {
    seasonNumber: number;
}

interface TVEpisodeOptions extends TVSeasonOptions {
    episodeNumber: number;
}

interface SearchBaseOptions extends BaseOptions {
    query: string;
    include_adult?: boolean;
    region?: string | null;
}

interface MovieSearchOptions extends SearchBaseOptions {
    primary_release_year?: number | null;
    region?: string | null;
    year?: number | null;
}

interface TVSearchOptions extends SearchBaseOptions {
    first_air_date_year?: number | null;
    year?: number | null;
}

interface ExternalIDOptions {
    external_id: string;
    external_source: string;
    language?: string;
}

interface CollectionOptions {
    collectionId: number;
    language?: string;
}

interface CreditsOptions {
    mediaId: string;
    mediaType: string;
    language?: string;
}

interface PersonOptions {
    personId: number;
    language?: string;
    append_to_response?: string | null;
}

type FetchFunction = (url: string, init?: RequestInit) => Promise<Response>;

export async function getTrending(fetch: FetchFunction, options: TrendingOptions = {}) {
    const {
        language = TMDB_LANGUAGE,
        page = 1,
        mediaType = MediaType.Movie,
        timeWindow = TimeWindow.Week
    } = options;

    const params = { language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(
        `${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?${queryString}`,
        { headers: HEADERS }
    );
    if (!response.ok) {
        throw new Error('Failed to fetch trending');
    }
    return await response.json();
}

export async function getMoviesNowPlaying(fetch: FetchFunction, options: BaseOptions = {}) {
    const { language = TMDB_LANGUAGE, page = 1 } = options;
    const params = { language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/movie/now_playing?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch movies');
    }
    return await response.json();
}

export async function getMoviesPopular(fetch: FetchFunction, options: BaseOptions = {}) {
    const { language = TMDB_LANGUAGE, page = 1 } = options;
    const params = { language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/movie/popular?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch movies');
    }
    return await response.json();
}

export async function getMoviesTopRated(fetch: FetchFunction, options: BaseOptions = {}) {
    const { language = TMDB_LANGUAGE, page = 1 } = options;
    const params = { language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/movie/top_rated?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch movies');
    }
    return await response.json();
}

export async function getMoviesUpcoming(fetch: FetchFunction, options: BaseOptions = {}) {
    const { language = TMDB_LANGUAGE, page = 1 } = options;
    const params = { language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/movie/upcoming?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch movies');
    }
    return await response.json();
}

export async function getMovieDetails(fetch: FetchFunction, options: MovieDetailsOptions) {
    const { language = TMDB_LANGUAGE, append_to_response = null, movieId } = options;
    const params = { language, append_to_response };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch movie details');
    }
    return await response.json();
}

export async function getTVAiringToday(fetch: FetchFunction, options: BaseOptions = {}) {
    const { language = TMDB_LANGUAGE, page = 1 } = options;
    const params = { language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/tv/airing_today?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch TV shows');
    }
    return await response.json();
}

export async function getTVOnTheAir(fetch: FetchFunction, options: BaseOptions = {}) {
    const { language = TMDB_LANGUAGE, page = 1 } = options;
    const params = { language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/tv/on_the_air?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch TV shows');
    }
    return await response.json();
}

export async function getTVPopular(fetch: FetchFunction, options: BaseOptions = {}) {
    const { language = TMDB_LANGUAGE, page = 1 } = options;
    const params = { language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/tv/popular?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch TV shows');
    }
    return await response.json();
}

export async function getTVTopRated(fetch: FetchFunction, options: BaseOptions = {}) {
    const { language = TMDB_LANGUAGE, page = 1 } = options;
    const params = { language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/tv/top_rated?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch TV shows');
    }
    return await response.json();
}

export async function getTVDetails(fetch: FetchFunction, options: TVDetailsOptions) {
    const { language = TMDB_LANGUAGE, append_to_response = null, tvId } = options;
    const params = { language, append_to_response };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch TV show details');
    }
    return await response.json();
}

export async function getTVSeasonDetails(fetch: FetchFunction, options: TVSeasonOptions) {
    const { language = TMDB_LANGUAGE, append_to_response = null, tvId, seasonNumber } = options;
    const params = { language, append_to_response };
    const queryString = dictToQueryString(params);

    const response = await fetch(
        `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?${queryString}`,
        { headers: HEADERS }
    );
    if (!response.ok) {
        throw new Error('Failed to fetch TV season details');
    }
    return await response.json();
}

export async function getTVEpisodeDetails(fetch: FetchFunction, options: TVEpisodeOptions) {
    const {
        language = TMDB_LANGUAGE,
        append_to_response = null,
        tvId,
        seasonNumber,
        episodeNumber
    } = options;
    const params = { language, append_to_response };
    const queryString = dictToQueryString(params);

    const response = await fetch(
        `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?${queryString}`,
        { headers: HEADERS }
    );
    if (!response.ok) {
        throw new Error('Failed to fetch TV episode details');
    }
    return await response.json();
}

export async function getFromExternalID(fetch: FetchFunction, options: ExternalIDOptions) {
    const { language = TMDB_LANGUAGE, external_source, external_id } = options;
    const params = { language, external_source };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/find/${external_id}?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch external ID');
    }
    return await response.json();
}

export async function getCollectionSearch(fetch: FetchFunction, options: SearchBaseOptions) {
    const {
        query,
        include_adult = false,
        language = TMDB_LANGUAGE,
        page = 1,
        region = null
    } = options;
    const params = { query, include_adult, language, page, region };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/search/collection?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch collection search');
    }
    return await response.json();
}

export async function getMovieSearch(
    fetch: FetchFunction,
    options: MovieSearchOptions
): Promise<TMDBSearchResponse> {
    const {
        query,
        include_adult = false,
        language = TMDB_LANGUAGE,
        primary_release_year = null,
        page = 1,
        region = null,
        year = null
    } = options;

    const params = { query, include_adult, language, primary_release_year, page, region, year };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/search/movie?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch movie search');
    }
    return await response.json();
}

export async function getMultiSearch(
    fetch: FetchFunction,
    options: SearchBaseOptions
): Promise<TMDBSearchResponse> {
    const { query, include_adult = false, language = TMDB_LANGUAGE, page = 1 } = options;
    const params = { query, include_adult, language, page };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/search/multi?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch multi search');
    }
    return await response.json();
}

export async function getTVSearch(fetch: FetchFunction, options: TVSearchOptions) {
    const {
        query,
        first_air_date_year = null,
        include_adult = false,
        language = TMDB_LANGUAGE,
        page = 1,
        year = null
    } = options;

    const params = { query, first_air_date_year, include_adult, language, page, year };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/search/tv?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch TV search');
    }
    return await response.json();
}

export async function getExternalID(
    fetch: FetchFunction,
    options: { mediaType: string; tmdb_id: number }
) {
    const { mediaType, tmdb_id } = options;

    const response = await fetch(`${TMDB_BASE_URL}/${mediaType}/${tmdb_id}/external_ids`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch external ID');
    }
    return await response.json();
}

export async function getCollection(fetch: FetchFunction, options: CollectionOptions) {
    const { language = TMDB_LANGUAGE, collectionId } = options;
    const params = { language };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/collection/${collectionId}?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch collection details');
    }
    return await response.json();
}

export async function getCredits(fetch: FetchFunction, options: CreditsOptions) {
    const { language = TMDB_LANGUAGE, mediaId, mediaType } = options;
    const params = { language };
    const queryString = dictToQueryString(params);

    const response = await fetch(
        `${TMDB_BASE_URL}/${mediaType}/${mediaId}/credits?${queryString}`,
        {
            headers: HEADERS
        }
    );
    if (!response.ok) {
        throw new Error('Failed to fetch credits');
    }
    return await response.json();
}

export async function getPerson(fetch: FetchFunction, options: PersonOptions) {
    const { language = TMDB_LANGUAGE, append_to_response = null, personId } = options;
    const params = { language, append_to_response };
    const queryString = dictToQueryString(params);

    const response = await fetch(`${TMDB_BASE_URL}/person/${personId}?${queryString}`, {
        headers: HEADERS
    });
    if (!response.ok) {
        throw new Error('Failed to fetch person details');
    }
    return await response.json();
}
