export interface RatingScore {
    name: string;
    image?: string;
    score: number | string;
}

export interface CachedRatings {
    scores: RatingScore[];
    timestamp: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_PREFIX = "rating_cache_";

export class PosterCache {
    private cache: Map<string, CachedRatings> = new Map();
    private storage: Storage | null = null;

    constructor() {
        if (typeof window !== "undefined" && window.localStorage) {
            this.storage = window.localStorage;
            this.loadFromStorage();
        }
    }

    private loadFromStorage(): void {
        if (!this.storage) return;

        const now = Date.now();
        const keys = Object.keys(this.storage);

        for (const key of keys) {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const data = this.storage.getItem(key);
                    if (data) {
                        const cached = JSON.parse(data) as CachedRatings;
                        // Check if still valid
                        if (now - cached.timestamp < CACHE_DURATION) {
                            const cacheKey = key.replace(CACHE_PREFIX, "");
                            this.cache.set(cacheKey, cached);
                        } else {
                            // Remove expired entry
                            this.storage.removeItem(key);
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse cached rating data:", e);
                    this.storage.removeItem(key);
                }
            }
        }
    }

    get(id: number, mediaType: "movie" | "tv" | "anime"): CachedRatings | null {
        const key = `${mediaType}_${id}`;
        const cached = this.cache.get(key);

        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > CACHE_DURATION) {
            this.cache.delete(key);
            if (this.storage) {
                this.storage.removeItem(CACHE_PREFIX + key);
            }
            return null;
        }

        return cached;
    }

    set(id: number, mediaType: "movie" | "tv" | "anime", scores: RatingScore[]): void {
        const key = `${mediaType}_${id}`;
        const data: CachedRatings = {
            scores,
            timestamp: Date.now()
        };

        this.cache.set(key, data);

        if (this.storage) {
            try {
                this.storage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
            } catch (e) {
                // Handle quota exceeded error by clearing old entries
                if (e instanceof DOMException && e.name === "QuotaExceededError") {
                    console.warn("localStorage quota exceeded, clearing old cache entries...");
                    this.clearOldEntries();
                    // Try one more time after cleanup
                    try {
                        this.storage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
                    } catch (retryError) {
                        console.error(
                            "Failed to store rating data even after cleanup:",
                            retryError
                        );
                    }
                } else {
                    console.error("Failed to store rating data in localStorage:", e);
                }
            }
        }
    }

    private clearOldEntries(): void {
        if (!this.storage) return;

        const now = Date.now();
        const keys = Object.keys(this.storage);
        const cacheEntries: { key: string; timestamp: number }[] = [];

        // Collect all cache entries with timestamps
        for (const key of keys) {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const data = this.storage.getItem(key);
                    if (data) {
                        const cached = JSON.parse(data) as CachedRatings;
                        cacheEntries.push({ key, timestamp: cached.timestamp });
                    }
                } catch (e) {
                    // Invalid entry, remove it
                    this.storage.removeItem(key);
                }
            }
        }

        // Sort by timestamp (oldest first)
        cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest 25% of entries or expired entries
        const entriesToRemove = Math.max(
            Math.ceil(cacheEntries.length * 0.25),
            cacheEntries.filter((entry) => now - entry.timestamp > CACHE_DURATION).length
        );

        for (let i = 0; i < entriesToRemove && i < cacheEntries.length; i++) {
            const key = cacheEntries[i].key;
            this.storage.removeItem(key);
            this.cache.delete(key.replace(CACHE_PREFIX, ""));
        }

        console.log(`Cleared ${entriesToRemove} old cache entries`);
    }

    clear(): void {
        this.cache.clear();
        if (this.storage) {
            const keys = Object.keys(this.storage);
            for (const key of keys) {
                if (key.startsWith(CACHE_PREFIX)) {
                    this.storage.removeItem(key);
                }
            }
        }
    }

    /**
     * Get cache statistics for debugging/monitoring
     */
    getStats(): {
        inMemoryEntries: number;
        storageEntries: number;
        estimatedStorageSize: number;
    } {
        const storageKeys = this.storage ? Object.keys(this.storage) : [];
        const cacheKeys = storageKeys.filter((key) => key.startsWith(CACHE_PREFIX));

        let estimatedSize = 0;
        for (const key of cacheKeys) {
            const value = this.storage?.getItem(key);
            if (value) {
                // Rough estimate: 2 bytes per character in UTF-16
                estimatedSize += (key.length + value.length) * 2;
            }
        }

        return {
            inMemoryEntries: this.cache.size,
            storageEntries: cacheKeys.length,
            estimatedStorageSize: estimatedSize
        };
    }
}

export const posterCache = new PosterCache();
