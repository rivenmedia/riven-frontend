import type { operations as TVDBOperations } from "./providers/tvdb";

/**
 * Type for TMDB search/discover parameters
 */
export type TMDBParams = {
    query?: string;
    year?: number;
    primary_release_year?: number;
    first_air_date_year?: number;
    language?: string;
    region?: string;
    with_genres?: string;
    without_genres?: string;
    vote_average_gte?: number;
    vote_average_lte?: number;
    vote_count_gte?: number;
    vote_count_lte?: number;
    with_cast?: string;
    with_crew?: string;
    with_companies?: string;
    with_keywords?: string;
    with_networks?: string;
    [key: string]: string | number | boolean | undefined;
};

/**
 * Type for TVDB search parameters
 */
export type TVDBParams = NonNullable<TVDBOperations["getSearchResults"]["parameters"]["query"]>;

/**
 * Search mode type
 */
export type SearchMode = "search" | "discover" | "hybrid";

/**
 * Parsed search result with metadata for both providers
 */
export interface ParsedSearchQuery {
    query: string;
    tmdbParams: TMDBParams;
    tvdbParams: Partial<TVDBParams>;
    searchMode: SearchMode;
    warnings: string[];
}

/**
 * Parameter shortcuts with provider support annotations
 */
const SHORTCUTS: Record<string, { tmdb?: string; tvdb?: string }> = {
    // Query shortcuts
    q: { tmdb: "query", tvdb: "query" },

    // Year shortcuts - both providers
    y: { tmdb: "year", tvdb: "year" },
    year: { tmdb: "year", tvdb: "year" },
    pry: { tmdb: "primary_release_year" },
    fay: { tmdb: "first_air_date_year" },

    // Language - both providers (but different formats)
    lang: { tmdb: "language", tvdb: "language" },
    language: { tmdb: "language", tvdb: "language" },

    // TVDB-specific shortcuts
    country: { tvdb: "country" },
    dir: { tvdb: "director" },
    director: { tvdb: "director" },
    net: { tvdb: "network" },
    network: { tvdb: "network" },
    comp: { tvdb: "company" },
    company: { tvdb: "company" },
    remote_id: { tvdb: "remote_id" },
    imdb: { tvdb: "remote_id" },

    g: { tmdb: "with_genres", tvdb: "with_genres" },
    genre: { tmdb: "with_genres", tvdb: "with_genres" },
    genres: { tmdb: "with_genres", tvdb: "with_genres" },
    with_genres: { tmdb: "with_genres", tvdb: "with_genres" },
    eg: { tmdb: "without_genres", tvdb: "without_genres" },
    exclude_genres: { tmdb: "without_genres", tvdb: "without_genres" },
    without_genres: { tmdb: "without_genres", tvdb: "without_genres" },

    // TMDB-specific shortcuts
    k: { tmdb: "with_keywords" },
    keywords: { tmdb: "with_keywords" },
    with_keywords: { tmdb: "with_keywords" },

    c: { tmdb: "with_companies" },
    companies: { tmdb: "with_companies" },
    with_companies: { tmdb: "with_companies" },

    va: { tmdb: "vote_average.gte" },
    vote_avg: { tmdb: "vote_average.gte" },
    "vote_average.gte": { tmdb: "vote_average.gte" },
    "vote_average.lte": { tmdb: "vote_average.lte" },

    vc: { tmdb: "vote_count.gte" },
    vote_count: { tmdb: "vote_count.gte" },
    "vote_count.gte": { tmdb: "vote_count.gte" },
    "vote_count.lte": { tmdb: "vote_count.lte" },

    cast: { tmdb: "with_cast" },
    with_cast: { tmdb: "with_cast" },
    crew: { tmdb: "with_crew" },
    with_crew: { tmdb: "with_crew" },

    networks: { tmdb: "with_networks" },
    with_networks: { tmdb: "with_networks" },

    region: { tmdb: "region" },
    sort: { tmdb: "sort_by" },
    sort_by: { tmdb: "sort_by" }
};

