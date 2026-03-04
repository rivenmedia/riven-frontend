import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import providers from "$lib/providers";
import type { InitialFormData } from "@sjsf/sveltekit";
import { createFormHandler, type FormHandlerOptions } from "@sjsf/sveltekit/server";
import * as defaults from "$lib/components/settings/form-defaults";
import type { UiSchemaRoot } from "@sjsf/form";
import {
    DEFAULT_TAB_ID,
    getPathsForTab,
    getTabById,
    SETTINGS_TABS
} from "$lib/components/settings/sections";
import { perfCount, startPerfMark, endPerfMark } from "$lib/perf";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("settings-page-server");

const SETTINGS_SCHEMA_CACHE_TTL_MS = 10 * 60 * 1000;

interface SettingsSchemaCacheEntry {
    schema: Record<string, unknown>;
    expiresAt: number;
}

const settingsSchemaCache = new Map<string, SettingsSchemaCacheEntry>();

function getSettingsSchemaCacheKey(backendUrl: string, tabId: string, paths: string): string {
    return `${backendUrl}::${tabId}::${paths}`;
}

function getCachedSettingsSchema(cacheKey: string): Record<string, unknown> | null {
    const cached = settingsSchemaCache.get(cacheKey);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
        settingsSchemaCache.delete(cacheKey);
        return null;
    }

    return cached.schema;
}

function setCachedSettingsSchema(cacheKey: string, schema: Record<string, unknown>): void {
    settingsSchemaCache.set(cacheKey, {
        schema,
        expiresAt: Date.now() + SETTINGS_SCHEMA_CACHE_TTL_MS
    });
}

function buildSettingsUiSchema(properties: Record<string, unknown>, keys: string[]): UiSchemaRoot {
    const order = keys.filter((k) => properties[k] !== undefined);
    const ui: Record<string, unknown> = {
        "ui:order": order.length > 0 ? order : undefined
    };
    if (keys.includes("api_key")) {
        ui["api_key"] = { "ui:components": { textWidget: "apiKeyWidget" } };
    }
    return ui as UiSchemaRoot;
}

async function getSchemaForKeys(
    baseUrl: string,
    apiKey: string,
    keys: string,
    fetchFn: typeof globalThis.fetch
): Promise<Record<string, unknown>> {
    const res = await providers.riven.GET("/api/v1/settings/schema/keys", {
        baseUrl,
        headers: { "x-api-key": apiKey },
        fetch: fetchFn,
        params: { query: { keys, title: "Settings" } }
    });
    if (res.error) {
        throw new Error("Failed to load settings schema");
    }
    return res.data as Record<string, unknown>;
}

async function getSettingsForPaths(
    baseUrl: string,
    apiKey: string,
    paths: string,
    fetchFn: typeof globalThis.fetch
): Promise<Record<string, unknown>> {
    const res = await providers.riven.GET("/api/v1/settings/get/{paths}", {
        baseUrl,
        headers: { "x-api-key": apiKey },
        fetch: fetchFn,
        params: { path: { paths } }
    });
    if (res.error) {
        throw new Error("Failed to load settings");
    }
    return res.data as Record<string, unknown>;
}

const SETTINGS_FETCH_TIMEOUT_MS = 20_000;
const SETTINGS_FETCH_RETRY_TIMEOUT_MS = 60_000;
const SETTINGS_FETCH_MAX_ATTEMPTS = 2;

class SettingsFetchTimeoutError extends Error {
    constructor(timeoutMs: number) {
        super(`Settings fetch timed out after ${timeoutMs}ms`);
        this.name = "SettingsFetchTimeoutError";
    }
}

function mergeAbortSignals(
    primary: AbortSignal,
    secondary: AbortSignal | null | undefined
): AbortSignal {
    if (!secondary) return primary;

    const controller = new AbortController();
    const abortFrom = (signal: AbortSignal) => {
        try {
            const signalWithReason = signal as AbortSignal & { reason?: unknown };
            controller.abort(signalWithReason.reason);
        } catch {
            controller.abort();
        }
    };

    if (primary.aborted) {
        abortFrom(primary);
        return controller.signal;
    }

    if (secondary.aborted) {
        abortFrom(secondary);
        return controller.signal;
    }

    primary.addEventListener("abort", () => abortFrom(primary), { once: true });
    secondary.addEventListener("abort", () => abortFrom(secondary), { once: true });
    return controller.signal;
}

