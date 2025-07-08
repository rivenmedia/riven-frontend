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

export const TMDB_BASE_URL: string = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL: string = 'https://image.tmdb.org/t/p';

const TMDB_READ_ACCESS_TOKEN: string =
	env.PUBLIC_TMDB_READ_ACCESS_TOKEN ||
	'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNTkxMmVmOWFhM2IxNzg2Zjk3ZTE1NWY1YmQ3ZjY1MSIsInN1YiI6IjY1M2NjNWUyZTg5NGE2MDBmZjE2N2FmYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xrIXsMFJpI1o1j5g2QpQcFP1X3AfRjFA5FlBFO5Naw8';
const HEADERS: Record<string, string> = {
	Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
	'Content-Type': 'application/json;charset=utf-8'
};
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

	const response = await fetch(`${TMDB_BASE_URL}/${mediaType}/${mediaId}/credits?${queryString}`, {
		headers: HEADERS
	});
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

export const TMDB_GENRES: Record<number, string> = {
	28: 'Action',
	12: 'Adventure',
	16: 'Animation',
	35: 'Comedy',
	80: 'Crime',
	99: 'Documentary',
	18: 'Drama',
	10751: 'Family',
	14: 'Fantasy',
	36: 'History',
	27: 'Horror',
	10402: 'Music',
	9648: 'Mystery',
	10749: 'Romance',
	878: 'Science Fiction',
	10770: 'TV Movie',
	53: 'Thriller',
	10752: 'War',
	37: 'Western',
	10759: 'Action & Adventure',
	10762: 'Kids',
	10763: 'News',
	10764: 'Reality',
	10765: 'Sci-Fi & Fantasy',
	10766: 'Soap',
	10767: 'Talk',
	10768: 'War & Politics'
};