/**
 * TMDB Genre name to ID mapping
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
    "science-fiction": 878,
    "sci-fi": 878,
    sf: 878,
    "tv-movie": 10770,
    thriller: 53,
    war: 10752,
    western: 37,
    "action-adventure": 10759,
    kids: 10762,
    news: 10763,
    reality: 10764,
    soap: 10766,
    talk: 10767,
    "war-politics": 10768,
    "sci-fi-fantasy": 10765
};

/**
 * Parses a search query string into provider-specific parameters
 *
 * @param query - The search query string (e.g., "breaking bad y:2008 net:AMC")
 * @returns Parsed query with TMDB and TVDB parameters
 *
 * @example
 * ```ts
 * parseSearchQuery("breaking bad y:2008 net:AMC")
 * // Returns: {
 * //   query: "breaking bad",
 * //   tmdbParams: { query: "breaking bad", year: 2008 },
 * //   tvdbParams: { query: "breaking bad", year: 2008, network: "AMC" },
 * //   searchMode: "search",
 * //   warnings: []
 * // }
 * ```
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
    const tmdbParams: TMDBParams = {};
    const tvdbParams: Partial<TVDBParams> = {};
    const words: string[] = [];
    const warnings: string[] = [];

    // Split by whitespace but keep quoted strings together
    const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

    for (const token of tokens) {
        const colonIndex = token.indexOf(":");

        if (colonIndex > 0 && colonIndex < token.length - 1) {
            const key = token.substring(0, colonIndex).toLowerCase();
            const value = token.substring(colonIndex + 1).replace(/^"(.*)"$/, "$1");

            const shortcut = SHORTCUTS[key];

            if (shortcut) {
                let processedValue = value;
                const isGenreParam =
                    shortcut.tmdb === "with_genres" ||
                    shortcut.tmdb === "without_genres" ||
                    shortcut.tvdb === "with_genres" ||
                    shortcut.tvdb === "without_genres";
                // Resolve genre names to IDs if needed
                if (isGenreParam && isNaN(Number(value))) {
                    const genreIds: number[] = [];
                    const genreNames = value.split(/[,|]/);

                    for (const name of genreNames) {
                        const normalized = name.trim().toLowerCase();
                        const genreId = GENRE_MAP[normalized];
                        if (genreId) genreIds.push(genreId);
                    }

                    if (genreIds.length > 0) {
                        const separator = value.includes("|") ? "|" : ",";
                        processedValue = genreIds.join(separator);
                    }
                }

                // Add to TMDB params
                if (shortcut.tmdb) {
                    const paramName = shortcut.tmdb;

                    // Handle numeric parameters
                    if (
                        paramName.includes("year") ||
                        (paramName.includes("vote_") && !paramName.includes("average")) || // vote_count
                        paramName.includes("runtime") ||
                        paramName === "with_networks" ||
                        paramName.includes("vote_average") // decimals allowed
                    ) {
                        const numValue = Number(value);
                        if (!isNaN(numValue)) {
                            tmdbParams[paramName] = numValue;
                        }
                    }
                    // Handle string parameters (including processed genres)
                    else {
                        tmdbParams[paramName] = processedValue;
                    }
                }

                // Add to TVDB params
                if (shortcut.tvdb) {
                    const paramName = shortcut.tvdb as keyof TVDBParams;

                    // TVDB year is numeric
                    if (paramName === "year") {
                        const numValue = Number(value);
                        if (!isNaN(numValue)) {
                            tvdbParams[paramName] = numValue;
                        }
                    }
                    // All other TVDB params are strings
                    else {
                        (tvdbParams as any)[paramName] = processedValue;
                    }
                }

                // Warn if parameter only works with one provider
                if (shortcut.tmdb && !shortcut.tvdb) {
                    warnings.push(`Parameter '${key}' only works with TMDB (movies)`);
                } else if (shortcut.tvdb && !shortcut.tmdb) {
                    warnings.push(`Parameter '${key}' only works with TVDB (TV shows)`);
                }
            }
        } else {
            // Regular search term
            words.push(token.replace(/^"(.*)"$/, "$1"));
        }
    }

    const textQuery = words.join(" ").trim();

    // Add text query to both providers
    if (textQuery) {
        tmdbParams.query = textQuery;
        tvdbParams.query = textQuery;
    }

    // Determine search mode based on text query and params
    let searchMode: SearchMode;
    if (!textQuery && Object.keys(tmdbParams).length === 0) {
        searchMode = "search"; // Empty search
    } else if (!textQuery) {
        searchMode = "discover";
    } else if (Object.keys(tmdbParams).length === 1 && tmdbParams.query) {
        searchMode = "search"; // Only text, no filters
    } else {
        searchMode = "hybrid"; // Text + filters
    }

    return {
        query: textQuery,
        tmdbParams,
        tvdbParams,
        searchMode,
        warnings
    };
}

/**
 * Helper to get available shortcuts
 */
export function getAvailableShortcuts(): Record<string, { tmdb?: string; tvdb?: string }> {
    return { ...SHORTCUTS };
}

/**
 * Helper to get genre mappings
 */
export function getGenreMap(): Record<string, number> {
    return { ...GENRE_MAP };
}
