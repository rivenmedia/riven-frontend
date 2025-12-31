import type { ParsedSearchQuery } from "$lib/search-parser";

/**
 * Builds search parameters for remote function calls (TMDB)
 *
 * @param parsed - Parsed search query
 * @param page - Page number
 * @returns Search parameters object for remote functions
 */
export function buildTMDBSearchParams(
    parsed: ParsedSearchQuery,
    page: number
): Record<string, string | number | undefined> {
    return {
        ...parsed.tmdbParams,
        page,
        searchMode: parsed.searchMode
    };
}

/**
 * Builds search parameters for remote function calls (TVDB)
 *
 * @param parsed - Parsed search query
 * @param page - Page number
 * @returns Search parameters object for remote functions
 */
export function buildTVDBSearchParams(
    parsed: ParsedSearchQuery,
    page: number
): Record<string, string | number | undefined> {
    return {
        ...parsed.tvdbParams,
        page
    };
}
