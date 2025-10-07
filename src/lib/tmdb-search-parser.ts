import type { operations } from './providers/tmdb';

/**
 * Type for TMDB discover movie query parameters
 */
export type TMDBDiscoverMovieParams = NonNullable<
	operations['discover-movie']['parameters']['query']
>;

/**
 * Type for TMDB discover TV query parameters
 */
export type TMDBDiscoverTVParams = NonNullable<operations['discover-tv']['parameters']['query']>;

/**
 * Combined type for both movie and TV discover parameters
 */
export type TMDBDiscoverParams = TMDBDiscoverMovieParams | TMDBDiscoverTVParams;

/**
 * Type for TMDB search movie query parameters
 */
export type TMDBSearchMovieParams = NonNullable<operations['search-movie']['parameters']['query']>;

/**
 * Type for TMDB search TV query parameters
 */
export type TMDBSearchTVParams = NonNullable<operations['search-tv']['parameters']['query']>;

/**
 * Search mode type
 */
export type SearchMode = 'search' | 'discover' | 'hybrid';

/**
 * Parsed search result with metadata
 */
export interface ParsedSearchQuery {
	query: string;
	params: Partial<TMDBDiscoverParams>;
	searchMode: SearchMode;
	searchParams: Partial<TMDBSearchMovieParams | TMDBSearchTVParams>;
	clientFilters: Partial<TMDBDiscoverParams>;
	warnings: string[];
}

/**
 * Shortcut mappings for search parameters
 */
const SHORTCUTS: Record<string, string> = {
	// Year shortcuts
	y: 'year',
	year: 'year',
	pry: 'primary_release_year',
	fay: 'first_air_date_year',

	// Genre shortcuts
	g: 'with_genres',
	genre: 'with_genres',
	genres: 'with_genres',
	with_genres: 'with_genres',
	eg: 'without_genres',
	exclude_genres: 'without_genres',
	without_genres: 'without_genres',

	// Keywords
	k: 'with_keywords',
	keywords: 'with_keywords',
	with_keywords: 'with_keywords',
	ek: 'without_keywords',
	exclude_keywords: 'without_keywords',
	without_keywords: 'without_keywords',

	// Companies
	c: 'with_companies',
	companies: 'with_companies',
	with_companies: 'with_companies',
	ec: 'without_companies',
	exclude_companies: 'without_companies',
	without_companies: 'without_companies',

	// Vote average
	va: 'vote_average.gte',
	vote_avg: 'vote_average.gte',
	'vote_average.gte': 'vote_average.gte',
	'vote_average.lte': 'vote_average.lte',

	// Vote count
	vc: 'vote_count.gte',
	vote_count: 'vote_count.gte',
	'vote_count.gte': 'vote_count.gte',
	'vote_count.lte': 'vote_count.lte',

	// Runtime
	rt: 'with_runtime.gte',
	runtime: 'with_runtime.gte',
	'runtime.gte': 'with_runtime.gte',
	'runtime.lte': 'with_runtime.lte',
	'with_runtime.gte': 'with_runtime.gte',
	'with_runtime.lte': 'with_runtime.lte',

	// Dates
	'release_date.gte': 'release_date.gte',
	'release_date.lte': 'release_date.lte',
	'primary_release_date.gte': 'primary_release_date.gte',
	'primary_release_date.lte': 'primary_release_date.lte',
	'air_date.gte': 'air_date.gte',
	'air_date.lte': 'air_date.lte',
	'first_air_date.gte': 'first_air_date.gte',
	'first_air_date.lte': 'first_air_date.lte',

	// Other common filters
	lang: 'language',
	language: 'language',
	region: 'region',
	sort: 'sort_by',
	sort_by: 'sort_by',
	page: 'page',

	// Cast and crew
	cast: 'with_cast',
	with_cast: 'with_cast',
	crew: 'with_crew',
	with_crew: 'with_crew',
	people: 'with_people',
	with_people: 'with_people',

	// Watch providers
	wp: 'with_watch_providers',
	watch_providers: 'with_watch_providers',
	with_watch_providers: 'with_watch_providers',
	ewp: 'without_watch_providers',
	exclude_watch_providers: 'without_watch_providers',
	without_watch_providers: 'without_watch_providers',

	// Origin
	country: 'with_origin_country',
	with_origin_country: 'with_origin_country',
	orig_lang: 'with_original_language',
	original_language: 'with_original_language',
	with_original_language: 'with_original_language',

	// TV specific
	networks: 'with_networks',
	with_networks: 'with_networks',
	status: 'with_status',
	with_status: 'with_status',
	type: 'with_type',
	with_type: 'with_type'
};

