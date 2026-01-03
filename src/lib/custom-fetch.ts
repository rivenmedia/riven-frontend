import { createScopedLogger } from "$lib/logger";
import { getRateLimiterForUrl, withRateLimit } from "$lib/rate-limiter";

const logger = createScopedLogger("fetch");

type FetchFn = typeof fetch;

interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    retryOnStatus: number[];
}

interface DomainConfig extends Partial<RetryConfig> {
    pattern: string | RegExp;
}

interface CustomFetchOptions {
    defaultRetry?: Partial<RetryConfig>;
    domains?: DomainConfig[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    retryOnStatus: [408, 429, 500, 502, 503, 504]
};

const DEFAULT_DOMAIN_CONFIGS: DomainConfig[] = [
    {
        pattern: "api.themoviedb.org",
        maxAttempts: 3,
        baseDelay: 1000,
        retryOnStatus: [429, 500, 502, 503, 504]
    },
    {
        pattern: "api.trakt.tv",
        maxAttempts: 3,
        baseDelay: 1000,
        retryOnStatus: [429, 500, 502, 503, 504]
    },
    {
        pattern: "api4.thetvdb.com",
        maxAttempts: 3,
        baseDelay: 1000,
        retryOnStatus: [429, 500, 502, 503, 504]
    },
    {
        pattern: "graphql.anilist.co",
        maxAttempts: 3,
        baseDelay: 1000,
        retryOnStatus: [429, 500, 502, 503, 504]
    },
    {
        pattern: "api.ani.zip",
        maxAttempts: 3,
        baseDelay: 1000,
        retryOnStatus: [429, 500, 502, 503, 504]
    }
];

function matchesDomain(url: string, pattern: string | RegExp): boolean {
    try {
        const hostname = new URL(url).hostname;
        if (typeof pattern === "string") {
            return hostname === pattern || hostname.endsWith("." + pattern);
        }
        return pattern.test(hostname);
    } catch {
        return false;
    }
}

function getRetryConfigForUrl(url: string, options: CustomFetchOptions): RetryConfig | null {
    const domains = options.domains ?? DEFAULT_DOMAIN_CONFIGS;

    for (const domain of domains) {
        if (matchesDomain(url, domain.pattern)) {
            return {
                maxAttempts:
                    domain.maxAttempts ??
                    options.defaultRetry?.maxAttempts ??
                    DEFAULT_RETRY_CONFIG.maxAttempts,
                baseDelay:
                    domain.baseDelay ??
                    options.defaultRetry?.baseDelay ??
                    DEFAULT_RETRY_CONFIG.baseDelay,
                retryOnStatus:
                    domain.retryOnStatus ??
                    options.defaultRetry?.retryOnStatus ??
                    DEFAULT_RETRY_CONFIG.retryOnStatus
            };
        }
    }

    if (options.defaultRetry) {
        return {
            ...DEFAULT_RETRY_CONFIG,
            ...options.defaultRetry
        };
    }

    return null;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Jitter prevents thundering herd when multiple clients retry simultaneously
function calculateDelayWithJitter(baseDelay: number, attempt: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    return exponentialDelay * (0.5 + Math.random() * 0.5);
}

export function createCustomFetch(
    fetchFn: FetchFn = fetch,
    options: CustomFetchOptions = {}
): FetchFn {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url =
            typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const retryConfig = getRetryConfigForUrl(url, options);

        // Wrap the actual fetch execution with rate limiting
        const executeWithRateLimit = () =>
            withRateLimit(url, async () => {
                if (!retryConfig) {
                    return fetchFn(input, init);
                }

                let lastError: Error | null = null;
                let lastResponse: Response | null = null;

                for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
                    try {
                        const response = await fetchFn(input, init);

                        if (response.ok || !retryConfig.retryOnStatus.includes(response.status)) {
                            return response;
                        }

                        lastResponse = response;

                        const retryAfter = response.headers.get("Retry-After");
                        let delay = calculateDelayWithJitter(retryConfig.baseDelay, attempt - 1);

                        if (retryAfter) {
                            // Retry-After can be seconds or HTTP date per RFC 7231
                            const retryAfterSeconds = parseInt(retryAfter, 10);
                            if (!isNaN(retryAfterSeconds)) {
                                delay = retryAfterSeconds * 1000 * (0.9 + Math.random() * 0.2);
                            } else {
                                const retryDate = new Date(retryAfter);
                                if (!isNaN(retryDate.getTime())) {
                                    const rawDelay = Math.max(0, retryDate.getTime() - Date.now());
                                    delay = rawDelay * (0.9 + Math.random() * 0.2);
                                }
                            }
                        }

                        if (attempt < retryConfig.maxAttempts) {
                            logger.warn(
                                `Request to ${url} failed with status ${response.status}. ` +
                                `Retrying in ${Math.round(delay)}ms (attempt ${attempt}/${retryConfig.maxAttempts})`
                            );
                            if (response.status === 429) {
                                const limiter = getRateLimiterForUrl(url);
                                if (limiter) {
                                    // Make sure we pause GLOBAL execution for this domain
                                    // delay is already calculated from Retry-After or backoff
                                    limiter.pauseUntil(Date.now() + delay);
                                }
                            }

                            await sleep(delay);
                        }
                    } catch (error) {
                        lastError = error instanceof Error ? error : new Error(String(error));

                        if (attempt < retryConfig.maxAttempts) {
                            const delay = calculateDelayWithJitter(
                                retryConfig.baseDelay,
                                attempt - 1
                            );
                            logger.warn(
                                `Request to ${url} failed with error: ${lastError.message}. ` +
                                `Retrying in ${Math.round(delay)}ms (attempt ${attempt}/${retryConfig.maxAttempts})`
                            );
                            await sleep(delay);
                        }
                    }
                }

                if (lastResponse) {
                    logger.error(
                        `Request to ${url} failed after ${retryConfig.maxAttempts} attempts ` +
                        `with status ${lastResponse.status}`
                    );
                    return lastResponse;
                }

                if (lastError) {
                    logger.error(
                        `Request to ${url} failed after ${retryConfig.maxAttempts} attempts ` +
                        `with error: ${lastError.message}`
                    );
                    throw lastError;
                }

                // TypeScript requires this unreachable throw
                throw new Error(
                    `[custom-fetch] Request to ${url} failed after ${retryConfig.maxAttempts} attempts for unknown reasons`
                );
            });

        return executeWithRateLimit();
    };
}

export const customFetch = createCustomFetch();

export type CustomFetch = ReturnType<typeof createCustomFetch>;
