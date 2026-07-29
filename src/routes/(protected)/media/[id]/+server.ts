import { error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { buildBackendRoleHeaders } from "$lib/server/rbac";

// Headers worth forwarding from the backend so the browser can render a proper
// download (filename, size, resumable ranges).
const FORWARDED_RESPONSE_HEADERS = [
    "content-type",
    "content-length",
    "content-disposition",
    "content-range",
    "accept-ranges",
    "cache-control",
    "last-modified",
    "etag"
];

/**
 * Authenticated proxy for the backend `/media/{id}` bridge in download mode.
 *
 * Browsers can't attach the backend API key to a plain `<a download>` click, so
 * the download link points here (same origin, session-authenticated) and we
 * forward to the backend with the API key + signed role headers, streaming the
 * body straight through. Works for both debrid and usenet entries — the backend
 * decides how to source the bytes.
 */
export const GET: RequestHandler = async ({ locals, params, request }) => {
    const id = params.id;
    if (!id || !/^\d+$/.test(id)) {
        throw error(400, "Invalid media id");
    }

    const headers = new Headers({ "x-api-key": locals.apiKey });
    for (const [key, value] of Object.entries(
        buildBackendRoleHeaders(locals.user, locals.backendAuthSigningSecret)
    )) {
        headers.set(key, value);
    }
    // Forward range requests so downloads are resumable.
    const range = request.headers.get("range");
    if (range) {
        headers.set("range", range);
    }

    let response: Response;
    try {
        response = await fetch(`${locals.backendUrl}/media/${id}?download=1`, {
            method: "GET",
            headers
        });
    } catch {
        throw error(502, "Failed to reach media backend");
    }

    const responseHeaders = new Headers();
    for (const name of FORWARDED_RESPONSE_HEADERS) {
        const value = response.headers.get(name);
        if (value) {
            responseHeaders.set(name, value);
        }
    }

    return new Response(response.body, {
        status: response.status,
        headers: responseHeaders
    });
};
