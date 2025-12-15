import { error } from "@sveltejs/kit";
import type { RequestHandler, RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

/**
 * SSE proxy endpoint for streaming scrape results.
 * Forwards the request to the backend's scrape_stream endpoint and
 * streams the response back to the client.
 */
export const GET: RequestHandler = async ({ fetch, locals, url }: RequestEvent) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    const backendUrl = env.BACKEND_URL;
    if (!backendUrl) {
        error(500, "Backend URL is not configured");
    }

    try {
        const targetUrl = `${backendUrl}/api/v1/scrape/scrape_stream${url.search}`;

        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                "x-api-key": env.BACKEND_API_KEY ?? "",
                Accept: "text/event-stream",
                "Cache-Control": "no-cache"
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Scrape stream proxy error ${response.status}: ${text}`);
            error(response.status, `Backend error: ${response.statusText}`);
        }

        return new Response(response.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive"
            }
        });
    } catch (e) {
        console.error("Scrape stream proxy error:", e);
        error(500, "Failed to connect to scrape stream");
    }
};
