import { browser } from "$app/environment";
import type { ParsedSearchQuery } from "$lib/search-parser";
import { buildTMDBSearchParams, buildTVDBSearchParams } from "$lib/utils/query-builder";
import { createScopedLogger } from "$lib/logger";
import { searchMovies, searchTV, type SearchResult } from "$lib/services/search.remote";
import type { TMDBTransformedListItem } from "$lib/providers/parser";

const logger = createScopedLogger("search");

export class SearchStore {
    #searchQuery = $state<string>("");
    #rawSearchString = $state<string>("");
    #parsedSearch = $state<ParsedSearchQuery | null>(null);
    #movieResults = $state<any[]>([]);
    #tvResults = $state<any[]>([]);
    #loading = $state<boolean>(false);
    #error = $state<string | null>(null);
    #moviePage = $state<number>(1);
    #tvPage = $state<number>(1);
    #totalResults = $state<number>(0);
    #movieHasMore = $state<boolean>(true);
    #tvHasMore = $state<boolean>(true);
    #mediaType = $state<"movie" | "tv" | "both">("both");
    #warnings = $state<string[]>([]);

    // For request cancellation
    #abortController: AbortController | null = null;
    // For debouncing
    #debounceTimer: ReturnType<typeof setTimeout> | null = null;
    #debounceMs = 300; // 300ms debounce delay

    get searchQuery() {
        return this.#searchQuery;
    }

    get rawSearchString() {
        return this.#rawSearchString;
    }

    get parsedSearch() {
        return this.#parsedSearch;
    }

    get warnings() {
        return this.#warnings;
    }

