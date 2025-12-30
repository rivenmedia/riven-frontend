import { browser } from "$app/environment";
import { PersistedState } from "runed";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("poster-cache");

export interface RatingScore {
    name: string;
    image?: string;
    score: number | string;
}

export interface CachedRatings {
    scores: RatingScore[];
    timestamp: number;
}

type CacheStore = Record<string, CachedRatings>;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_KEY = "rating_cache";
const MAX_ENTRIES = 500; // Maximum number of cache entries

/**
 * Creates a cache key from media type and ID
 */
function createCacheKey(id: number, mediaType: "movie" | "tv" | "anime"): string {
    return `${mediaType}_${id}`;
}

/**
 * PosterCache using PersistedState from runed for automatic persistence
 * and reactivity. Handles rating data caching with expiration.
 */
class PosterCacheStore {
    #cache: PersistedState<CacheStore> | null = null;
    #initialized = false;

    constructor() {
        if (browser) {
            this.#initialize();
        }
    }

    #initialize(): void {
        if (this.#initialized) return;

        // Migrate from old cache format if needed
        this.#migrateOldCache();

        this.#cache = new PersistedState<CacheStore>(
            CACHE_KEY,
            {},
            {
                storage: "local",
                syncTabs: true // Sync across tabs
            }
        );

        // Clean expired entries on initialization
        this.#cleanExpiredEntries();
        this.#initialized = true;
    }

    /**
     * Migrate from old prefixed cache format to new unified format
     */
    #migrateOldCache(): void {
        if (!browser) return;

        const CACHE_PREFIX = "rating_cache_";
        const migratedData: CacheStore = {};
        const keysToRemove: string[] = [];

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(CACHE_PREFIX)) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const cached = JSON.parse(data) as CachedRatings;
                        const cacheKey = key.replace(CACHE_PREFIX, "");
                        migratedData[cacheKey] = cached;
                    }
                    keysToRemove.push(key);
                }
            }

            // Only migrate if there's data to migrate
            if (Object.keys(migratedData).length > 0) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(migratedData));
                keysToRemove.forEach((key) => localStorage.removeItem(key));
            }
        } catch (e) {
            logger.error("Failed to migrate old cache format:", e);
        }
    }

    #cleanExpiredEntries(): void {
        if (!this.#cache) return;

        const now = Date.now();
        const store = this.#cache.current;
        const entries = Object.entries(store);
        let hasChanges = false;

        const validEntries: [string, CachedRatings][] = [];

        for (const [key, value] of entries) {
            if (now - value.timestamp < CACHE_DURATION) {
                validEntries.push([key, value]);
            } else {
                hasChanges = true;
            }
        }

        // Enforce max entries limit (keep most recent)
        if (validEntries.length > MAX_ENTRIES) {
            validEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            validEntries.length = MAX_ENTRIES;
            hasChanges = true;
        }

        if (hasChanges) {
            this.#cache.current = Object.fromEntries(validEntries);
        }
    }

    get(id: number, mediaType: "movie" | "tv" | "anime"): CachedRatings | null {
        if (!browser || !this.#cache) return null;

        const key = createCacheKey(id, mediaType);
        const cached = this.#cache.current[key];

        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > CACHE_DURATION) {
            // Remove expired entry
            this.#removeEntry(key);
            return null;
        }

        return cached;
    }

    set(id: number, mediaType: "movie" | "tv" | "anime", scores: RatingScore[]): void {
        if (!browser || !this.#cache) return;

        const key = createCacheKey(id, mediaType);
        const data: CachedRatings = {
            scores,
            timestamp: Date.now()
        };

        try {
            // Create new object to trigger reactivity
            this.#cache.current = {
                ...this.#cache.current,
                [key]: data
            };
        } catch (e) {
            // Handle quota exceeded error
            if (e instanceof DOMException && e.name === "QuotaExceededError") {
                logger.warn("localStorage quota exceeded, clearing old cache entries...");
                this.#pruneOldEntries();

                // Retry after cleanup
                try {
                    this.#cache.current = {
                        ...this.#cache.current,
                        [key]: data
                    };
                } catch (retryError) {
                    logger.error("Failed to store rating data even after cleanup:", retryError);
                }
            } else {
                logger.error("Failed to store rating data:", e);
            }
        }
    }

    #removeEntry(key: string): void {
        if (!this.#cache) return;

        const { [key]: _removed, ...rest } = this.#cache.current;
        void _removed; // Explicitly mark as unused
        this.#cache.current = rest;
    }

    #pruneOldEntries(): void {
        if (!this.#cache) return;

        const entries = Object.entries(this.#cache.current);

        // Sort by timestamp (oldest first) and remove oldest 25%
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const entriesToKeep = Math.ceil(entries.length * 0.75);
        const prunedEntries = entries.slice(-entriesToKeep);

        this.#cache.current = Object.fromEntries(prunedEntries);
        logger.info(`Pruned ${entries.length - entriesToKeep} old cache entries`);
    }

    clear(): void {
        if (!browser || !this.#cache) return;
        this.#cache.current = {};
    }

    /**
     * Get cache statistics for debugging/monitoring
     */
    getStats(): {
        entries: number;
        oldestEntry: Date | null;
        newestEntry: Date | null;
    } {
        if (!browser || !this.#cache) {
            return { entries: 0, oldestEntry: null, newestEntry: null };
        }

        const entries = Object.values(this.#cache.current);
        if (entries.length === 0) {
            return { entries: 0, oldestEntry: null, newestEntry: null };
        }

        const timestamps = entries.map((e) => e.timestamp);
        const oldest = Math.min(...timestamps);
        const newest = Math.max(...timestamps);

        // Create Date objects from timestamps for display
        // Note: Date.now() is still used throughout for performance-critical timestamp operations
        return {
            entries: entries.length,
            oldestEntry: new Date(oldest),
            newestEntry: new Date(newest)
        };
    }
}

export const posterCache = new PosterCacheStore();
