/**
 * Rate limiter using Leaky Bucket algorithm (Strict Interval Spacing)
 * prevents bursts and ensures steady request flow.
 */

interface RateLimiterConfig {
    /** Maximum concurrent requests allowed */
    maxConcurrent: number;
    /** Maximum requests per second */
    maxRPS: number;
    /** Name for logging purposes */
    name: string;
}

interface QueuedRequest {
    resolve: () => void;
    reject: (error: Error) => void;
}

class RateLimiter {
    private config: RateLimiterConfig;
    private activeRequests = 0;
    private queue: QueuedRequest[] = [];
    private processing = false;
    private lastRequestTime = 0;
    private minInterval: number;
    private pausedUntil = 0;

    constructor(config: RateLimiterConfig) {
        this.config = config;
        this.minInterval = 1000 / config.maxRPS;
    }

    /**
     * Acquire a slot for making a request.
     * Returns a promise that resolves when it's safe to proceed.
     * Call release() when the request completes.
     */
    async acquire(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.queue.push({ resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Release a slot after a request completes
     */
    release(): void {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.processQueue();
    }

    /**
     * Pause all requests until the specified timestamp
     * Used for handling 429 Too Many Requests
     */
    pauseUntil(timestamp: number): void {
        if (timestamp > this.pausedUntil) {
            this.pausedUntil = timestamp;
            // No need to clear timeout, processQueue check will handle it
        }
    }

    private processQueue(): void {
        if (this.processing) return;
        this.processing = true;

        const next = async () => {
            try {
                if (this.queue.length === 0) {
                    this.processing = false;
                    return;
                }

                // Check global pause
                const now = Date.now();
                if (now < this.pausedUntil) {
                    setTimeout(next, this.pausedUntil - now);
                    return;
                }

                // Check concurrent limit
                if (this.activeRequests >= this.config.maxConcurrent) {
                    this.processing = false;
                    return;
                }

                // Check strict interval (Leaky Bucket)
                const timeSinceLast = now - this.lastRequestTime;
                if (timeSinceLast < this.minInterval) {
                    setTimeout(next, this.minInterval - timeSinceLast);
                    return;
                }

                // Proceed
                const request = this.queue.shift();
                if (request) {
                    this.activeRequests++;
                    this.lastRequestTime = Date.now();
                    request.resolve();

                    // Immediately try to schedule next, but it will wait for minInterval
                    // This allows "threading" the requests without waiting for acquire() + release() cycle
                    // effectively allowing parallel acquiring but strictly serial execution start times
                    setTimeout(next, this.minInterval);
                } else {
                    this.processing = false;
                }
            } catch (error) {
                console.error("RateLimiter error:", error);
                this.processing = false;
            }
        };

        next();
    }

    /**
     * Get current stats for debugging/monitoring
     */
    getStats(): { active: number; queued: number; paused: boolean } {
        return {
            active: this.activeRequests,
            queued: this.queue.length,
            paused: Date.now() < this.pausedUntil
        };
    }
}

// Pre-configured rate limiters
// Note: Lower maxConcurrent to prevent pool exhaustion while waiting on intervals
const rateLimiters: Record<string, RateLimiter> = {
    "api.themoviedb.org": new RateLimiter({
        name: "TMDB",
        maxConcurrent: 10,
        maxRPS: 35 // Slightly under 40 allow
    }),
    "api4.thetvdb.com": new RateLimiter({
        name: "TVDB",
        maxConcurrent: 5, // Very strict concurrency for TVDB
        maxRPS: 10 // Strict RPS
    }),
    "api.trakt.tv": new RateLimiter({
        name: "Trakt",
        maxConcurrent: 5,
        maxRPS: 2 // Very conservative
    }),
    "graphql.anilist.co": new RateLimiter({
        name: "AniList",
        maxConcurrent: 5,
        maxRPS: 3
    }),
    "api.ani.zip": new RateLimiter({
        name: "AniZip",
        maxConcurrent: 3,
        maxRPS: 2
    })
};

export function getRateLimiterForUrl(url: string): RateLimiter | null {
    try {
        const hostname = new URL(url).hostname;
        if (rateLimiters[hostname]) return rateLimiters[hostname];
        for (const [domain, limiter] of Object.entries(rateLimiters)) {
            if (hostname === domain || hostname.endsWith("." + domain)) return limiter;
        }
        return null;
    } catch {
        return null;
    }
}

export async function withRateLimit<T>(url: string, fn: () => Promise<T>): Promise<T> {
    const limiter = getRateLimiterForUrl(url);
    if (!limiter) return fn();

    await limiter.acquire();
    try {
        return await fn();
    } finally {
        limiter.release();
    }
}

export function getAllRateLimiterStats() {
    const stats: Record<string, any> = {};
    for (const [domain, limiter] of Object.entries(rateLimiters)) {
        stats[domain] = limiter.getStats();
    }
    return stats;
}

export { RateLimiter, type RateLimiterConfig };
