import type { ParsedSearchQuery, TMDBParams, TVDBParams } from '$lib/search-parser';

/**
 * Builds a query string for TMDB API requests
 *
 * @param parsed - Parsed search query
 * @param page - Page number
 * @param searchMode - Optional search mode override
 * @returns URL query string
 */
export function buildTMDBQueryString(
	parsed: ParsedSearchQuery,
	page: number,
	searchMode?: string
): string {
	const params = new URLSearchParams({ page: page.toString() });

	// Add search mode
	const mode = searchMode || parsed.searchMode;
	params.set('searchMode', mode);

	// Add TMDB parameters
	Object.entries(parsed.tmdbParams).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			params.set(key, String(value));
		}
	});

	return params.toString();
}

/**
 * Builds a query string for TVDB API requests
 *
 * @param parsed - Parsed search query
 * @param page - Page number
 * @returns URL query string
 */
export function buildTVDBQueryString(parsed: ParsedSearchQuery, page: number): string {
	const params = new URLSearchParams({ page: page.toString() });

	// Add type (always series for TV)
	params.set('type', 'series');

	// Add TVDB parameters
	Object.entries(parsed.tvdbParams).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			params.set(key, String(value));
		}
	});

	return params.toString();
}

/**
 * Builds query parameters object for TMDB API (for direct API calls)
 *
 * @param parsed - Parsed search query
 * @param page - Page number
 * @returns Query parameters object
 */
export function buildTMDBParams(parsed: ParsedSearchQuery, page: number): TMDBParams {
	return {
		...parsed.tmdbParams,
		page
	};
}

/**
 * Builds query parameters object for TVDB API (for direct API calls)
 *
 * @param parsed - Parsed search query
 * @param page - Page number
 * @returns Query parameters object
 */
export function buildTVDBParams(parsed: ParsedSearchQuery, page: number): Partial<TVDBParams> {
	const limit = 20;
	const offset = (page - 1) * limit;

	return {
		...parsed.tvdbParams,
		type: 'series',
		limit,
		offset
	};
}
