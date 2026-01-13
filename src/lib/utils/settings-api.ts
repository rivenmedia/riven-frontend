import providers from "$lib/providers";
import type { Schema } from "@sjsf/form";

/** Options for server-side API calls */
export interface ApiOptions {
    baseUrl: string;
    apiKey: string;
    fetch?: typeof globalThis.fetch;
}

/**
 * Fetch JSON schema for specific top-level keys.
 *
 * @param keys - Array of top-level schema keys (e.g., ['scraping', 'ranking'])
 * @param title - Title for the filtered schema
 * @param options - Server-side API options (baseUrl, apiKey)
 */
export async function getSchemaForKeys(
    keys: string[],
    title: string,
    options: ApiOptions
): Promise<Schema> {
    const response = await providers.riven.GET("/api/v1/settings/schema/keys", {
        baseUrl: options.baseUrl,
        headers: { "x-api-key": options.apiKey },
        fetch: options.fetch,
        params: {
            query: {
                keys: keys.join(","),
                title
            }
        }
    });

    if (response.error || !response.data) {
        throw new Error("Failed to fetch schema for keys");
    }

    return response.data as Schema;
}

/**
 * Fetch settings values for specific paths.
 *
 * @param paths - Array of settings paths (e.g., ['scraping', 'ranking'])
 * @param options - Server-side API options (baseUrl, apiKey)
 * @returns Object mapping paths to their values
 */
export async function getSettingsForPaths(
    paths: string[],
    options: ApiOptions
): Promise<Record<string, unknown>> {
    const response = await providers.riven.GET("/api/v1/settings/get/{paths}", {
        baseUrl: options.baseUrl,
        headers: { "x-api-key": options.apiKey },
        fetch: options.fetch,
        params: {
            path: { paths: paths.join(",") }
        }
    });

    if (response.error || !response.data) {
        throw new Error("Failed to fetch settings for paths");
    }

    return response.data as Record<string, unknown>;
}

/**
 * Save settings values for specific paths.
 *
 * @param paths - Array of settings paths to update
 * @param values - Object mapping paths to their new values
 * @param options - Server-side API options (baseUrl, apiKey)
 */
export async function setSettingsForPaths(
    paths: string[],
    values: Record<string, unknown>,
    options: ApiOptions
): Promise<void> {
    const response = await providers.riven.POST("/api/v1/settings/set/{paths}", {
        baseUrl: options.baseUrl,
        headers: { "x-api-key": options.apiKey },
        fetch: options.fetch,
        params: {
            path: { paths: paths.join(",") }
        },
        body: values
    });

    if (response.error) {
        throw new Error(`Failed to save settings: ${JSON.stringify(response.error)}`);
    }
}