/**
 * Filters that are compatible with the /search endpoint
 */
const SEARCH_COMPATIBLE_FILTERS = new Set([
	'year',
	'primary_release_year',
	'first_air_date_year',
	'language',
	'region',
	'include_adult',
	'page'
]);

/**
 * Filters that can be applied client-side on search results
 */
const CLIENT_FILTERABLE = new Set([
	'with_genres',
	'without_genres',
	'vote_average.gte',
	'vote_average.lte',
	'vote_count.gte',
	'vote_count.lte',
	'release_date.gte',
	'release_date.lte',
	'primary_release_date.gte',
	'primary_release_date.lte',
	'air_date.gte',
	'air_date.lte',
	'first_air_date.gte',
	'first_air_date.lte'
]);

/**
 * Filters that are incompatible with text search (discover-only)
 */
const DISCOVER_ONLY_FILTERS = new Set([
	'with_cast',
	'with_crew',
	'with_people',
	'with_companies',
	'without_companies',
	'with_keywords',
	'without_keywords',
	'with_watch_providers',
	'without_watch_providers',
	'with_runtime.gte',
	'with_runtime.lte',
	'with_networks',
	'with_status',
	'with_type',
	'with_release_type',
	'with_origin_country',
	'with_original_language',
	'sort_by',
	'certification',
	'certification.gte',
	'certification.lte',
	'certification_country',
	'watch_region',
	'with_watch_monetization_types',
	'include_video',
	'include_null_first_air_dates',
	'screened_theatrically',
	'timezone'
]);

/**
 * Genre name to ID mapping
 * These are common genres for both movies and TV shows
 */
const GENRE_MAP: Record<string, number> = {
	action: 28,
	adventure: 12,
	animation: 16,
	comedy: 35,
	crime: 80,
	documentary: 99,
	drama: 18,
	family: 10751,
	fantasy: 14,
	history: 36,
	horror: 27,
	music: 10402,
	mystery: 9648,
	romance: 10749,
	'science-fiction': 878,
	'sci-fi': 878,
	sf: 878,
	'tv-movie': 10770,
	thriller: 53,
	war: 10752,
	western: 37,
	// TV specific genres
	'action-adventure': 10759,
	kids: 10762,
	news: 10763,
	reality: 10764,
	soap: 10766,
	talk: 10767,
	'war-politics': 10768,
	'sci-fi-fantasy': 10765
};

