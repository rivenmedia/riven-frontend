// Disables access to DOM typings like `HTMLElement` which are not available
// inside a service worker and instantiates the correct globals
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Ensures that the `$service-worker` import has proper type definitions
/// <reference types="@sveltejs/kit" />
// Only necessary if you have an import from `$env/static/public`
/// <reference types="../.svelte-kit/ambient.d.ts" />

import { build, files, version } from "$service-worker";

const self = globalThis.self as unknown as ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;
const EXTERNAL_IMAGES_CACHE = `external-images-${version}`;
const ASSETS = [...build, ...files];

const IMAGE_DOMAINS = [
    "tmdb.org",
    "themoviedb.org",
    "anilist.co",
    "s4.anilist.co",
    "cdn.anilist.co"
];

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/i;

const CACHE_CONFIG = {
    maxAge: 24 * 60 * 60 * 1000,
    maxEntries: 1000
};

function isImageRequest(request: Request, url: URL): boolean {
    const acceptHeader = request.headers.get("accept");
    const hasImageAccept = acceptHeader?.includes("image/");
    const hasImageExtension = IMAGE_EXTENSIONS.test(url.pathname);

    return Boolean(hasImageAccept || hasImageExtension);
}

function isExternalImageDomain(url: URL): boolean {
    return IMAGE_DOMAINS.some((domain) => url.hostname.includes(domain));
}

async function handleExternalImageRequest(request: Request): Promise<Response> {
    const imageCache = await caches.open(EXTERNAL_IMAGES_CACHE);
    const cachedResponse = await imageCache.match(request);

    if (cachedResponse) {
        const cacheDate = cachedResponse.headers.get("sw-cache-date");
        if (cacheDate) {
            const age = Date.now() - parseInt(cacheDate, 10);
            if (age < CACHE_CONFIG.maxAge) {
                return cachedResponse;
            }
        } else {
            return cachedResponse;
        }
    }

    try {
        const response = await fetch(request, { mode: "no-cors" });

        if (!(response instanceof Response)) {
            throw new Error("Invalid response from fetch");
        }

        if (response.type === "opaque" || response.status === 200) {
            if (response.type === "opaque") {
                await imageCache.put(request, response.clone());
            } else {
                const responseToCache = response.clone();
                const headers = new Headers(responseToCache.headers);
                headers.set("sw-cache-date", Date.now().toString());

                const cachedResponse = new Response(responseToCache.body, {
                    status: responseToCache.status,
                    statusText: responseToCache.statusText,
                    headers
                });

                await imageCache.put(request, cachedResponse);
            }

            await maintainCacheSize(imageCache);
        }

        return response;
    } catch (err) {
        console.error(`Failed to fetch external image from ${request.url}:`, err);

        if (cachedResponse) {
            return cachedResponse;
        }

        throw err;
    }
}

async function maintainCacheSize(cache: Cache): Promise<void> {
    try {
        const keys = await cache.keys();
        if (keys.length > CACHE_CONFIG.maxEntries) {
            const keysToDelete = keys.slice(0, keys.length - CACHE_CONFIG.maxEntries);
            await Promise.all(keysToDelete.map((key) => cache.delete(key)));
        }
    } catch (err) {
        console.error("Error maintaining cache size:", err);
    }
}

async function handleGeneralRequest(request: Request, url: URL): Promise<Response> {
    const cache = await caches.open(CACHE);

    if (ASSETS.includes(url.pathname)) {
        const cachedResponse = await cache.match(url.pathname);
        if (cachedResponse) {
            return cachedResponse;
        }
    }

    try {
        const response = await fetch(request);

        if (!(response instanceof Response)) {
            throw new Error("Invalid response from fetch");
        }

        if (response.status === 200 && shouldCacheResponse(url, response)) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (err) {
        console.error(`Fetch failed for ${request.url}:`, err);

        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        throw err;
    }
}

function shouldCacheResponse(url: URL, response: Response): boolean {
    if (ASSETS.includes(url.pathname)) {
        return true;
    }

    const cacheControl = response.headers.get("cache-control");
    if (cacheControl && (cacheControl.includes("public") || cacheControl.includes("max-age"))) {
        return true;
    }

    return false;
}

self.addEventListener("install", (event) => {
    console.log(`Service Worker ${version} installing...`);

    async function addFilesToCache(): Promise<void> {
        try {
            const cache = await caches.open(CACHE);
            await cache.addAll(ASSETS);
            await caches.open(EXTERNAL_IMAGES_CACHE);
            console.log(`Service Worker ${version} installed successfully`);
        } catch (err) {
            console.error("Failed to cache assets during install:", err);
            throw err;
        }
    }

    event.waitUntil(addFilesToCache());
});

self.addEventListener("activate", (event) => {
    console.log(`Service Worker ${version} activating...`);

    async function deleteOldCaches(): Promise<void> {
        try {
            const cacheNames = await caches.keys();
            const currentCaches = new Set([CACHE, EXTERNAL_IMAGES_CACHE]);

            const deletePromises = cacheNames
                .filter((cacheName) => !currentCaches.has(cacheName))
                .map((cacheName) => {
                    console.log(`Deleting old cache: ${cacheName}`);
                    return caches.delete(cacheName);
                });

            await Promise.all(deletePromises);
            console.log(`Service Worker ${version} activated successfully`);
        } catch (err) {
            console.error("Failed to delete old caches:", err);
            throw err;
        }
    }

    event.waitUntil(deleteOldCaches());
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    async function respond(): Promise<Response> {
        const url = new URL(event.request.url);

        if (isExternalImageDomain(url) && isImageRequest(event.request, url)) {
            return handleExternalImageRequest(event.request);
        }

        return handleGeneralRequest(event.request, url);
    }

    event.respondWith(respond());
});
