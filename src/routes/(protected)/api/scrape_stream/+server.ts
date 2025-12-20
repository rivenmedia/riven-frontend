import { error } from "@sveltejs/kit";
import type { RequestHandler, RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { produce } from "sveltekit-sse";

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
        console.error("Scrape stream proxy: BACKEND_URL is not configured");
        error(500, "Backend URL is not configured");
    }

    return produce(async function start({ emit, lock }) {
        const abortController = new AbortController();

        try {
            const targetUrl = `${backendUrl}/api/v1/scrape/scrape_stream${url.search}`;
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
                console.error(`Scrape stream proxy error ${response.status}: ${text}`);
                lock.set(false);
                return function stop() {
                    abortController.abort();
                };
            }

            const reader = response.body?.getReader();
            if (!reader) {
                console.error("Scrape stream proxy: No response body");
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
                console.error("Scrape stream proxy: Connection error:", e);
            }
        } finally {
            lock.set(false);
        }

        return function stop() {
            abortController.abort();
        };
    });
};

