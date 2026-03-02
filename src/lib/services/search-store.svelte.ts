import { browser } from "$app/environment";
import type { ParsedSearchQuery } from "$lib/search-parser";

import { createScopedLogger } from "$lib/logger";
import { endPerfMark, perfCount, startPerfMark } from "$lib/perf";
import type { TMDBTransformedListItem } from "$lib/providers/parser";

const logger = createScopedLogger("search");

// Redefine SearchResult here to avoid importing server code
export interface SearchResult {
    results: TMDBTransformedListItem[];
    page: number;
    total_pages: number;
    total_results: number;
}

// Filter parameters that can be applied to TMDB searches
export interface FilterParams {
    // Date filters
    "primary_release_date.gte"?: string;
    "primary_release_date.lte"?: string;
    "first_air_date.gte"?: string;
    "first_air_date.lte"?: string;
    // Genre filter
    with_genres?: string;
    // Language filter
    with_original_language?: string;
    // Certification filters (movies only)
    certification_country?: string;
    certification?: string;
    // Runtime filters
    "with_runtime.gte"?: number;
    "with_runtime.lte"?: number;
    // Vote average filters
    "vote_average.gte"?: number;
    "vote_average.lte"?: number;
    // Vote count filters
    "vote_count.gte"?: number;
    "vote_count.lte"?: number;
    // Sort
    sort_by?: string;
}

export class SearchStore {
    searchQuery = $state<string>("");
    rawSearchString = $state<string>("");
    parsedSearch = $state<ParsedSearchQuery | null>(null);
    movieResults = $state<TMDBTransformedListItem[]>([]);
    tvResults = $state<TMDBTransformedListItem[]>([]);
    personResults = $state<TMDBTransformedListItem[]>([]);
    companyResults = $state<TMDBTransformedListItem[]>([]);
    loading = $state<boolean>(false);
    error = $state<string | null>(null);
    moviePage = $state<number>(1);
    tvPage = $state<number>(1);
    personPage = $state<number>(1);
    companyPage = $state<number>(1);
    totalResultsMovie = $state<number>(0);
    totalResultsTV = $state<number>(0);
    totalResultsPerson = $state<number>(0);
    totalResultsCompany = $state<number>(0);
    movieHasMore = $state<boolean>(true);
    tvHasMore = $state<boolean>(true);
    personHasMore = $state<boolean>(true);
    companyHasMore = $state<boolean>(true);
    mediaType = $state<"movie" | "tv" | "person" | "company" | "both">("both");
    warnings = $state<string[]>([]);

    // Additional filter parameters from the filter panel
    filterParams = $state<FilterParams>({});

    // If true, allows searching/fetching even without a query or filters
    // Useful for discovery pages that verify "popular" by default
    allowEmptySearch = $state<boolean>(false);

    // For request cancellation
    abortController: AbortController | null = null;

    #mergedSortedResults = $state<TMDBTransformedListItem[]>([]);
    #mergedMovieRef: TMDBTransformedListItem[] | null = null;
    #mergedTvRef: TMDBTransformedListItem[] | null = null;
    #mergedPersonRef: TMDBTransformedListItem[] | null = null;
    #mergedCompanyRef: TMDBTransformedListItem[] | null = null;

    private ensureMergedSortedResults(): void {
        if (
            this.#mergedMovieRef === this.movieResults &&
            this.#mergedTvRef === this.tvResults &&
            this.#mergedPersonRef === this.personResults &&
            this.#mergedCompanyRef === this.companyResults
        ) {
            return;
        }

        this.#mergedMovieRef = this.movieResults;
        this.#mergedTvRef = this.tvResults;
        this.#mergedPersonRef = this.personResults;
        this.#mergedCompanyRef = this.companyResults;

        const merged = [
            ...this.movieResults,
            ...this.tvResults,
            ...this.personResults,
            ...this.companyResults
        ];

        merged.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        this.#mergedSortedResults = merged;
    }

    private canFetchMediaType(type: "movie" | "tv" | "person" | "company"): boolean {
        if (type === "person" || type === "company") {
            const hasTextQuery = Boolean(this.parsedSearch?.query?.trim());
            if (!hasTextQuery) {
                logger.debug(`Skipping ${type} fetch because text query is empty`);
                return false;
            }
        }

        return true;
    }

