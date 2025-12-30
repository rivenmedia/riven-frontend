/**
 * Simple in-memory cache with TTL support for API responses
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

interface CacheConfig {
    ttl: number; // Time to live in milliseconds
    maxSize: number;
}

type CacheId = "tmdb" | "trakt" | "tvdb" | "ratings";

// Pre-configured caches
const DEFAULT_CONFIGS: Record<CacheId, CacheConfig> = {
    tmdb: {
        ttl: 21600000, // 6 hours
        maxSize: 2000
    },
    trakt: {
        ttl: 21600000, // 6 hours
        maxSize: 1000
    },
    tvdb: {
        ttl: 21600000, // 6 hours
        maxSize: 1500
    },
    ratings: {
        ttl: 21600000, // 6 hours
        maxSize: 1000
    }
};

class Cache<T> {
    private cache: Map<string, CacheEntry<T>> = new Map();
    private config: CacheConfig;

    constructor(config: CacheConfig) {
        this.config = config;
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    set(key: string, data: T, ttl?: number): void {
        // Enforce max size with LRU eviction
        if (this.cache.size >= this.config.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl ?? this.config.ttl
        });
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

class CacheManager {
    private caches: Map<string, Cache<unknown>> = new Map();

    getCache<T>(id: CacheId): Cache<T> {
        if (!this.caches.has(id)) {
            const config = DEFAULT_CONFIGS[id];
            this.caches.set(id, new Cache<T>(config));
        }
        return this.caches.get(id) as Cache<T>;
    }

    clearAll(): void {
        this.caches.forEach(cache => cache.clear());
    }
}

export const cacheManager = new CacheManager();

// Convenience exports
export const tmdbCache = cacheManager.getCache<unknown>("tmdb");
export const traktCache = cacheManager.getCache<unknown>("trakt");
export const tvdbCache = cacheManager.getCache<unknown>("tvdb");
export const ratingsCache = cacheManager.getCache<unknown>("ratings");