/**
 * Parses a search query string into TMDB API parameters with hybrid search support
 *
 * @param query - The search query string (e.g., "inception y:2025 genres:sci-fi")
 * @returns An object containing parsed query, params, and search mode metadata
 *
 * @example
 * ```ts
 * parseSearchQuery("inception y:2025 genres:sci-fi")
 * // Returns: {
 * //   query: "inception",
 * //   params: { year: 2025, with_genres: "878" },
 * //   searchMode: "hybrid",
 * //   searchParams: { query: "inception", year: 2025 },
 * //   clientFilters: { with_genres: "878" },
 * //   warnings: []
 * // }
 *
 * parseSearchQuery("y:2025 g:action va:7")
 * // Returns: {
 * //   query: "",
 * //   params: { year: 2025, with_genres: "28", vote_average.gte: 7 },
 * //   searchMode: "discover",
 * //   searchParams: {},
 * //   clientFilters: {},
 * //   warnings: []
 * // }
 * ```
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
	const params: Record<string, string | number | boolean> = {};
	const words: string[] = [];
	const warnings: string[] = [];

	// Split by whitespace but keep quoted strings together
	const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

	for (const token of tokens) {
		// Check if token contains a colon (parameter)
		const colonIndex = token.indexOf(':');

		if (colonIndex > 0 && colonIndex < token.length - 1) {
			const key = token.substring(0, colonIndex).toLowerCase();
			let value = token.substring(colonIndex + 1);

			// Remove quotes if present
			value = value.replace(/^"(.*)"$/, '$1');

			// Map shortcut to actual parameter name
			const paramName = SHORTCUTS[key];

			if (paramName) {
				// Handle genre names by converting to IDs
				if (
					(paramName === 'with_genres' || paramName === 'without_genres') &&
					isNaN(Number(value))
				) {
					const genreIds: number[] = [];
					const genreNames = value.split(/[,|]/);

					for (const name of genreNames) {
						const normalized = name.trim().toLowerCase();
						const genreId = GENRE_MAP[normalized];
						if (genreId) {
							genreIds.push(genreId);
						}
					}

					if (genreIds.length > 0) {
						// Preserve comma/pipe separators for AND/OR logic
						const separator = value.includes('|') ? '|' : ',';
						params[paramName] = genreIds.join(separator);
					}
				}
				// Handle numeric parameters
				else if (
					paramName.includes('year') ||
					paramName.includes('vote_') ||
					paramName.includes('runtime') ||
					paramName === 'page' ||
					paramName === 'with_networks'
				) {
					const numValue = Number(value);
					if (!isNaN(numValue)) {
						params[paramName] = numValue;
					}
				}
				// Handle boolean parameters
				else if (
					paramName === 'include_adult' ||
					paramName === 'include_video' ||
					paramName === 'include_null_first_air_dates' ||
					paramName === 'screened_theatrically'
				) {
					params[paramName] = value.toLowerCase() === 'true' || value === '1';
				}
				// Handle string parameters
				else {
					params[paramName] = value;
				}
			}
		} else {
			// Regular search term
			words.push(token.replace(/^"(.*)"$/, '$1'));
		}
	}

	const textQuery = words.join(' ').trim();
	const hasTextQuery = textQuery.length > 0;
	const paramKeys = Object.keys(params);

	// Determine search mode
	let searchMode: SearchMode;
	const searchParams: Record<string, string | number | boolean> = {};
	const clientFilters: Record<string, string | number | boolean> = {};

	if (!hasTextQuery) {
		// No text query - use discover endpoint
		searchMode = 'discover';
	} else if (paramKeys.length === 0) {
		// Only text query - use search endpoint
		searchMode = 'search';
		searchParams.query = textQuery;
	} else {
		// Text query + filters - determine if we can use search or need hybrid
		const hasDiscoverOnlyFilters = paramKeys.some((key) => DISCOVER_ONLY_FILTERS.has(key));

		if (hasDiscoverOnlyFilters) {
			// Has filters incompatible with search
			searchMode = 'hybrid';
			searchParams.query = textQuery;

			// Add warnings for discover-only filters
			paramKeys.forEach((key) => {
				if (DISCOVER_ONLY_FILTERS.has(key)) {
					warnings.push(
						`Filter '${key}' is not supported with text search and will be ignored`
					);
				}
			});

			// Separate search-compatible and client-filterable params
			paramKeys.forEach((key) => {
				if (SEARCH_COMPATIBLE_FILTERS.has(key)) {
					searchParams[key] = params[key];
				} else if (CLIENT_FILTERABLE.has(key)) {
					clientFilters[key] = params[key];
				}
			});
		} else {
			// All filters are either search-compatible or client-filterable
			searchMode = 'hybrid';
			searchParams.query = textQuery;

			paramKeys.forEach((key) => {
				if (SEARCH_COMPATIBLE_FILTERS.has(key)) {
					searchParams[key] = params[key];
				} else if (CLIENT_FILTERABLE.has(key)) {
					clientFilters[key] = params[key];
				}
			});
		}
	}

	return {
		query: textQuery,
		params: params as Partial<TMDBDiscoverParams>,
		searchMode,
		searchParams: searchParams as Partial<TMDBSearchMovieParams | TMDBSearchTVParams>,
		clientFilters: clientFilters as Partial<TMDBDiscoverParams>,
		warnings
	};
}

/**
 * Helper function to get available shortcuts
 */
export function getAvailableShortcuts(): Record<string, string> {
	return { ...SHORTCUTS };
}

/**
 * Helper function to get genre mappings
 */
export function getGenreMap(): Record<string, number> {
	return { ...GENRE_MAP };
}