    get results() {
        if (this.#mediaType === "both") {
            return [...this.#movieResults, ...this.#tvResults];
        }
        return this.#mediaType === "movie" ? this.#movieResults : this.#tvResults;
    }

    get movieResults() {
        return this.#movieResults;
    }

    get tvResults() {
        return this.#tvResults;
    }

    get loading() {
        return this.#loading;
    }

    get error() {
        return this.#error;
    }

    get totalResults() {
        return this.#totalResults;
    }

    get hasMore() {
        if (this.#mediaType === "both") {
            return this.#movieHasMore || this.#tvHasMore;
        }
        return this.#mediaType === "movie" ? this.#movieHasMore : this.#tvHasMore;
    }

    get mediaType() {
        return this.#mediaType;
    }

    setMediaType(type: "movie" | "tv" | "both") {
        if (this.#mediaType === type) return;
        this.#mediaType = type;
        // Don't reset pages or results - just filter what we show
    }

    setSearch(rawString: string, parsed: ParsedSearchQuery) {
        this.#rawSearchString = rawString;
        this.#searchQuery = parsed.query;
        this.#parsedSearch = parsed;
        this.#warnings = parsed.warnings;
        this.#moviePage = 1;
        this.#tvPage = 1;
        this.#movieHasMore = true;
        this.#tvHasMore = true;
        this.#movieResults = [];
        this.#tvResults = [];
    }

    /**
     * Cancel any pending search requests
     */
    cancelPendingRequests(): void {
        if (this.#abortController) {
            this.#abortController.abort();
            this.#abortController = null;
        }
        if (this.#debounceTimer) {
            clearTimeout(this.#debounceTimer);
            this.#debounceTimer = null;
        }
    }

    /**
     * Debounced search - waits for user to stop typing before searching
     * Automatically cancels previous pending requests
     */
    searchDebounced(): void {
        if (!browser) return;

        // Cancel any pending debounce timer
        if (this.#debounceTimer) {
            clearTimeout(this.#debounceTimer);
        }

        // Set loading state immediately for UI feedback
        this.#loading = true;

        // Debounce the actual search
        this.#debounceTimer = setTimeout(() => {
            this.#debounceTimer = null;
            this.search();
        }, this.#debounceMs);
    }

    /**
     * Immediate search - cancels any pending requests and searches immediately
     */
    async search(): Promise<void> {
        if (!browser) return;

        // Cancel any previous pending requests
        this.cancelPendingRequests();

        // Create new abort controller for this search
        this.#abortController = new AbortController();
        const signal = this.#abortController.signal;

        try {
            this.#loading = true;
            this.#error = null;
            this.#movieResults = [];
            this.#tvResults = [];
            this.#totalResults = 0; // Reset total results
            this.#moviePage = 1;
            this.#tvPage = 1;

            // Parallelize requests when searching both types
            if (this.#mediaType === "both") {
                await Promise.all([this.fetchMedia("movie", 1, signal), this.fetchMedia("tv", 1, signal)]);
            } else if (this.#mediaType === "movie") {
                await this.fetchMedia("movie", 1, signal);
            } else {
                await this.fetchMedia("tv", 1, signal);
            }
        } catch (error) {
            // Don't treat aborted requests as errors
            if (error instanceof Error && error.name === "AbortError") {
                logger.debug("Search request was cancelled");
                return;
            }
            logger.error("Error searching:", error);
            this.#error = error instanceof Error ? error.message : String(error);
        } finally {
            // Only clear loading if this controller wasn't aborted
            if (!signal.aborted) {
                this.#loading = false;
            }
        }
    }

    private deduplicateItems(newItems: TMDBTransformedListItem[], existingItems: TMDBTransformedListItem[] = []): TMDBTransformedListItem[] {
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

    private async fetchMedia(type: "movie" | "tv", page: number, signal?: AbortSignal): Promise<void> {
        if (!this.#parsedSearch) return;

        let result: SearchResult;

        if (type === "movie") {
            const params = buildTMDBSearchParams(this.#parsedSearch, page);
            result = await searchMovies(params);
        } else {
            const params = buildTVDBSearchParams(this.#parsedSearch, page);
            result = await searchTV(params);
        }

        // Check if aborted
        if (signal?.aborted) return;

        const items = (result.results || []) as TMDBTransformedListItem[];

        if (page === 1) {
            const uniqueItems = this.deduplicateItems(items);
            if (type === "movie") {
                this.#movieResults = uniqueItems;
            } else {
                this.#tvResults = uniqueItems;
            }

            if (this.#mediaType === type || this.#mediaType === "both") {
                // For initial load, accumulating totalResults might be tricky if we want exact count from API
                // But sticking to previous logic:
                this.#totalResults += result.total_results || 0;
            }
        } else {
            const currentResults = type === "movie" ? this.#movieResults : this.#tvResults;
            const uniqueNewItems = this.deduplicateItems(items, currentResults);

            if (type === "movie") {
                this.#movieResults = [...this.#movieResults, ...uniqueNewItems];
            } else {
                this.#tvResults = [...this.#tvResults, ...uniqueNewItems];
            }
        }

        if (type === "movie") {
            this.#movieHasMore = result.page < result.total_pages;
        } else {
            this.#tvHasMore = result.page < result.total_pages;
        }
    }

    private async loadMoreMedia(type: "movie" | "tv"): Promise<void> {
        if (!this.#parsedSearch) return;

        const hasMore = type === "movie" ? this.#movieHasMore : this.#tvHasMore;
        if (!hasMore) return;

        if (type === "movie") this.#moviePage += 1;
        else this.#tvPage += 1;

        const page = type === "movie" ? this.#moviePage : this.#tvPage;

        try {
            let result: SearchResult;
            if (type === "movie") {
                const params = buildTMDBSearchParams(this.#parsedSearch, page);
                result = await searchMovies(params);
            } else {
                const params = buildTVDBSearchParams(this.#parsedSearch, page);
                result = await searchTV(params);
            }

            const newItems = (result.results || []) as TMDBTransformedListItem[];

            if (newItems.length > 0) {
                const currentResults = type === "movie" ? this.#movieResults : this.#tvResults;
                const uniqueNewItems = this.deduplicateItems(newItems, currentResults);

                if (type === "movie") {
                    this.#movieResults = [...this.#movieResults, ...uniqueNewItems];
                } else {
                    this.#tvResults = [...this.#tvResults, ...uniqueNewItems];
                }
            }

            if (type === "movie") {
                this.#movieHasMore = result.page < result.total_pages;
            } else {
                this.#tvHasMore = result.page < result.total_pages;
            }

        } catch (err) {
            if (type === "movie") this.#moviePage -= 1;
            else this.#tvPage -= 1;
            throw err;
        }
    }

    async loadMore(): Promise<void> {
        if (!browser || this.#loading || !this.hasMore || !this.#parsedSearch) return;

        try {
            this.#loading = true;
            this.#error = null;

            const shouldLoadMovies =
                (this.#mediaType === "both" || this.#mediaType === "movie") && this.#movieHasMore;
            const shouldLoadTV =
                (this.#mediaType === "both" || this.#mediaType === "tv") && this.#tvHasMore;

            // Parallelize requests when loading both types
            if (shouldLoadMovies && shouldLoadTV) {
                await Promise.all([this.loadMoreMedia("movie"), this.loadMoreMedia("tv")]);
            } else if (shouldLoadMovies) {
                await this.loadMoreMedia("movie");
            } else if (shouldLoadTV) {
                await this.loadMoreMedia("tv");
            }
        } catch (error) {
            logger.error("Error loading more results:", error);
            this.#error = error instanceof Error ? error.message : String(error);
        } finally {
            this.#loading = false;
        }
    }

    clear() {
        // Cancel any pending requests
        this.cancelPendingRequests();

        this.#searchQuery = "";
        this.#rawSearchString = "";
        this.#parsedSearch = null;
        this.#movieResults = [];
        this.#tvResults = [];
        this.#moviePage = 1;
        this.#tvPage = 1;
        this.#movieHasMore = true;
        this.#tvHasMore = true;
        this.#totalResults = 0;
        this.#error = null;
        this.#warnings = [];
        this.#loading = false;
    }
}
