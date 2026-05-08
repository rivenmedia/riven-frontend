import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";

/**
 * In-process TVDB session management.
 *
 * Replaces the previous per-request `handleTVDBCookie` SvelteKit hook with a
 * lazy, in-process token cache that the TVDB API client uses transparently.
 *
 * Caller-visible behavior:
 *   - On the first call to a TVDB endpoint that needs auth, a token is fetched
 *     from `/login` and cached in module memory.
 *   - Subsequent calls reuse the cached token.
 *   - If TVDB returns 401, the token is invalidated and refreshed once before
 *     the request is retried.
 *   - When TVDB is unreachable or refuses to issue a token, the module backs
 *     off for a minute so we don't hammer the API on every request, and
 *     callers see degraded responses (no Authorization header) rather than a
 *     thrown exception.
 *
 * Why this shape:
 *   - The hook approach made every request pay a synchronous TVDB round-trip
 *     (or appear to, depending on cookie state), even on routes that didn't
 *     touch TVDB.
 *   - The hook's `error(500, ...)` on TVDB failure took down the whole
 *     frontend (issue #301), including `/auth/login` itself, even though
 *     TVDB enrichment is best-effort.
 *   - Putting session management at the API client layer means individual
 *     callers don't need to know about cookies, headers, or refresh; they
 *     just call `providers.tvdb.GET(...)`.
 */

const logger = createScopedLogger("tvdb-session");

// Same key the hook used. The TVDB v4 docs recommend pinning a single project
// API key and reusing the resulting bearer token across requests.
const TVDB_API_KEY = "6be85335-5c4f-4d8d-b945-d3ed0eb8cdce";
const TVDB_LOGIN_URL = "https://api4.thetvdb.com/v4/login";

// One minute backoff between login attempts when TVDB is unhappy. Prevents a
// stampede on every request during a TVDB outage. Tunable; matches the value
// the hook-era patch used for the same reason.
const TOKEN_REFRESH_BACKOFF_MS = 60 * 1000;

const baseFetch = createCustomFetch();

let cachedToken: string | null = null;
let refreshBackoffUntil = 0;
// Single-flight: if a refresh is already underway, all concurrent callers
// await the same promise instead of triggering N parallel `/login` calls.
let inflight: Promise<string | null> | null = null;

async function fetchToken(): Promise<string | null> {
    try {
        const res = await baseFetch(TVDB_LOGIN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apikey: TVDB_API_KEY })
        });

        if (!res.ok) {
            logger.warn(`TVDB login returned HTTP ${res.status}`);
            return null;
        }

        const json = (await res.json()) as { data?: { token?: string } };
        return json.data?.token ?? null;
    } catch (e) {
        logger.warn(
            `TVDB login threw: ${e instanceof Error ? e.message : String(e)}`
        );
        return null;
    }
}

/**
 * Returns a TVDB bearer token, lazy-acquiring on first call and reusing the
 * cached value on subsequent calls.
 *
 * Pass `force: true` to invalidate the cache and re-acquire (used by
 * `tvdbFetch` after a 401).
 *
 * Returns `null` when TVDB is unreachable or refused to issue a token. Callers
 * should treat that as a degraded state and either skip TVDB enrichment or
 * surface a normal "no data" response - never throw.
 */
export async function getTvdbToken(force = false): Promise<string | null> {
    if (!force && cachedToken) {
        return cachedToken;
    }

    if (Date.now() < refreshBackoffUntil) {
        return null;
    }

    if (inflight) {
        return inflight;
    }

    inflight = (async () => {
        try {
            const token = await fetchToken();
            if (token) {
                cachedToken = token;
                return token;
            }
            refreshBackoffUntil = Date.now() + TOKEN_REFRESH_BACKOFF_MS;
            return null;
        } finally {
            inflight = null;
        }
    })();

    return inflight;
}

/**
 * Fetch wrapper for the TVDB API client. Injects the bearer token when one
 * is available and retries once on 401 with a freshly-acquired token.
 *
 * Wired into `providers.tvdb` via the openapi-fetch `fetch` option, so all
 * `providers.tvdb.GET(...)` / `.POST(...)` calls go through it without the
 * caller needing to know about session state.
 *
 * The `/login` endpoint itself bypasses auth injection (otherwise we'd need a
 * token to obtain the token).
 */
export async function tvdbFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const url =
        typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;

    if (url.endsWith("/login")) {
        return baseFetch(input, init);
    }

    const sendWithToken = async (token: string | null) => {
        const headers = new Headers(init?.headers);
        if (token && !headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return baseFetch(input, { ...init, headers });
    };

    let token = await getTvdbToken();
    let response = await sendWithToken(token);

    if (response.status === 401 && token) {
        // Token might be expired or revoked. Force a refresh and retry once.
        cachedToken = null;
        token = await getTvdbToken(true);
        if (token) {
            response = await sendWithToken(token);
        }
    }

    return response;
}
