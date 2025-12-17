type FetchFn = typeof fetch;

interface RetryConfig {
	/** Maximum number of retry attempts */
	maxRetries: number;
	/** Base delay in milliseconds between retries (will be multiplied by attempt number for exponential backoff) */
	baseDelay: number;
	/** HTTP status codes that should trigger a retry */
	retryOnStatus: number[];
}

interface DomainConfig extends Partial<RetryConfig> {
	/** Domain pattern to match (can be a string or regex) */
	pattern: string | RegExp;
}

interface CustomFetchOptions {
	/** Default retry configuration for all requests */
	defaultRetry?: Partial<RetryConfig>;
	/** Domain-specific configurations */
	domains?: DomainConfig[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	baseDelay: 1000,
	retryOnStatus: [408, 429, 500, 502, 503, 504]
};

const DEFAULT_DOMAIN_CONFIGS: DomainConfig[] = [
	{
		pattern: 'api.themoviedb.org',
		maxRetries: 3,
		baseDelay: 1000,
		retryOnStatus: [429, 500, 502, 503, 504]
	},
	{
		pattern: 'api.trakt.tv',
		maxRetries: 3,
		baseDelay: 1000,
		retryOnStatus: [429, 500, 502, 503, 504]
	},
	{
		pattern: 'api4.thetvdb.com',
		maxRetries: 3,
		baseDelay: 1000,
		retryOnStatus: [429, 500, 502, 503, 504]
	},
	{
		pattern: 'graphql.anilist.co',
		maxRetries: 3,
		baseDelay: 1000,
		retryOnStatus: [429, 500, 502, 503, 504]
	},
	{
		pattern: 'api.ani.zip',
		maxRetries: 3,
		baseDelay: 1000,
		retryOnStatus: [429, 500, 502, 503, 504]
	},
	{
		pattern: 'api.imdbapi.dev',
		maxRetries: 2,
		baseDelay: 500,
		retryOnStatus: [429, 500, 502, 503, 504]
	}
];

function matchesDomain(url: string, pattern: string | RegExp): boolean {
	if (typeof pattern === 'string') {
		return url.includes(pattern);
	}
	return pattern.test(url);
}

function getRetryConfigForUrl(url: string, options: CustomFetchOptions): RetryConfig | null {
	const domains = options.domains ?? DEFAULT_DOMAIN_CONFIGS;

	for (const domain of domains) {
		if (matchesDomain(url, domain.pattern)) {
			return {
				maxRetries: domain.maxRetries ?? options.defaultRetry?.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries,
				baseDelay: domain.baseDelay ?? options.defaultRetry?.baseDelay ?? DEFAULT_RETRY_CONFIG.baseDelay,
				retryOnStatus: domain.retryOnStatus ?? options.defaultRetry?.retryOnStatus ?? DEFAULT_RETRY_CONFIG.retryOnStatus
			};
		}
	}

	// If no domain matches and no default retry is set, return null (no retries)
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

/**
 * Creates a custom fetch function with retry logic for specific domains.
 * Works with both native fetch and SvelteKit's fetch.
 *
 * @param fetchFn - The fetch function to use (native fetch or SvelteKit's fetch)
 * @param options - Configuration options for retry behavior
 * @returns A fetch function with retry capabilities
 *
 * @example
 * // In a SvelteKit load function
 * export async function load({ fetch }) {
 *   const customFetch = createCustomFetch(fetch);
 *   const response = await customFetch('https://api.themoviedb.org/3/movie/popular');
 *   return { data: await response.json() };
 * }
 *
 * @example
 * // With native fetch and custom config
 * const customFetch = createCustomFetch(fetch, {
 *   domains: [
 *     { pattern: 'api.example.com', maxRetries: 5, baseDelay: 500 }
 *   ]
 * });
 */
export function createCustomFetch(fetchFn: FetchFn = fetch, options: CustomFetchOptions = {}): FetchFn {
	return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
		const retryConfig = getRetryConfigForUrl(url, options);

		// If no retry config, just do a normal fetch
		if (!retryConfig) {
			return fetchFn(input, init);
		}

		let lastError: Error | null = null;
		let lastResponse: Response | null = null;

		for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
			try {
				const response = await fetchFn(input, init);

				// If response is ok or status is not in retry list, return it
				if (response.ok || !retryConfig.retryOnStatus.includes(response.status)) {
					return response;
				}

				lastResponse = response;

				// Check for Retry-After header
				const retryAfter = response.headers.get('Retry-After');
				let delay = retryConfig.baseDelay * Math.pow(2, attempt);

				if (retryAfter) {
					// Retry-After can be a number of seconds or an HTTP date
					const retryAfterSeconds = parseInt(retryAfter, 10);
					if (!isNaN(retryAfterSeconds)) {
						delay = retryAfterSeconds * 1000;
					} else {
						const retryDate = new Date(retryAfter);
						if (!isNaN(retryDate.getTime())) {
							delay = Math.max(0, retryDate.getTime() - Date.now());
						}
					}
				}

				// Don't wait if this is the last attempt
				if (attempt < retryConfig.maxRetries) {
					console.warn(
						`[custom-fetch] Request to ${url} failed with status ${response.status}. ` +
						`Retrying in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`
					);
					await sleep(delay);
				}
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				// Network errors should also trigger retries
				if (attempt < retryConfig.maxRetries) {
					const delay = retryConfig.baseDelay * Math.pow(2, attempt);
					console.warn(
						`[custom-fetch] Request to ${url} failed with error: ${lastError.message}. ` +
						`Retrying in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`
					);
					await sleep(delay);
				}
			}
		}

		// All retries exhausted
		if (lastResponse) {
			console.error(
				`[custom-fetch] Request to ${url} failed after ${retryConfig.maxRetries} retries ` +
				`with status ${lastResponse.status}`
			);
			return lastResponse;
		}

		if (lastError) {
			console.error(
				`[custom-fetch] Request to ${url} failed after ${retryConfig.maxRetries} retries ` +
				`with error: ${lastError.message}`
			);
			throw lastError;
		}

		// This should never happen, but TypeScript needs it
		throw new Error(`[custom-fetch] Request to ${url} failed for unknown reasons`);
	};
}

/**
 * A pre-configured custom fetch with default retry settings for common API domains.
 * Uses native fetch - for SvelteKit load functions, use createCustomFetch(fetch) instead.
 *
 * @example
 * const response = await customFetch('https://api.themoviedb.org/3/movie/popular');
 */
export const customFetch = createCustomFetch();

/**
 * Type for the custom fetch function
 */
export type CustomFetch = ReturnType<typeof createCustomFetch>;
