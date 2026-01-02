/**
 * Rate limiter using token bucket algorithm
 * Limits both concurrent requests and requests per second
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
    timestamp: number;
}

class RateLimiter {
    private config: RateLimiterConfig;
    private activeRequests = 0;
    private requestTimestamps: number[] = [];
    private queue: QueuedRequest[] = [];
    private processing = false;

    constructor(config: RateLimiterConfig) {
        this.config = config;
    }

    /**
     * Acquire a slot for making a request.
     * Returns a promise that resolves when it's safe to proceed.
     * Call release() when the request completes.
     */
    async acquire(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.queue.push({
                resolve,
                reject,
                timestamp: Date.now()
            });
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

    private processQueue(): void {
        if (this.processing) return;
        this.processing = true;

        try {
            while (this.queue.length > 0) {
                // Check concurrent limit
                if (this.activeRequests >= this.config.maxConcurrent) {
                    break;
                }

                // Check RPS limit using sliding window
                const now = Date.now();
                const windowStart = now - 1000;

                // Remove timestamps older than 1 second
                this.requestTimestamps = this.requestTimestamps.filter((t) => t > windowStart);

                if (this.requestTimestamps.length >= this.config.maxRPS) {
                    // Calculate when the oldest request in the window will expire
                    const oldestTimestamp = this.requestTimestamps[0];
                    const waitTime = oldestTimestamp - windowStart + 1;

                    // Schedule retry after wait time
                    setTimeout(() => this.processQueue(), waitTime);
                    break;
                }

                // We can proceed with the next request
                const request = this.queue.shift();
                if (request) {
                    this.activeRequests++;
                    this.requestTimestamps.push(now);
                    request.resolve();
                }
            }
        } finally {
            this.processing = false;
        }
    }

    /**
     * Get current stats for debugging/monitoring
     */
    getStats(): { active: number; queued: number; rpsUsed: number } {
        const now = Date.now();
        const windowStart = now - 1000;
        const recentRequests = this.requestTimestamps.filter((t) => t > windowStart).length;

        return {
            active: this.activeRequests,
            queued: this.queue.length,
            rpsUsed: recentRequests
        };
    }
}

// Pre-configured rate limiters for each API provider
// Based on known rate limits (with safety margin)
const rateLimiters: Record<string, RateLimiter> = {
    // TMDB: 50 requests/second limit, we use 40 for safety
    "api.themoviedb.org": new RateLimiter({
        name: "TMDB",
        maxConcurrent: 20,
        maxRPS: 40
    }),
    // TVDB: More conservative limits
    "api4.thetvdb.com": new RateLimiter({
        name: "TVDB",
        maxConcurrent: 15,
        maxRPS: 30
    }),
    // Trakt: 1000 requests per 5 minutes = ~3.3/sec, be conservative
    "api.trakt.tv": new RateLimiter({
        name: "Trakt",
        maxConcurrent: 10,
        maxRPS: 3
    }),
    // AniList: GraphQL endpoint, be conservative
    "graphql.anilist.co": new RateLimiter({
        name: "AniList",
        maxConcurrent: 10,
        maxRPS: 10
    }),
    // ani.zip: Small service, be very conservative
    "api.ani.zip": new RateLimiter({
        name: "AniZip",
        maxConcurrent: 5,
        maxRPS: 5
    })
};

/**
 * Get the rate limiter for a given URL
 */
export function getRateLimiterForUrl(url: string): RateLimiter | null {
    try {
        const hostname = new URL(url).hostname;

        // Direct match
        if (rateLimiters[hostname]) {
            return rateLimiters[hostname];
        }

        // Check for subdomain matches
        for (const [domain, limiter] of Object.entries(rateLimiters)) {
            if (hostname === domain || hostname.endsWith("." + domain)) {
                return limiter;
            }
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Execute a function with rate limiting applied
 */
export async function withRateLimit<T>(url: string, fn: () => Promise<T>): Promise<T> {
    const limiter = getRateLimiterForUrl(url);

    if (!limiter) {
        // No rate limiting for unknown domains
        return fn();
    }

    await limiter.acquire();
    try {
        return await fn();
    } finally {
        limiter.release();
    }
}

/**
 * Get stats for all rate limiters (useful for debugging/monitoring)
 */
export function getAllRateLimiterStats(): Record<
    string,
    { active: number; queued: number; rpsUsed: number }
> {
    const stats: Record<string, { active: number; queued: number; rpsUsed: number }> = {};
    for (const [domain, limiter] of Object.entries(rateLimiters)) {
        stats[domain] = limiter.getStats();
    }
    return stats;
}

export { RateLimiter, type RateLimiterConfig };
