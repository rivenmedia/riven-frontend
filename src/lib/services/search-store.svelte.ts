import { browser } from "$app/environment";
import type { ParsedSearchQuery } from "$lib/search-parser";

import { createScopedLogger } from "$lib/logger";
import type { TMDBTransformedListItem } from "$lib/providers/parser";

const logger = createScopedLogger("search");

// Redefine SearchResult here to avoid importing server code
export interface SearchResult {
    results: TMDBTransformedListItem[];
    page: number;
    total_pages: number;
    total_results: number;
}

// Filter parameters that can be applied to searches
export interface FilterParams {
    [key: string]: string | number | boolean;
}

export class SearchStore {
    searchQuery = $state<string>("");
    rawSearchString = $state<string>("");
    parsedSearch = $state<ParsedSearchQuery | null>(null);
    movieResults = $state<TMDBTransformedListItem[]>([]);
    tvResults = $state<TMDBTransformedListItem[]>([]);
    loading = $state<boolean>(false);
    error = $state<string | null>(null);
    moviePage = $state<number>(1);
    tvPage = $state<number>(1);
    totalResultsMovie = $state<number>(0);
    totalResultsTV = $state<number>(0);
    movieHasMore = $state<boolean>(true);
    tvHasMore = $state<boolean>(true);
    mediaType = $state<"movie" | "tv" | "both">("both");
    warnings = $state<string[]>([]);

    // Additional filter parameters from the filter panel
    filterParams = $state<FilterParams>({});

    // If true, allows searching/fetching even without a query or filters
    // Useful for discovery pages that verify "popular" by default
    allowEmptySearch = $state<boolean>(false);

    // For request cancellation
    abortController: AbortController | null = null;

    // Results are exactly what the API returns.