    get results() {
        if (this.mediaType === "both") {
            this.ensureMergedSortedResults();
            return this.#mergedSortedResults;
        }
        if (this.mediaType === "movie") return this.movieResults;
        if (this.mediaType === "tv") return this.tvResults;
        if (this.mediaType === "person") return this.personResults;
        if (this.mediaType === "company") return this.companyResults;
        return [];
    }

    get unfilteredResultsCount() {
        if (this.mediaType === "both") {
            return (
                this.movieResults.length +
                this.tvResults.length +
                this.personResults.length +
                this.companyResults.length
            );
        }
        if (this.mediaType === "movie") return this.movieResults.length;
        if (this.mediaType === "tv") return this.tvResults.length;
        if (this.mediaType === "person") return this.personResults.length;
        if (this.mediaType === "company") return this.companyResults.length;
        return 0;
    }

    get totalResults() {
        if (this.mediaType === "both") {
            return (
                this.totalResultsMovie +
                this.totalResultsTV +
                this.totalResultsPerson +
                this.totalResultsCompany
            );
        }
        if (this.mediaType === "movie") return this.totalResultsMovie;
        if (this.mediaType === "tv") return this.totalResultsTV;
        if (this.mediaType === "person") return this.totalResultsPerson;
        if (this.mediaType === "company") return this.totalResultsCompany;
        return 0;
    }

    get hasMore() {
        if (this.mediaType === "both") {
            return this.movieHasMore || this.tvHasMore || this.personHasMore || this.companyHasMore;
        }
        if (this.mediaType === "movie") return this.movieHasMore;
        if (this.mediaType === "tv") return this.tvHasMore;
        if (this.mediaType === "person") return this.personHasMore;
        if (this.mediaType === "company") return this.companyHasMore;
        return false;
    }

    async setMediaType(type: "movie" | "tv" | "person" | "company" | "both") {
        if (this.mediaType === type) return;
        this.mediaType = type;

        if (!this.parsedSearch) return;

        // Simplified Smart Fetch:
        // If we switched to a type and have NO results for it, fetch.
        const needMovies = (type === "movie" || type === "both") && this.movieResults.length === 0;
        const needTV = (type === "tv" || type === "both") && this.tvResults.length === 0;
        const needPerson =
            (type === "person" || type === "both") && this.personResults.length === 0;
        const needCompany =
            (type === "company" || type === "both") && this.companyResults.length === 0;

        if (needMovies || needTV || needPerson || needCompany) {
            await this.fetchMissingMedia(needMovies, needTV, needPerson, needCompany);
        }
    }

