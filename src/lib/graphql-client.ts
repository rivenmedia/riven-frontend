/**
 * Minimal GraphQL client for communicating with the Rust backend.
 *
 * Server-side usage (in load functions / server routes):
 *   import { gql } from '$lib/graphql-client';
 *   const data = await gql<{ stats: Stats }>(locals.backendUrl, locals.apiKey, QUERY, vars, fetch);
 *
 * Client-side usage (in Svelte components):
 *   import { gqlClient } from '$lib/graphql-client';
 *   const data = await gqlClient<{ removeItems: number }>(MUTATION, vars);
 *
 *   import { gqlSubscribeClient } from '$lib/graphql-client';
 *   const unsubscribe = gqlSubscribeClient<...>(SUBSCRIPTION, vars, { onData, onError });
 *
 * Subscriptions go over a single shared WebSocket via the `graphql-ws`
 * transport, so any number of concurrent subscriptions multiplex onto one
 * TCP connection regardless of HTTP version. This avoids exhausting the
 * per-origin HTTP/1.1 connection cap on bare-HTTP deployments.
 */

import { createClient, type Client as GraphQLWSClient } from "graphql-ws";

interface GraphQLResponse<T> {
    data?: T;
    errors?: Array<{ message: string; locations?: unknown; path?: unknown }>;
}

interface GraphQLSubscribeHandlers<T> {
    onData: (data: T) => void;
    onError?: (error: Error) => void;
}

const GRAPHQL_PROXY_URL = "/graphql";
const JSON_CONTENT_TYPE = "application/json";

function getGraphQLData<T>(result: GraphQLResponse<T>): T {
    if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors.map((e) => e.message).join("; "));
    }

    if (result.data === undefined) {
        throw new Error("GraphQL response contained no data");
    }

    return result.data;
}

/// Lazily-constructed singleton `graphql-ws` client. All client-side
/// subscriptions share this one WebSocket, so concurrent subscription
/// count no longer pressures the per-origin HTTP connection cap.
///
/// Constructed on first use because module evaluation runs during SSR
/// where `window` is undefined.
let wsClient: GraphQLWSClient | null = null;

function getWsClient(): GraphQLWSClient {
    if (wsClient) return wsClient;
    if (typeof window === "undefined") {
        throw new Error("gqlSubscribeClient called during SSR (WebSocket unavailable)");
    }
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    wsClient = createClient({
        url: `${wsProtocol}//${window.location.host}${GRAPHQL_PROXY_URL}`,
        // Allow the browser to send the better-auth session cookie on the
        // upgrade request. SvelteKit's `/graphql` proxy gates the upgrade
        // on a valid session and injects the backend API key server-side.
        lazy: true,
        // Reconnect with exponential backoff up to ~20s on transient
        // network failures. graphql-ws handles this automatically once
        // `shouldRetry` is truthy.
        shouldRetry: () => true,
        retryAttempts: Infinity,
        retryWait: (retries) =>
            new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** retries, 20000)))
    });
    return wsClient;
}

/**
 * Execute a GraphQL operation against the backend, adding the x-api-key header.
 * Use this server-side where you have access to backendUrl and apiKey.
 */
export async function gql<T>(
    backendUrl: string,
    apiKey: string,
    query: string,
    variables?: Record<string, unknown>,
    fetchFn: typeof fetch = fetch,
    extraHeaders?: HeadersInit
): Promise<T> {
    const response = await fetchFn(`${backendUrl}/graphql`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            ...(extraHeaders ?? {})
        },
        body: JSON.stringify({ query, variables: variables ?? {} })
    });

    if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    return getGraphQLData(result);
}

/**
 * Execute a GraphQL operation client-side via the /graphql SvelteKit proxy.
 * Auth is handled transparently by the proxy route.
 */
export async function gqlClient<T>(
    query: string,
    variables?: Record<string, unknown>,
    signal?: AbortSignal
): Promise<T> {
    const response = await fetch(GRAPHQL_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": JSON_CONTENT_TYPE },
        body: JSON.stringify({ query, variables: variables ?? {} }),
        signal
    });

    if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    return getGraphQLData(result);
}

/**
 * Execute a client-side GraphQL subscription over the shared WebSocket
 * connection (graphql-ws / graphql-transport-ws protocol). Any number of
 * concurrent subscriptions multiplex onto one TCP connection.
 *
 * Auth is established at WebSocket upgrade time: the browser sends the
 * better-auth session cookie, SvelteKit's `/graphql` upgrade handler
 * validates it and the proxy injects the backend API key. The backend
 * then authorises the connection as the trusted-API-key principal for
 * the duration of the WebSocket.
 */
export function gqlSubscribeClient<T>(
    query: string,
    variables: Record<string, unknown> | undefined,
    handlers: GraphQLSubscribeHandlers<T>
): () => void {
    let active = true;
    const unsubscribe = getWsClient().subscribe<T>(
        { query, variables: variables ?? {} },
        {
            next: (result) => {
                if (!active) return;
                if (result.errors && result.errors.length > 0) {
                    handlers.onError?.(new Error(result.errors.map((e) => e.message).join("; ")));
                    return;
                }
                if (result.data !== undefined && result.data !== null) {
                    handlers.onData(result.data as T);
                }
            },
            error: (err) => {
                if (!active) return;
                handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
            },
            complete: () => {
                if (active) handlers.onError?.(new Error("Stream ended"));
            }
        }
    );

    return () => {
        active = false;
        unsubscribe();
    };
}