export const TMDB_LANGUAGES: { iso_639_1: string; english_name: string; name: string }[] = [
	{
		iso_639_1: 'xx',
		english_name: 'No Language',
		name: 'No Language'
	},
	{
		iso_639_1: 'aa',
		english_name: 'Afar',
		name: ''
	},
	{
		iso_639_1: 'af',
		english_name: 'Afrikaans',
		name: 'Afrikaans'
	},
	{
		iso_639_1: 'ak',
		english_name: 'Akan',
		name: ''
	},
	{
		iso_639_1: 'an',
		english_name: 'Aragonese',
		name: ''
	},
	{
		iso_639_1: 'as',
		english_name: 'Assamese',
		name: ''
	},
	{
		iso_639_1: 'av',
		english_name: 'Avaric',
		name: ''
	},
	{
		iso_639_1: 'ae',
		english_name: 'Avestan',
		name: ''
	},
	{
		iso_639_1: 'ay',
		english_name: 'Aymara',
		name: ''
	},
	{
		iso_639_1: 'az',
		english_name: 'Azerbaijani',
		name: 'Azərbaycan'
	},
	{
		iso_639_1: 'ba',
		english_name: 'Bashkir',
		name: ''
	},
	{
		iso_639_1: 'bm',
		english_name: 'Bambara',
		name: 'Bamanankan'
	},
	{
		iso_639_1: 'bn',
		english_name: 'Bengali',
		name: 'বাংলা'
	},
	{
		iso_639_1: 'bi',
		english_name: 'Bislama',
		name: ''
	},
	{
		iso_639_1: 'bo',
		english_name: 'Tibetan',
		name: ''
	},
	{
		iso_639_1: 'bs',
		english_name: 'Bosnian',
		name: 'Bosanski'
	},
	{
		iso_639_1: 'br',
		english_name: 'Breton',
		name: ''
	},
	{
		iso_639_1: 'ca',
		english_name: 'Catalan',
		name: 'Català'
	},
	{
		iso_639_1: 'cs',
		english_name: 'Czech',
		name: 'Český'
	},
	{
		iso_639_1: 'ch',
		english_name: 'Chamorro',
		name: "Finu' Chamorro"
	},
	{
		iso_639_1: 'ce',
		english_name: 'Chechen',
		name: ''
	},
	{
		iso_639_1: 'cu',
		english_name: 'Slavic',
		name: ''
	},
	{
		iso_639_1: 'cv',
		english_name: 'Chuvash',
		name: ''
	},
	{
		iso_639_1: 'kw',
		english_name: 'Cornish',
		name: ''
	},
	{
		iso_639_1: 'co',
		english_name: 'Corsican',
		name: ''
	},
	{
		iso_639_1: 'cr',
		english_name: 'Cree',
		name: ''
	},
	{
		iso_639_1: 'cy',
		english_name: 'Welsh',
		name: 'Cymraeg'
	},
	{
		iso_639_1: 'da',
		english_name: 'Danish',
		name: 'Dansk'
	},
	{
		iso_639_1: 'de',
		english_name: 'German',
		name: 'Deutsch'
	},
	{
		iso_639_1: 'dv',
		english_name: 'Divehi',
		name: ''
	},
	{
		iso_639_1: 'dz',
		english_name: 'Dzongkha',
		name: ''
	},
	{
		iso_639_1: 'en',
		english_name: 'English',
		name: 'English'
	},
	{
		iso_639_1: 'eo',
		english_name: 'Esperanto',
		name: 'Esperanto'
	},
	{
		iso_639_1: 'et',
		english_name: 'Estonian',
		name: 'Eesti'
	},
	{
		iso_639_1: 'eu',
		english_name: 'Basque',
		name: 'euskera'
	},
	{
		iso_639_1: 'fo',
		english_name: 'Faroese',
		name: ''
	},
	{
		iso_639_1: 'fj',
		english_name: 'Fijian',
		name: ''
	},
	{
		iso_639_1: 'fi',
		english_name: 'Finnish',
		name: 'suomi'
	},
	{
		iso_639_1: 'fr',
		english_name: 'French',
		name: 'Français'
	},
	{
		iso_639_1: 'fy',
		english_name: 'Frisian',
		name: ''
	},
	{
		iso_639_1: 'ff',
		english_name: 'Fulah',
		name: 'Fulfulde'
	},
	{
		iso_639_1: 'gd',
		english_name: 'Gaelic',
		name: ''
	},
	{
		iso_639_1: 'ga',
		english_name: 'Irish',
		name: 'Gaeilge'
	},
	{
		iso_639_1: 'gl',
		english_name: 'Galician',
		name: 'Galego'
	},
	{
		iso_639_1: 'gv',
		english_name: 'Manx',
		name: ''
	},
	{
		iso_639_1: 'gn',
		english_name: 'Guarani',
		name: ''
	},
	{
		iso_639_1: 'gu',
		english_name: 'Gujarati',
		name: ''
	},
	{
		iso_639_1: 'ht',
		english_name: 'Haitian; Haitian Creole',
		name: ''
	},
	{
		iso_639_1: 'ha',
		english_name: 'Hausa',
		name: 'Hausa'
	},
	{
		iso_639_1: 'sh',
		english_name: 'Serbo-Croatian',
		name: ''
	},
	{
		iso_639_1: 'hz',
		english_name: 'Herero',
		name: ''
	},
	{
		iso_639_1: 'ho',
		english_name: 'Hiri Motu',
		name: ''
	},
	{
		iso_639_1: 'hr',
		english_name: 'Croatian',
		name: 'Hrvatski'
	},
	{
		iso_639_1: 'hu',
		english_name: 'Hungarian',
		name: 'Magyar'
	},
	{
		iso_639_1: 'ig',
		english_name: 'Igbo',
		name: ''
	},
	{
		iso_639_1: 'io',
		english_name: 'Ido',
		name: ''
	},
	{
		iso_639_1: 'ii',
		english_name: 'Yi',
		name: ''
	},
	{
		iso_639_1: 'iu',
		english_name: 'Inuktitut',
		name: ''
	},
	{
		iso_639_1: 'ie',
		english_name: 'Interlingue',
		name: ''
	},
	{
		iso_639_1: 'ia',
		english_name: 'Interlingua',
		name: ''
	},
	{
		iso_639_1: 'id',
		english_name: 'Indonesian',
		name: 'Bahasa indonesia'
	},
	{
		iso_639_1: 'ik',
		english_name: 'Inupiaq',
		name: ''
	},
	{
		iso_639_1: 'is',
		english_name: 'Icelandic',
		name: 'Íslenska'
	},
	{
		iso_639_1: 'it',
		english_name: 'Italian',
		name: 'Italiano'
	},
	{
		iso_639_1: 'jv',
		english_name: 'Javanese',
		name: ''
	},
	{
		iso_639_1: 'ja',
		english_name: 'Japanese',
		name: '日本語'
	},
	{
		iso_639_1: 'kl',
		english_name: 'Kalaallisut',
		name: ''
	},
	{
		iso_639_1: 'kn',
		english_name: 'Kannada',
		name: '?????'
	},
	{
		iso_639_1: 'ks',
		english_name: 'Kashmiri',
		name: ''
	},
	{
		iso_639_1: 'ka',
		english_name: 'Georgian',
		name: 'ქართული'
	},
	{
		iso_639_1: 'kr',
		english_name: 'Kanuri',
		name: ''
	},
	{
		iso_639_1: 'kk',
		english_name: 'Kazakh',
		name: 'қазақ'
	},
	{
		iso_639_1: 'km',
		english_name: 'Khmer',
		name: ''
	},
	{
		iso_639_1: 'ki',
		english_name: 'Kikuyu',
		name: ''
	},
	{
		iso_639_1: 'rw',
		english_name: 'Kinyarwanda',
		name: 'Kinyarwanda'
	},
	{
		iso_639_1: 'ky',
		english_name: 'Kirghiz',
		name: '??????'
	},
	{
		iso_639_1: 'kv',
		english_name: 'Komi',
		name: ''
	},
	{
		iso_639_1: 'kg',
		english_name: 'Kongo',
		name: ''
	},
	{
		iso_639_1: 'ko',
		english_name: 'Korean',
		name: '한국어/조선말'
	},
	{
		iso_639_1: 'kj',
		english_name: 'Kuanyama',
		name: ''
	},
	{
		iso_639_1: 'ku',
		english_name: 'Kurdish',
		name: ''
	},
	{
		iso_639_1: 'lo',
		english_name: 'Lao',
		name: ''
	},
	{
		iso_639_1: 'la',
		english_name: 'Latin',
		name: 'Latin'
	},
	{
		iso_639_1: 'lv',
		english_name: 'Latvian',
		name: 'Latviešu'
	},
	{
		iso_639_1: 'li',
		english_name: 'Limburgish',
		name: ''
	},
	{
		iso_639_1: 'ln',
		english_name: 'Lingala',
		name: ''
	},
	{
		iso_639_1: 'lt',
		english_name: 'Lithuanian',
		name: 'Lietuvių'
	},
	{
		iso_639_1: 'lb',
		english_name: 'Letzeburgesch',
		name: ''
	},
	{
		iso_639_1: 'lu',
		english_name: 'Luba-Katanga',
		name: ''
	},
	{
		iso_639_1: 'lg',
		english_name: 'Ganda',
		name: ''
	},
	{
		iso_639_1: 'mh',
		english_name: 'Marshall',
		name: ''
	},
	{
		iso_639_1: 'ml',
		english_name: 'Malayalam',
		name: ''
	},
	{
		iso_639_1: 'mr',
		english_name: 'Marathi',
		name: ''
	},
	{
		iso_639_1: 'mg',
		english_name: 'Malagasy',
		name: ''
	},
	{
		iso_639_1: 'mt',
		english_name: 'Maltese',
		name: 'Malti'
	},
	{
		iso_639_1: 'mo',
		english_name: 'Moldavian',
		name: ''
	},
	{
		iso_639_1: 'mn',
		english_name: 'Mongolian',
		name: ''
	},
	{
		iso_639_1: 'mi',
		english_name: 'Maori',
		name: ''
	},
	{
		iso_639_1: 'ms',
		english_name: 'Malay',
		name: 'Bahasa melayu'
	},
	{
		iso_639_1: 'my',
		english_name: 'Burmese',
		name: ''
	},
	{
		iso_639_1: 'na',
		english_name: 'Nauru',
		name: ''
	},
	{
		iso_639_1: 'nv',
		english_name: 'Navajo',
		name: ''
	},
	{
		iso_639_1: 'nr',
		english_name: 'Ndebele',
		name: ''
	},
	{
		iso_639_1: 'nd',
		english_name: 'Ndebele',
		name: ''
	},
	{
		iso_639_1: 'ng',
		english_name: 'Ndonga',
		name: ''
	},
	{
		iso_639_1: 'ne',
		english_name: 'Nepali',
		name: ''
	},
	{
		iso_639_1: 'nl',
		english_name: 'Dutch',
		name: 'Nederlands'
	},
	{
		iso_639_1: 'nn',
		english_name: 'Norwegian Nynorsk',
		name: ''
	},
	{
		iso_639_1: 'nb',
		english_name: 'Norwegian Bokmål',
		name: 'Bokmål'
	},
	{
		iso_639_1: 'no',
		english_name: 'Norwegian',
		name: 'Norsk'
	},
	{
		iso_639_1: 'ny',
		english_name: 'Chichewa; Nyanja',
		name: ''
	},
	{
		iso_639_1: 'oc',
		english_name: 'Occitan',
		name: ''
	},
	{
		iso_639_1: 'oj',
		english_name: 'Ojibwa',
		name: ''
	},
	{
		iso_639_1: 'or',
		english_name: 'Oriya',
		name: ''
	},
	{
		iso_639_1: 'om',
		english_name: 'Oromo',
		name: ''
	},
	{
		iso_639_1: 'os',
		english_name: 'Ossetian; Ossetic',
		name: ''
	},
	{
		iso_639_1: 'pa',
		english_name: 'Punjabi',
		name: 'ਪੰਜਾਬੀ'
	},
	{
		iso_639_1: 'pi',
		english_name: 'Pali',
		name: ''
	},
	{
		iso_639_1: 'pl',
		english_name: 'Polish',
		name: 'Polski'
	},
	{
		iso_639_1: 'pt',
		english_name: 'Portuguese',
		name: 'Português'
	},
	{
		iso_639_1: 'qu',
		english_name: 'Quechua',
		name: ''
	},
	{
		iso_639_1: 'rm',
		english_name: 'Raeto-Romance',
		name: ''
	},
	{
		iso_639_1: 'ro',
		english_name: 'Romanian',
		name: 'Română'
	},
	{
		iso_639_1: 'rn',
		english_name: 'Rundi',
		name: 'Kirundi'
	},
	{
		iso_639_1: 'ru',
		english_name: 'Russian',
		name: 'Pусский'
	},
	{
		iso_639_1: 'sg',
		english_name: 'Sango',
		name: ''
	},
	{
		iso_639_1: 'sa',
		english_name: 'Sanskrit',
		name: ''
	},
	{
		iso_639_1: 'si',
		english_name: 'Sinhalese',
		name: 'සිංහල'
	},
	{
		iso_639_1: 'sk',
		english_name: 'Slovak',
		name: 'Slovenčina'
	},
	{
		iso_639_1: 'sl',
		english_name: 'Slovenian',
		name: 'Slovenščina'
	},
	{
		iso_639_1: 'se',
		english_name: 'Northern Sami',
		name: ''
	},
	{
		iso_639_1: 'sm',
		english_name: 'Samoan',
		name: ''
	},
	{
		iso_639_1: 'sn',
		english_name: 'Shona',
		name: ''
	},
	{
		iso_639_1: 'sd',
		english_name: 'Sindhi',
		name: ''
	},
	{
		iso_639_1: 'so',
		english_name: 'Somali',
		name: 'Somali'
	},
	{
		iso_639_1: 'st',
		english_name: 'Sotho',
		name: ''
	},
	{
		iso_639_1: 'es',
		english_name: 'Spanish',
		name: 'Español'
	},
	{
		iso_639_1: 'sq',
		english_name: 'Albanian',
		name: 'shqip'
	},
	{
		iso_639_1: 'sc',
		english_name: 'Sardinian',
		name: ''
	},
	{
		iso_639_1: 'sr',
		english_name: 'Serbian',
		name: 'Srpski'
	},
	{
		iso_639_1: 'ss',
		english_name: 'Swati',
		name: ''
	},
	{
		iso_639_1: 'su',
		english_name: 'Sundanese',
		name: ''
	},
	{
		iso_639_1: 'sw',
		english_name: 'Swahili',
		name: 'Kiswahili'
	},
	{
		iso_639_1: 'sv',
		english_name: 'Swedish',
		name: 'svenska'
	},
	{
		iso_639_1: 'ty',
		english_name: 'Tahitian',
		name: ''
	},
	{
		iso_639_1: 'ta',
		english_name: 'Tamil',
		name: 'தமிழ்'
	},
	{
		iso_639_1: 'tt',
		english_name: 'Tatar',
		name: ''
	},
	{
		iso_639_1: 'te',
		english_name: 'Telugu',
		name: 'తెలుగు'
	},
	{
		iso_639_1: 'tg',
		english_name: 'Tajik',
		name: ''
	},
	{
		iso_639_1: 'tl',
		english_name: 'Tagalog',
		name: ''
	},
	{
		iso_639_1: 'th',
		english_name: 'Thai',
		name: 'ภาษาไทย'
	},
	{
		iso_639_1: 'ti',
		english_name: 'Tigrinya',
		name: ''
	},
	{
		iso_639_1: 'to',
		english_name: 'Tonga',
		name: ''
	},
	{
		iso_639_1: 'tn',
		english_name: 'Tswana',
		name: ''
	},
	{
		iso_639_1: 'ts',
		english_name: 'Tsonga',
		name: ''
	},
	{
		iso_639_1: 'tk',
		english_name: 'Turkmen',
		name: ''
	},
	{
		iso_639_1: 'tr',
		english_name: 'Turkish',
		name: 'Türkçe'
	},
	{
		iso_639_1: 'tw',
		english_name: 'Twi',
		name: ''
	},
	{
		iso_639_1: 'ug',
		english_name: 'Uighur',
		name: ''
	},
	{
		iso_639_1: 'uk',
		english_name: 'Ukrainian',
		name: 'Український'
	},
	{
		iso_639_1: 'ur',
		english_name: 'Urdu',
		name: 'اردو'
	},
	{
		iso_639_1: 'uz',
		english_name: 'Uzbek',
		name: 'ozbek'
	},
	{
		iso_639_1: 've',
		english_name: 'Venda',
		name: ''
	},
	{
		iso_639_1: 'vi',
		english_name: 'Vietnamese',
		name: 'Tiếng Việt'
	},
	{
		iso_639_1: 'vo',
		english_name: 'Volapük',
		name: ''
	},
	{
		iso_639_1: 'wa',
		english_name: 'Walloon',
		name: ''
	},
	{
		iso_639_1: 'wo',
		english_name: 'Wolof',
		name: 'Wolof'
	},
	{
		iso_639_1: 'xh',
		english_name: 'Xhosa',
		name: ''
	},
	{
		iso_639_1: 'yi',
		english_name: 'Yiddish',
		name: ''
	},
	{
		iso_639_1: 'za',
		english_name: 'Zhuang',
		name: ''
	},
	{
		iso_639_1: 'zu',
		english_name: 'Zulu',
		name: 'isiZulu'
	},
	{
		iso_639_1: 'ab',
		english_name: 'Abkhazian',
		name: ''
	},
	{
		iso_639_1: 'zh',
		english_name: 'Mandarin',
		name: '普通话'
	},
	{
		iso_639_1: 'ps',
		english_name: 'Pushto',
		name: 'پښتو'
	},
	{
		iso_639_1: 'am',
		english_name: 'Amharic',
		name: ''
	},
	{
		iso_639_1: 'ar',
		english_name: 'Arabic',
		name: 'العربية'
	},
	{
		iso_639_1: 'be',
		english_name: 'Belarusian',
		name: 'беларуская мова'
	},
	{
		iso_639_1: 'bg',
		english_name: 'Bulgarian',
		name: 'български език'
	},
	{
		iso_639_1: 'cn',
		english_name: 'Cantonese',
		name: '广州话 / 廣州話'
	},
	{
		iso_639_1: 'mk',
		english_name: 'Macedonian',
		name: ''
	},
	{
		iso_639_1: 'ee',
		english_name: 'Ewe',
		name: 'Èʋegbe'
	},
	{
		iso_639_1: 'el',
		english_name: 'Greek',
		name: 'ελληνικά'
	},
	{
		iso_639_1: 'fa',
		english_name: 'Persian',
		name: 'فارسی'
	},
	{
		iso_639_1: 'he',
		english_name: 'Hebrew',
		name: 'עִבְרִית'
	},
	{
		iso_639_1: 'hi',
		english_name: 'Hindi',
		name: 'हिन्दी'
	},
	{
		iso_639_1: 'hy',
		english_name: 'Armenian',
		name: ''
	},
	{
		iso_639_1: 'yo',
		english_name: 'Yoruba',
		name: 'Èdè Yorùbá'
	}
];