    private async fetchMissingMedia(
        needMovies: boolean,
        needTV: boolean,
        needPerson: boolean = false,
        needCompany: boolean = false
    ) {
        this.cancelPendingRequests();
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            this.loading = true;
            this.error = null;

            const promises: Promise<void>[] = [];
            if (needMovies) promises.push(this.fetchMedia("movie", 1, signal));
            if (needTV) promises.push(this.fetchMedia("tv", 1, signal));
            if (needPerson && this.canFetchMediaType("person")) {
                promises.push(this.fetchMedia("person", 1, signal));
            } else if (needPerson) {
                this.personHasMore = false;
                this.totalResultsPerson = 0;
                this.personResults = [];
            }

            if (needCompany && this.canFetchMediaType("company")) {
                promises.push(this.fetchMedia("company", 1, signal));
            } else if (needCompany) {
                this.companyHasMore = false;
                this.totalResultsCompany = 0;
                this.companyResults = [];
            }

            await Promise.all(promises);
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") return;
            logger.error("Error fetching missing media:", error);
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            if (!signal.aborted) {
                this.loading = false;
            }
        }
    }

    syncQuery(parsed: ParsedSearchQuery | null) {
        if (!parsed) {
            this.clear();
            return;
        }

        const newQuery = parsed.query || "";
        const hasFilters =
            Object.keys(parsed.tmdbParams).filter((key) => key !== "query").length > 0;

        // If content is empty and no filters, just clear
        if (!newQuery && !hasFilters) {
            perfCount("search.sync_query.clear");
            this.clear();
            return;
        }

        // Avoid re-searching if nothing has changed (query OR filters)
        // We compare the stringified params to detect changes in filter values
        const queryChanged = this.searchQuery !== newQuery;
        const filtersChanged =
            JSON.stringify(parsed.tmdbParams) !== JSON.stringify(this.parsedSearch?.tmdbParams);

        if (!queryChanged && !filtersChanged) {
            perfCount("search.sync_query.noop", 1, { queryLength: newQuery.length });
            return;
        }

        perfCount("search.sync_query.execute", 1, {
            queryLength: newQuery.length,
            queryChanged,
            filtersChanged
        });

        this.setSearch(newQuery, parsed);
        this.search();
    }

    setSearch(rawString: string, parsed: ParsedSearchQuery) {
        this.rawSearchString = rawString;
        this.searchQuery = parsed.query;
        this.parsedSearch = parsed;
        this.warnings = parsed.warnings;

        // Reset state for new search
        this.moviePage = 1;
        this.tvPage = 1;
        this.personPage = 1;
        this.companyPage = 1;
        this.movieHasMore = true;
        this.tvHasMore = true;
        this.personHasMore = true;
        this.companyHasMore = true;
        this.movieResults = [];
        this.tvResults = [];
        this.personResults = [];
        this.companyResults = [];
        this.totalResultsMovie = 0;
        this.totalResultsTV = 0;
        this.totalResultsPerson = 0;
        this.totalResultsCompany = 0;
    }

    /**
     * Cancel any pending search requests
     */
    cancelPendingRequests(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.loading = false;
    }

    /**
     * Immediate search
     */
    async search(): Promise<void> {
        if (!browser) return;

        const searchMark = startPerfMark("search.run", {
            mediaType: this.mediaType,
            hasQuery: Boolean(this.searchQuery),
            hasFilters: Object.keys(this.filterParams).length > 0
        });

        this.cancelPendingRequests();

        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            this.loading = true;
            this.error = null;
            this.moviePage = 1;
            this.tvPage = 1;

            const runFetchWithTrace = async (
                type: "movie" | "tv" | "person" | "company"
            ): Promise<{
                type: "movie" | "tv" | "person" | "company";
                ok: boolean;
                aborted: boolean;
            }> => {
                if (!this.canFetchMediaType(type)) {
                    if (type === "person") {
                        this.personHasMore = false;
                        this.totalResultsPerson = 0;
                        this.personResults = [];
                    } else if (type === "company") {
                        this.companyHasMore = false;
                        this.totalResultsCompany = 0;
                        this.companyResults = [];
                    }
                    return { type, ok: true, aborted: false };
                }

                const startedAt = performance.now();
                try {
                    await this.fetchMedia(type, 1, signal);
                    return { type, ok: true, aborted: false };
                } catch (err) {
                    if (err instanceof Error && err.name === "AbortError") {
                        return { type, ok: false, aborted: true };
                    }

                    logger.error(`search fetch failed for media type '${type}'`, {
                        mediaType: this.mediaType,
                        rawSearchString: this.rawSearchString,
                        parsedQuery: this.parsedSearch?.query,
                        parsedSearchMode: this.parsedSearch?.searchMode,
                        filterParamKeys: Object.keys(this.filterParams),
                        error: err instanceof Error ? err.message : String(err)
                    });
                    this.clearTypeResults(type);
                    return { type, ok: false, aborted: false };
                } finally {
                    logger.debug(`search fetch completed for media type '${type}'`, {
                        durationMs: Number((performance.now() - startedAt).toFixed(2)),
                        aborted: signal.aborted
                    });
                }
            };

            if (this.mediaType === "both") {
                this.movieResults = [];
                this.tvResults = [];
                this.personResults = [];
                this.companyResults = [];
                this.totalResultsMovie = 0;
                this.totalResultsTV = 0;
                this.totalResultsPerson = 0;
                this.totalResultsCompany = 0;

                if (
                    this.parsedSearch?.searchMode === "discover" &&
                    !this.parsedSearch?.query &&
                    !this.allowEmptySearch
                ) {
                    logger.warn(
                        "Search is in discover mode without text query while mediaType='both'; person/company fetches may fail and abort whole request",
                        {
                            mediaType: this.mediaType,
                            parsedSearchMode: this.parsedSearch.searchMode,
                            filterParamKeys: Object.keys(this.filterParams)
                        }
                    );
                }

                const outcomes = await Promise.all([
                    runFetchWithTrace("movie"),
                    runFetchWithTrace("tv"),
                    runFetchWithTrace("person"),
                    runFetchWithTrace("company")
                ]);

                const movieFailed = outcomes.some(
                    (outcome) => outcome.type === "movie" && !outcome.ok && !outcome.aborted
                );
                const tvFailed = outcomes.some(
                    (outcome) => outcome.type === "tv" && !outcome.ok && !outcome.aborted
                );

                if (!signal.aborted && movieFailed && tvFailed) {
                    this.error = "Failed to fetch movie and TV results";
                }
            } else if (this.mediaType === "movie") {
                this.movieResults = [];
                this.totalResultsMovie = 0;
                const outcome = await runFetchWithTrace("movie");
                if (!outcome.ok && !outcome.aborted) {
                    this.error = "Failed to fetch movie results";
                }
            } else if (this.mediaType === "tv") {
                this.tvResults = [];
                this.totalResultsTV = 0;
                const outcome = await runFetchWithTrace("tv");
                if (!outcome.ok && !outcome.aborted) {
                    this.error = "Failed to fetch TV results";
                }
            } else if (this.mediaType === "person") {
                this.personResults = [];
                this.totalResultsPerson = 0;
                const outcome = await runFetchWithTrace("person");
                if (!outcome.ok && !outcome.aborted) {
                    this.error = "Failed to fetch person results";
                }
            } else if (this.mediaType === "company") {
                this.companyResults = [];
                this.totalResultsCompany = 0;
                const outcome = await runFetchWithTrace("company");
                if (!outcome.ok && !outcome.aborted) {
                    this.error = "Failed to fetch company results";
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                return;
            }
            logger.error("Error searching:", error);
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            if (!signal.aborted) {
                this.loading = false;
            }

            endPerfMark(searchMark, {
                mediaType: this.mediaType,
                totalResults: this.totalResults,
                hasError: Boolean(this.error)
            });
        }
    }

    private deduplicateItems(
        newItems: TMDBTransformedListItem[],
        existingItems: TMDBTransformedListItem[] = []
    ): TMDBTransformedListItem[] {
        const seenIds = new Set(existingItems.map((i) => i.id));
        const uniqueItems: TMDBTransformedListItem[] = [];

        for (const item of newItems) {
            if (item && item.id !== undefined && item.id !== null && !seenIds.has(item.id)) {
                uniqueItems.push(item);
                seenIds.add(item.id);
            }
        }
        return uniqueItems;
    }

    private clearTypeResults(type: "movie" | "tv" | "person" | "company"): void {
        if (type === "movie") {
            this.movieResults = [];
            this.totalResultsMovie = 0;
            this.movieHasMore = false;
            this.moviePage = 1;
            return;
        }

        if (type === "tv") {
            this.tvResults = [];
            this.totalResultsTV = 0;
            this.tvHasMore = false;
            this.tvPage = 1;
            return;
        }

        if (type === "person") {
            this.personResults = [];
            this.totalResultsPerson = 0;
            this.personHasMore = false;
            this.personPage = 1;
            return;
        }

        this.companyResults = [];
        this.totalResultsCompany = 0;
        this.companyHasMore = false;
        this.companyPage = 1;
    }

    /**
     * Set filter parameters and optionally trigger a search
     */
    setFilters(params: FilterParams, triggerSearch = true): void {
        this.filterParams = params;
        logger.debug("setFilters called", {
            params,
            triggerSearch,
            hasParsedSearch: !!this.parsedSearch
        });
        if (triggerSearch && (this.parsedSearch || Object.keys(params).length > 0)) {
            // Reset results when applying new filters
            this.movieResults = [];
            this.tvResults = [];
            this.moviePage = 1;
            this.tvPage = 1;
            this.movieHasMore = true;
            this.tvHasMore = true;
            this.search();
        }
    }

    /**
     * Clear filter parameters
     */
    clearFilters(): void {
        this.filterParams = {};
    }

    /**
     * Build the search endpoint URL for a given type and page
     */
    private buildSearchUrl(type: "movie" | "tv" | "person" | "company", page: number): string {
        // v1.2-compatible mode forcing: only explicit UI filter panel state forces discover mode.
        const hasFilters = Object.keys(this.filterParams).length > 0;

        const parsedTmdbFilterKeys = Object.keys(this.parsedSearch?.tmdbParams ?? {}).filter(
            (key) => key !== "query"
        );
        const uiFilterKeys = Object.keys(this.filterParams);
        const hasTextQuery = Boolean(this.parsedSearch?.query?.trim());

        const parsedSearchMode = this.parsedSearch?.searchMode;
        const normalizedParsedSearchMode =
            parsedSearchMode === "search" ||
                parsedSearchMode === "discover" ||
                parsedSearchMode === "hybrid"
                ? parsedSearchMode
                : "discover";

        let searchMode = hasFilters ? "discover" : normalizedParsedSearchMode;

        // Person/company do not support discover endpoints in TMDB.
        // Keep these on textual search mode when a text query exists.
        if ((type === "person" || type === "company") && hasTextQuery) {
            searchMode = "search";
        }

        logger.debug("buildSearchUrl mode resolution", {
            type,
            page,
            hasTextQuery,
            parsedSearchMode: this.parsedSearch?.searchMode,
            resolvedSearchMode: searchMode,
            hasUiFilters: hasFilters,
            uiFilterKeys,
            hasParsedTmdbFilters: parsedTmdbFilterKeys.length > 0,
            parsedTmdbFilterKeys,
            allowEmptySearch: this.allowEmptySearch
        });

        if ((type === "person" || type === "company") && searchMode === "discover") {
            logger.warn("Building discover-mode search URL for person/company", {
                type,
                page,
                parsedSearchMode: this.parsedSearch?.searchMode,
                hasFilters,
                hasTextQuery: Boolean(this.parsedSearch?.query)
            });
        }

        const combinedParams: Record<string, string | number | boolean> = {
            ...(this.parsedSearch?.tmdbParams || {}),
            ...this.filterParams
        };

        const params: Record<string, string | number | boolean> = {
            page,
            searchMode
        };

        if (type === "person" || type === "company") {
            // Guardrail: person/company routes are text-search only.
            // Do not forward movie/tv discover params.
            if (hasTextQuery) {
                params.query = this.parsedSearch?.query ?? "";
            }

            if (typeof combinedParams.include_adult === "boolean") {
                params.include_adult = combinedParams.include_adult;
            }

            if (typeof combinedParams.language === "string" && combinedParams.language.trim()) {
                params.language = combinedParams.language;
            }

            const droppedKeys = Object.keys(combinedParams).filter(
                (key) => key !== "query" && key !== "include_adult" && key !== "language"
            );

            if (droppedKeys.length > 0) {
                logger.debug("Dropped unsupported person/company params", {
                    type,
                    droppedKeys
                });
            }
        } else {
            Object.assign(params, combinedParams);

            // Remove 'query' param when using discover mode (it's not supported)
            if (searchMode === "discover") {
                delete params.query;
            }
        }

        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== "") {
                searchParams.append(key, String(value));
            }
        }

        return `/api/tmdb/search/${type}?${searchParams.toString()}`;
    }

    /**
     * Fetch search results from the API
     */
    private async fetchSearchResults(
        type: "movie" | "tv" | "person" | "company",
        page: number,
        signal?: AbortSignal
    ): Promise<SearchResult> {
        const endpoint = this.buildSearchUrl(type, page);
        const fetchMark = startPerfMark("search.fetch", {
            type,
            page
        });
        perfCount("search.fetch.request", 1, { type, page });

        let response: Response;

        try {
            response = await fetch(endpoint, { signal });
        } catch (error) {
            const isAbort = error instanceof Error && error.name === "AbortError";
            const isTimeout = error instanceof Error && error.name === "TimeoutError";

            logger.error(`fetch failed for ${type} search`, {
                endpoint,
                error: error instanceof Error ? error.message : String(error),
                isAbort,
                isTimeout
            });

            endPerfMark(fetchMark, {
                type,
                page,
                ok: false,
                failed: true,
                isAbort,
                isTimeout
            });
            throw error;
        }

        endPerfMark(fetchMark, {
            type,
            page,
            status: response.status,
            ok: response.ok
        });

        if (!response.ok) {
            let errorDetail = response.statusText;
            let errorBody = "";
            try {
                const errorJson = await response.json();
                errorDetail = errorJson.message || errorJson.error || errorDetail;
                errorBody = JSON.stringify(errorJson);
            } catch {
                // Not JSON
            }

            logger.warn(`Search API returned non-OK status: ${response.status}`, {
                type,
                page,
                endpoint,
                errorDetail,
                errorBody
            });

            throw new Error(`Failed to fetch ${type}: ${errorDetail} (${response.status})`);
        }

        try {
            return await response.json();
        } catch (err) {
            logger.error(`Failed to parse JSON for ${type} search result`, {
                status: response.status,
                contentType: response.headers.get("content-type"),
                error: err instanceof Error ? err.message : String(err)
            });
            throw new Error(`Failed to parse ${type} search results. Received non-JSON response.`);
        }
    }

    private async fetchMedia(
        type: "movie" | "tv" | "person" | "company",
        page: number,
        signal?: AbortSignal
    ): Promise<void> {
        if (!this.canFetchMediaType(type)) {
            if (type === "person") {
                this.personHasMore = false;
                this.totalResultsPerson = 0;
                this.personResults = [];
            } else if (type === "company") {
                this.companyHasMore = false;
                this.totalResultsCompany = 0;
                this.companyResults = [];
            }
            return;
        }

        // Allow fetch if we have either a parsed search, filter params, or if empty search is allowed
        if (
            !this.parsedSearch &&
            Object.keys(this.filterParams).length === 0 &&
            !this.allowEmptySearch
        )
            return;

        // Type cast for fetchSearchResults strict typing if needed,
        // effectively we support "movie" | "tv" | "person" | "company" now
        const result = await this.fetchSearchResults(type, page, signal);

        if (signal?.aborted) return;

        const items = (result.results || []) as TMDBTransformedListItem[];

        if (page === 1) {
            const uniqueItems = this.deduplicateItems(items);
            if (type === "movie") {
                this.movieResults = uniqueItems;
            } else if (type === "person") {
                this.personResults = uniqueItems;
            } else if (type === "company") {
                this.companyResults = uniqueItems;
            } else {
                this.tvResults = uniqueItems;
            }

            if (this.mediaType === type || this.mediaType === "both") {
                if (type === "movie") {
                    this.totalResultsMovie = result.total_results || 0;
                } else if (type === "person") {
                    this.totalResultsPerson = result.total_results || 0;
                } else if (type === "company") {
                    this.totalResultsCompany = result.total_results || 0;
                } else {
                    this.totalResultsTV = result.total_results || 0;
                }
            }
        } else {
            const currentResults =
                type === "movie"
                    ? this.movieResults
                    : type === "person"
                        ? this.personResults
                        : type === "company"
                            ? this.companyResults
                            : this.tvResults; // This line was already correct.
            const uniqueNewItems = this.deduplicateItems(items, currentResults);

            if (type === "movie") {
                this.movieResults = [...this.movieResults, ...uniqueNewItems];
            } else if (type === "person") {
                this.personResults = [...this.personResults, ...uniqueNewItems];
            } else if (type === "company") {
                this.companyResults = [...this.companyResults, ...uniqueNewItems];
            } else {
                this.tvResults = [...this.tvResults, ...uniqueNewItems];
            }
        }

        if (type === "movie") {
            this.movieHasMore = result.page < result.total_pages;
        } else if (type === "person") {
            this.personHasMore = result.page < result.total_pages;
        } else if (type === "company") {
            this.companyHasMore = result.page < result.total_pages;
        } else {
            this.tvHasMore = result.page < result.total_pages;
        }
    }

    private async loadMoreMedia(
        type: "movie" | "tv" | "person" | "company",
        signal?: AbortSignal
    ): Promise<void> {
        if (!this.canFetchMediaType(type)) {
            if (type === "person") {
                this.personHasMore = false;
            } else if (type === "company") {
                this.companyHasMore = false;
            }
            return;
        }

        // Allow load more if we have either a parsed search, filter params, or if empty search is allowed
        if (
            !this.parsedSearch &&
            Object.keys(this.filterParams).length === 0 &&
            !this.allowEmptySearch
        )
            return;

        let hasMore = false;
        if (type === "movie") hasMore = this.movieHasMore;
        else if (type === "person") hasMore = this.personHasMore;
        else if (type === "company") hasMore = this.companyHasMore;
        else hasMore = this.tvHasMore;

        if (!hasMore) return;

        if (type === "movie") this.moviePage += 1;
        else if (type === "person") this.personPage += 1;
        else if (type === "company") this.companyPage += 1;
        else this.tvPage += 1;

        const page =
            type === "movie"
                ? this.moviePage
                : type === "person"
                    ? this.personPage
                    : type === "company"
                        ? this.companyPage
                        : this.tvPage;

        try {
            const result = await this.fetchSearchResults(type, page, signal);

            if (signal?.aborted) return;

            const newItems = (result.results || []) as TMDBTransformedListItem[];

            if (newItems.length > 0) {
                const currentResults =
                    type === "movie"
                        ? this.movieResults
                        : type === "person"
                            ? this.personResults
                            : type === "company"
                                ? this.companyResults
                                : this.tvResults;
                const uniqueNewItems = this.deduplicateItems(newItems, currentResults);

                if (type === "movie") {
                    this.movieResults = [...this.movieResults, ...uniqueNewItems];
                } else if (type === "person") {
                    this.personResults = [...this.personResults, ...uniqueNewItems];
                } else if (type === "company") {
                    this.companyResults = [...this.companyResults, ...uniqueNewItems];
                } else {
                    this.tvResults = [...this.tvResults, ...uniqueNewItems];
                }
            }

            if (type === "movie") {
                this.movieHasMore = result.page < result.total_pages;
            } else if (type === "person") {
                this.personHasMore = result.page < result.total_pages;
            } else if (type === "company") {
                this.companyHasMore = result.page < result.total_pages;
            } else {
                this.tvHasMore = result.page < result.total_pages;
            }
        } catch (err) {
            if (type === "movie") this.moviePage -= 1;
            else if (type === "person") this.personPage -= 1;
            else if (type === "company") this.companyPage -= 1;
            else this.tvPage -= 1;
            throw err;
        }
    }

    async loadMore(): Promise<void> {
        // Allow load more if we have either a parsed search, filter params, or if empty search is allowed
        const hasSearchOrFilters =
            this.parsedSearch || Object.keys(this.filterParams).length > 0 || this.allowEmptySearch;
        if (!browser || this.loading || !this.hasMore || !hasSearchOrFilters) return;

        const loadMoreMark = startPerfMark("search.load_more", {
            mediaType: this.mediaType
        });

        // Cancel any pending requests
        this.cancelPendingRequests();
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            this.loading = true;
            this.error = null;

            const shouldLoadMovies =
                (this.mediaType === "both" || this.mediaType === "movie") && this.movieHasMore;
            const shouldLoadTV =
                (this.mediaType === "both" || this.mediaType === "tv") && this.tvHasMore;
            const shouldLoadPerson =
                (this.mediaType === "both" || this.mediaType === "person") &&
                this.personHasMore &&
                this.canFetchMediaType("person");
            const shouldLoadCompany =
                (this.mediaType === "both" || this.mediaType === "company") &&
                this.companyHasMore &&
                this.canFetchMediaType("company");

            const promises: Promise<void>[] = [];
            if (shouldLoadMovies) promises.push(this.loadMoreMedia("movie", signal));
            if (shouldLoadTV) promises.push(this.loadMoreMedia("tv", signal));
            if (shouldLoadPerson) promises.push(this.loadMoreMedia("person", signal));
            if (shouldLoadCompany) promises.push(this.loadMoreMedia("company", signal));

            if (promises.length > 0) {
                await Promise.all(promises);
            }
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") return;
            logger.error("Error loading more results:", error);
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            if (!signal.aborted) {
                this.loading = false;
            }

            endPerfMark(loadMoreMark, {
                mediaType: this.mediaType,
                hasError: Boolean(this.error),
                totalResults: this.totalResults
            });
        }
    }

    clear() {
        this.cancelPendingRequests();

        this.searchQuery = "";
        this.rawSearchString = "";
        this.parsedSearch = null;
        this.movieResults = [];
        this.tvResults = [];
        this.personResults = [];
        this.companyResults = [];
        this.moviePage = 1;
        this.tvPage = 1;
        this.personPage = 1;
        this.companyPage = 1;
        this.movieHasMore = true;
        this.tvHasMore = true;
        this.personHasMore = true;
        this.companyHasMore = true;
        this.error = null;
        this.warnings = [];
        this.loading = false;
        this.filterParams = {};
        this.totalResultsMovie = 0;
        this.totalResultsTV = 0;
        this.totalResultsPerson = 0;
        this.totalResultsCompany = 0;
    }

    /**
     * Check if filters or search is active
     */
    get hasActiveSearch(): boolean {
        return !!this.parsedSearch || Object.keys(this.filterParams).length > 0;
    }
}