function createFetchWithTimeout(
    fetchFn: typeof fetch,
    timeoutMs: number = SETTINGS_FETCH_TIMEOUT_MS
): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
        const timeoutController = new AbortController();
        let didTimeout = false;
        const id = setTimeout(() => {
            didTimeout = true;
            timeoutController.abort();
        }, timeoutMs);

        try {
            const signal = mergeAbortSignals(timeoutController.signal, init?.signal);
            return await fetchFn(input, { ...init, signal });
        } catch (e) {
            if (didTimeout) {
                throw new SettingsFetchTimeoutError(timeoutMs);
            }
            throw e;
        } finally {
            clearTimeout(id);
        }
    };
}

function isTimeoutError(e: unknown): boolean {
    if (e instanceof SettingsFetchTimeoutError) return true;
    const message = e instanceof Error ? e.message : String(e);
    const normalized = message.toLowerCase();
    return normalized.includes("timeout") || normalized.includes("timed out");
}

async function loadSettingsDataWithRetry(
    fetchFn: typeof fetch,
    backendUrl: string,
    apiKey: string,
    keys: string,
    paths: string
): Promise<[Record<string, unknown>, Record<string, unknown>]> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= SETTINGS_FETCH_MAX_ATTEMPTS; attempt++) {
        const timeoutMs =
            attempt === 1 ? SETTINGS_FETCH_TIMEOUT_MS : SETTINGS_FETCH_RETRY_TIMEOUT_MS;
        const fetchWithTimeout = createFetchWithTimeout(fetchFn, timeoutMs);
        const attemptStartedAt = Date.now();

        logger.info("Loading settings data attempt started", {
            attempt,
            maxAttempts: SETTINGS_FETCH_MAX_ATTEMPTS,
            timeoutMs,
            keyCount: keys.split(",").filter(Boolean).length,
            pathCount: paths.split(",").filter(Boolean).length
        });

        try {
            const result = (await Promise.all([
                getSchemaForKeys(backendUrl, apiKey, keys, fetchWithTimeout),
                getSettingsForPaths(backendUrl, apiKey, paths, fetchWithTimeout)
            ])) as [Record<string, unknown>, Record<string, unknown>];

            logger.info("Loading settings data attempt succeeded", {
                attempt,
                durationMs: Date.now() - attemptStartedAt,
                timeoutMs
            });

            return result;
        } catch (e) {
            lastError = e;

            logger.warn("Loading settings data attempt failed", {
                attempt,
                timeoutMs,
                durationMs: Date.now() - attemptStartedAt,
                timeoutError: isTimeoutError(e),
                error: e instanceof Error ? e.message : String(e)
            });

            if (!isTimeoutError(e) || attempt === SETTINGS_FETCH_MAX_ATTEMPTS) {
                break;
            }
        }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export const load: PageServerLoad = async ({
    fetch,
    locals,
    url,
    request
}: {
    fetch: typeof globalThis.fetch;
    locals: App.Locals;
    url: URL;
    request: Request;
}) => {
    const mark = startPerfMark("settings.load", {
        tab: url.searchParams.get("tab") ?? DEFAULT_TAB_ID
    });

    if (locals.user?.role !== "admin") {
        error(403, "Forbidden");
    }

    const tabId = url.searchParams.get("tab") ?? DEFAULT_TAB_ID;
    const tab = getTabById(tabId) ?? getTabById(DEFAULT_TAB_ID)!;
    const paths = getPathsForTab(tab);
    const keys = paths;
    const schemaCacheKey = getSettingsSchemaCacheKey(locals.backendUrl, tab.id, paths);

    logger.info("Settings page load started", {
        tab: tab.id,
        keyCount: keys.split(",").filter(Boolean).length,
        pathCount: paths.split(",").filter(Boolean).length,
        referer: request.headers.get("referer"),
        // Note: 'purpose' or 'sec-purpose' is used for preloads/prefetches
        // but is not 100% consistent across all browsers/SvelteKit versions.
        purpose: request.headers.get("purpose") ?? request.headers.get("sec-purpose"),
        secFetchMode: request.headers.get("sec-fetch-mode"),
        secFetchDest: request.headers.get("sec-fetch-dest")
    });

    let schema: Record<string, unknown>;
    let initialValue: Record<string, unknown>;

    try {
        [schema, initialValue] = await loadSettingsDataWithRetry(
            fetch,
            locals.backendUrl,
            locals.apiKey,
            keys,
            paths
        );
    } catch (e) {
        logger.error("Settings page load failed", {
            tab: tab.id,
            timeoutError: isTimeoutError(e),
            error: e instanceof Error ? e.message : String(e)
        });

        if (isTimeoutError(e)) {
            error(
                504,
                "Settings request timed out after retry. Backend may be slow or temporarily unreachable."
            );
        }

        // Fail visibly on all backend-related load failures to prevent
        // accidental saves of empty/default state.
        error(503, {
            message: "Failed to load settings from backend. Please check connectivity."
        });
    }

    const props = (schema.properties ?? {}) as Record<string, unknown>;
    const uiSchema = buildSettingsUiSchema(props, tab.keys) as unknown as UiSchemaRoot;
    setCachedSettingsSchema(schemaCacheKey, schema);
    perfCount("settings.schema.cache.set", 1, {
        tab: tab.id,
        pathCount: paths.split(",").filter(Boolean).length
    });

    endPerfMark(mark, {
        tab: tab.id,
        propertyCount: Object.keys(props).length
    });

    logger.info("Settings page load completed", {
        tab: tab.id,
        propertyCount: Object.keys(props).length
    });

    return {
        tabs: SETTINGS_TABS,
        activeTabId: tab.id,
        paths,
        form: {
            schema,
            initialValue,
            uiSchema
        } satisfies InitialFormData
    };
};

export const actions = {
    default: async ({
        request,
        fetch,
        locals,
        url
    }: {
        request: Request;
        fetch: typeof globalThis.fetch;
        locals: App.Locals;
        url: URL;
    }) => {
        const mark = startPerfMark("settings.submit", {
            tab: url.searchParams.get("tab") ?? DEFAULT_TAB_ID
        });

        if (locals.user?.role !== "admin") {
            error(403, "Forbidden");
        }

        const tabId = url.searchParams.get("tab") ?? DEFAULT_TAB_ID;
        const tab = getTabById(tabId) ?? getTabById(DEFAULT_TAB_ID)!;
        const paths = getPathsForTab(tab);
        const schemaCacheKey = getSettingsSchemaCacheKey(locals.backendUrl, tab.id, paths);

        const requestFormData = await request.formData();
        const schemaFromCache = getCachedSettingsSchema(schemaCacheKey);

        let schema: Record<string, unknown>;

        if (schemaFromCache) {
            schema = schemaFromCache;
            perfCount("settings.schema.cache.hit", 1, { tab: tab.id });
        } else {
            perfCount("settings.schema.cache.miss", 1, { tab: tab.id });
            schema = await getSchemaForKeys(locals.backendUrl, locals.apiKey, paths, fetch);
            setCachedSettingsSchema(schemaCacheKey, schema);
            perfCount("settings.schema.cache.set", 1, { tab: tab.id });
        }

        const uiSchema = buildSettingsUiSchema(
            (schema.properties ?? {}) as Record<string, unknown>,
            tab.keys
        );

        // The @sjsf form handler requires `any` because JSON schema types are inherently dynamic
        // and cannot be typed more narrowly without re-implementing the entire package's generics.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleForm = createFormHandler<any, true>({
            ...defaults,
            schema,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            uiSchema: uiSchema as any,
            sendData: true
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as FormHandlerOptions<any, true>);

        const [form] = await handleForm(request.signal, requestFormData);
        if (!form.isValid) {
            endPerfMark(mark, {
                tab: tab.id,
                valid: false
            });
            return fail(400, { form });
        }

        const res = await providers.riven.POST("/api/v1/settings/set/{paths}", {
            body: form.data as Record<string, unknown>,
            baseUrl: locals.backendUrl,
            headers: { "x-api-key": locals.apiKey },
            fetch,
            params: { path: { paths } }
        });

        if (res.error) {
            endPerfMark(mark, {
                tab: tab.id,
                valid: true,
                success: false
            });
            return fail(500, { form });
        }

        endPerfMark(mark, {
            tab: tab.id,
            valid: true,
            success: true
        });

        return { form };
    }
} satisfies Actions;