    // Results are exactly what the API returns.
    get results() {
        if (this.mediaType === "both") {
            // Sort merged results by popularity
            return [...this.movieResults, ...this.tvResults].sort(
                (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
            );
        }
        // Force new array reference to ensure reactivity
        return this.mediaType === "movie" ? [...this.movieResults] : [...this.tvResults];
    }

    get unfilteredResultsCount() {
        if (this.mediaType === "both") {
            return this.movieResults.length + this.tvResults.length;
        }
        return this.mediaType === "movie" ? this.movieResults.length : this.tvResults.length;
    }

    get totalResults() {
        if (this.mediaType === "both") {
            return this.totalResultsMovie + this.totalResultsTV;
        }
        return this.mediaType === "movie" ? this.totalResultsMovie : this.totalResultsTV;
    }

    get hasMore() {
        if (this.mediaType === "both") {
            return this.movieHasMore || this.tvHasMore;
        }
        return this.mediaType === "movie" ? this.movieHasMore : this.tvHasMore;
    }

    async setMediaType(type: "movie" | "tv" | "both") {
        if (this.mediaType === type) return;
        this.mediaType = type;

        if (!this.parsedSearch) return;

        // Simplified Smart Fetch:
        // If we switched to a type and have NO results for it, fetch.
        const needMovies = (type === "movie" || type === "both") && this.movieResults.length === 0;
        const needTV = (type === "tv" || type === "both") && this.tvResults.length === 0;

        if (needMovies || needTV) {
            await this.fetchMissingMedia(needMovies, needTV);
        }
    }

    private async fetchMissingMedia(needMovies: boolean, needTV: boolean) {
        this.cancelPendingRequests();
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            this.loading = true;
            this.error = null;

            const promises: Promise<void>[] = [];
            if (needMovies) promises.push(this.fetchMedia("movie", 1, signal));
            if (needTV) promises.push(this.fetchMedia("tv", 1, signal));

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

    /**
     * Syncs the store with a new parsed search query.
     * Handles diffing and triggering search/clear automatically.
     */
    syncQuery(parsed: ParsedSearchQuery | null) {
        const newQuery = parsed?.query || "";

        if (!newQuery) {
            this.clear();
            return;
        }

        // Avoid re-searching if the query hasn't changed
        if (this.searchQuery === newQuery) {
            return;
        }

        this.setSearch(newQuery, parsed!);
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
        this.movieHasMore = true;
        this.tvHasMore = true;
        this.movieResults = [];
        this.tvResults = [];
        this.totalResultsMovie = 0;
        this.totalResultsTV = 0;
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

        this.cancelPendingRequests();

        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            this.loading = true;
            this.error = null;
            this.moviePage = 1;
            this.tvPage = 1;

            if (this.mediaType === "both") {
                this.movieResults = [];
                this.tvResults = [];
                this.totalResultsMovie = 0;
                this.totalResultsTV = 0;
                await Promise.all([
                    this.fetchMedia("movie", 1, signal),
                    this.fetchMedia("tv", 1, signal)
                ]);
            } else if (this.mediaType === "movie") {
                this.movieResults = [];
                this.totalResultsMovie = 0;
                await this.fetchMedia("movie", 1, signal);
            } else {
                this.tvResults = [];
                this.totalResultsTV = 0;
                await this.fetchMedia("tv", 1, signal);
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
    private buildSearchUrl(type: "movie" | "tv", page: number): string {
        // Merge parsed search params with filter params
        // Filter params take precedence
        const hasFilters = Object.keys(this.filterParams).length > 0;

        // When filters are active, always use discover mode because
        // TMDB's search endpoints don't support most filter params
        const searchMode = hasFilters ? "discover" : this.parsedSearch?.searchMode || "discover";

        const params = {
            ...(this.parsedSearch?.tmdbParams || {}),
            ...this.filterParams,
            page,
            searchMode
        };

        // Remove 'query' param when using discover mode (it's not supported)
        if (searchMode === "discover") {
            delete params.query;
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
        type: "movie" | "tv",
        page: number,
        signal?: AbortSignal
    ): Promise<SearchResult> {
        const endpoint = this.buildSearchUrl(type, page);
        const response = await fetch(endpoint, { signal });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${type}: ${response.statusText}`);
        }

        return response.json();
    }

    private async fetchMedia(
        type: "movie" | "tv",
        page: number,
        signal?: AbortSignal
    ): Promise<void> {
        // Allow fetch if we have either a parsed search, filter params, or if empty search is allowed
        if (
            !this.parsedSearch &&
            Object.keys(this.filterParams).length === 0 &&
            !this.allowEmptySearch
        )
            return;

        const result = await this.fetchSearchResults(type, page, signal);

        if (signal?.aborted) return;

        const items = (result.results || []) as TMDBTransformedListItem[];

        if (page === 1) {
            const uniqueItems = this.deduplicateItems(items);
            if (type === "movie") {
                this.movieResults = uniqueItems;
            } else {
                this.tvResults = uniqueItems;
            }

            if (this.mediaType === type || this.mediaType === "both") {
                if (type === "movie") {
                    this.totalResultsMovie = result.total_results || 0;
                } else {
                    this.totalResultsTV = result.total_results || 0;
                }
            }
        } else {
            const currentResults = type === "movie" ? this.movieResults : this.tvResults;
            const uniqueNewItems = this.deduplicateItems(items, currentResults);

            if (type === "movie") {
                this.movieResults = [...this.movieResults, ...uniqueNewItems];
            } else {
                this.tvResults = [...this.tvResults, ...uniqueNewItems];
            }
        }

        if (type === "movie") {
            this.movieHasMore = result.page < result.total_pages;
        } else {
            this.tvHasMore = result.page < result.total_pages;
        }
    }

    private async loadMoreMedia(type: "movie" | "tv", signal?: AbortSignal): Promise<void> {
        // Allow load more if we have either a parsed search, filter params, or if empty search is allowed
        if (
            !this.parsedSearch &&
            Object.keys(this.filterParams).length === 0 &&
            !this.allowEmptySearch
        )
            return;

        const hasMore = type === "movie" ? this.movieHasMore : this.tvHasMore;
        if (!hasMore) return;

        if (type === "movie") this.moviePage += 1;
        else this.tvPage += 1;

        const page = type === "movie" ? this.moviePage : this.tvPage;

        try {
            const result = await this.fetchSearchResults(type, page, signal);

            if (signal?.aborted) return;

            const newItems = (result.results || []) as TMDBTransformedListItem[];

            if (newItems.length > 0) {
                const currentResults = type === "movie" ? this.movieResults : this.tvResults;
                const uniqueNewItems = this.deduplicateItems(newItems, currentResults);

                if (type === "movie") {
                    this.movieResults = [...this.movieResults, ...uniqueNewItems];
                } else {
                    this.tvResults = [...this.tvResults, ...uniqueNewItems];
                }
            }

            if (type === "movie") {
                this.movieHasMore = result.page < result.total_pages;
            } else {
                this.tvHasMore = result.page < result.total_pages;
            }
        } catch (err) {
            if (type === "movie") this.moviePage -= 1;
            else this.tvPage -= 1;
            throw err;
        }
    }

    async loadMore(): Promise<void> {
        // Allow load more if we have either a parsed search, filter params, or if empty search is allowed
        const hasSearchOrFilters =
            this.parsedSearch || Object.keys(this.filterParams).length > 0 || this.allowEmptySearch;
        if (!browser || this.loading || !this.hasMore || !hasSearchOrFilters) return;

        // Cancel any pending requests
        this.abortController?.abort();
        const controller = new AbortController();
        this.abortController = controller;
        const signal = controller.signal;

        try {
            this.loading = true;
            this.error = null;

            const shouldLoadMovies =
                (this.mediaType === "both" || this.mediaType === "movie") && this.movieHasMore;
            const shouldLoadTV =
                (this.mediaType === "both" || this.mediaType === "tv") && this.tvHasMore;

            if (shouldLoadMovies && shouldLoadTV) {
                await Promise.all([
                    this.loadMoreMedia("movie", signal),
                    this.loadMoreMedia("tv", signal)
                ]);
            } else if (shouldLoadMovies) {
                await this.loadMoreMedia("movie", signal);
            } else if (shouldLoadTV) {
                await this.loadMoreMedia("tv", signal);
            }
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") return;
            logger.error("Error loading more results:", error);
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            if (!signal.aborted) {
                this.loading = false;
            }
        }
    }

    clear() {
        this.cancelPendingRequests();

        this.searchQuery = "";
        this.rawSearchString = "";
        this.parsedSearch = null;
        this.movieResults = [];
        this.tvResults = [];
        this.moviePage = 1;
        this.tvPage = 1;
        this.movieHasMore = true;
        this.tvHasMore = true;
        this.error = null;
        this.warnings = [];
        this.loading = false;
        this.filterParams = {};
        this.totalResultsMovie = 0;
        this.totalResultsTV = 0;
    }

    /**
     * Check if filters or search is active
     */
    get hasActiveSearch(): boolean {
        return !!this.parsedSearch || Object.keys(this.filterParams).length > 0;
    }
}
