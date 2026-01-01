import { browser } from "$app/environment";
import { PersistedState } from "runed";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("lists-cache");

interface CachedData<T> {
    items: T[];
    timestamp: number;
}

interface MediaListState {
    timeWindow: "day" | "week";
}

/**
 * Base interface for list items from various APIs.
 * All items must have at least an `id` for tracking.
 */
export interface BaseListItem {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    media_type?: string;
    [key: string]: unknown;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache validity

/**
 * Extracts items from various API response formats
 */
function extractItems<T>(data: unknown): T[] {
    let items: T[] = [];

    if (Array.isArray(data)) {
        items = data;
    } else if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.results)) {
            items = obj.results;
        } else if (Array.isArray(obj.items)) {
            items = obj.items;
        } else if (obj.data && typeof obj.data === "object") {
            const pageData = obj.data as Record<string, unknown>;
            if (pageData.Page && typeof pageData.Page === "object") {
                const page = pageData.Page as Record<string, unknown>;
                if (Array.isArray(page.media)) {
                    items = page.media;
                }
            }
        }
    }

    return items;
}

/**
 * Deduplicates items by their id property
 */
function deduplicateById<T extends { id?: unknown }>(items: T[]): T[] {
    const seenIds: unknown[] = [];
    return items.filter((item) => {
        if (item.id === undefined || seenIds.includes(item.id)) {
            return false;
        }
        seenIds.push(item.id);
        return true;
    });
}

export class MediaListStore<T = unknown> {
    readonly #key: string;
    readonly #apiPath: string;
    readonly #supportsTimeWindow: boolean;
    readonly #defaultTimeWindow: "day" | "week";

    // Use PersistedState for time window preference (persists across sessions)
    #timeWindowState: PersistedState<MediaListState> | null = null;

    // Runtime state (non-persisted)
    #items = $state<T[]>([]);
    #loading = $state(false);
    #error = $state<string | null>(null);
    #page = $state(1);
    #hasMore = $state(true);
    #initialized = $state(false);

    constructor(key: string, apiPath: string, initialTimeWindow: "day" | "week" | null = null) {
        this.#key = key;
        this.#apiPath = apiPath;
        this.#supportsTimeWindow = initialTimeWindow !== null;
        this.#defaultTimeWindow = initialTimeWindow ?? "day";

        if (browser && this.#supportsTimeWindow) {
            this.#timeWindowState = new PersistedState<MediaListState>(
                `${key}_preferences`,
                { timeWindow: this.#defaultTimeWindow },
                { storage: "session", syncTabs: false }
            );
        }

        // Eagerly load data on construction in browser
        if (browser) {
            this.load();
        }
    }

    get items(): T[] {
        return this.#items;
    }

    get timeWindow(): "day" | "week" | null {
        if (!this.#supportsTimeWindow) return null;
        return this.#timeWindowState?.current.timeWindow ?? this.#defaultTimeWindow;
    }

    get loading(): boolean {
        return this.#loading;
    }

    get error(): string | null {
        return this.#error;
    }

    get hasMore(): boolean {
        return this.#hasMore;
    }

    get initialized(): boolean {
        return this.#initialized;
    }

    #getStorageKey(): string {
        const tw = this.timeWindow;
        return tw ? `${this.#key}_${tw}_cache` : `${this.#key}_cache`;
    }

    #getApiUrl(page: number = 1): string {
        const tw = this.timeWindow;
        const baseUrl = tw ? `${this.#apiPath}/${tw}/trending` : this.#apiPath;
        return `${baseUrl}?page=${page}`;
    }

    #getCachedData(): CachedData<T> | null {
        if (!browser) return null;

        try {
            const stored = sessionStorage.getItem(this.#getStorageKey());
            if (!stored) return null;

            const cached = JSON.parse(stored) as CachedData<T>;
            const now = Date.now();

            // Check if cache is still valid
            if (now - cached.timestamp > CACHE_DURATION) {
                sessionStorage.removeItem(this.#getStorageKey());
                return null;
            }

            return cached;
        } catch {
            return null;
        }
    }

    #setCachedData(items: T[]): void {
        if (!browser) return;

        try {
            const cached: CachedData<T> = {
                items,
                timestamp: Date.now()
            };
            sessionStorage.setItem(this.#getStorageKey(), JSON.stringify(cached));
        } catch (e) {
            // Handle quota exceeded - clear old caches
            if (e instanceof DOMException && e.name === "QuotaExceededError") {
                this.#clearAllCaches();
            }
        }
    }

    #clearAllCaches(): void {
        if (!browser) return;

        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.includes("_cache")) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    }

    async changeTimeWindow(window: "day" | "week"): Promise<void> {
        if (!this.#supportsTimeWindow || this.timeWindow === window) return;

        if (this.#timeWindowState) {
            this.#timeWindowState.current = { timeWindow: window };
        }

        // Reset pagination and reload
        this.#page = 1;
        this.#hasMore = true;
        this.#items = [];
        await this.load();
    }

    async load(): Promise<void> {
        if (!browser) return;

        // Try to use cached data first
        const cached = this.#getCachedData();
        if (cached && cached.items.length > 0) {
            this.#items = cached.items;
            this.#initialized = true;
            return;
        }

        await this.#fetchFromApi();
    }

    async #fetchFromApi(): Promise<void> {
        if (this.#loading) return;

        try {
            this.#loading = true;
            this.#error = null;

            const response = await fetch(this.#getApiUrl(this.#page));
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const items = deduplicateById(extractItems<T & { id?: unknown }>(result)) as T[];

            this.#items = items;
            this.#initialized = true;
            this.#setCachedData(items);
        } catch (error) {
            logger.error(`[MediaListStore:${this.#key}] Fetch error:`, error);
            this.#error = error instanceof Error ? error.message : String(error);
        } finally {
            this.#loading = false;
        }
    }

    async loadMore(): Promise<void> {
        if (!browser || this.#loading || !this.#hasMore) return;

        try {
            this.#loading = true;
            this.#error = null;
            this.#page += 1;

            const response = await fetch(this.#getApiUrl(this.#page));
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const newItems = extractItems<T & { id?: unknown }>(result);

            if (newItems.length === 0) {
                this.#hasMore = false;
            } else {
                // Combine and deduplicate items
                const combined = [...this.#items, ...newItems] as (T & { id?: unknown })[];
                this.#items = deduplicateById(combined) as T[];
                // Update cache with all items
                this.#setCachedData(this.#items);
            }
        } catch (error) {
            logger.error(`[MediaListStore:${this.#key}] Load more error:`, error);
            this.#error = error instanceof Error ? error.message : String(error);
            this.#page -= 1;
        } finally {
            this.#loading = false;
        }
    }

    /**
     * Force refresh data from API, bypassing cache
     */
    async refresh(): Promise<void> {
        this.clearCache();
        this.#page = 1;
        this.#hasMore = true;
        await this.#fetchFromApi();
    }

    clearCache(): void {
        if (browser) {
            sessionStorage.removeItem(this.#getStorageKey());
        }
    }
}
