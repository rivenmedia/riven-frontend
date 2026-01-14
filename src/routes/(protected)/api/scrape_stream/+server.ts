import { error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { produce } from "sveltekit-sse";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("scrape-stream");

/**
 * SSE proxy endpoint for streaming scrape results.
 * Forwards the request to the backend's scrape_stream endpoint and
 * streams the response back to the client.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    const backendUrl = env.BACKEND_URL;
    if (!backendUrl) {
        logger.error("Scrape stream proxy: BACKEND_URL is not configured");
        error(500, "Backend URL is not configured");
    }

    return produce(async function start({ emit, lock }) {
        const abortController = new AbortController();

        try {
            // Use consolidated endpoint with stream=true param
            const searchParams = new URLSearchParams(url.searchParams);
            searchParams.set("stream", "true");
            // Ensure backendUrl doesn't have a trailing slash and target the correct /scrape endpoint
            const baseUrl = backendUrl.replace(/\/$/, "");
            const targetUrl = `${baseUrl}/api/v1/scrape?${searchParams.toString()}`;

            // Sanitize log URL
            const logUrl = new URL(targetUrl);
            logUrl.search = ""; // Redact all query params
            logger.info(`Scrape stream proxy: forwarding to ${logUrl.toString()}`);

            const response = await fetch(targetUrl, {
                method: "GET",
                headers: {
                    "x-api-key": env.BACKEND_API_KEY ?? "",
                    Accept: "text/event-stream",
                    "Cache-Control": "no-cache"
                },
                signal: abortController.signal
            });

            if (!response.ok) {
                const text = await response.text();
                logger.error(`Scrape stream proxy error ${response.status}: ${text}`);
                // Emit error event to client before closing
                emit(
                    "message",
                    JSON.stringify({
                        event: "error",
                        message: `An internal server error occurred (${response.status})`
                    })
                );
                lock.set(false);
                return function stop() {
                    abortController.abort();
                };
            }

            const reader = response.body?.getReader();
            if (!reader) {
                logger.error("Scrape stream proxy: No response body");
                lock.set(false);
                return function stop() {
                    abortController.abort();
                };
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        const { error: emitError } = emit("message", data);
                        if (emitError) {
                            reader.cancel();
                            return function stop() {
                                abortController.abort();
                            };
                        }
                    }
                }
            }
        } catch (e) {
            if (!(e instanceof Error && e.name === "AbortError")) {
                logger.error("Scrape stream proxy: Connection error:", e);
            }
        } finally {
            lock.set(false);
        }

        return function stop() {
            abortController.abort();
        };
    });
};
