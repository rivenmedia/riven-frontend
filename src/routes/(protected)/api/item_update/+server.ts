import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { produce } from "sveltekit-sse";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("item-update-api");

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		error(401, "Unauthorized");
	}

	const backendUrl = env.BACKEND_URL;
	if (!backendUrl) {
		logger.error("Item update proxy: BACKEND_URL is not configured");
		error(500, "Backend URL is not configured");
	}

	return produce(async function start({ emit, lock }) {
		const abortController = new AbortController();

		try {
			const response = await fetch(`${backendUrl}/api/v1/stream/item_update`, {
				method: "GET",
				headers: {
					"x-api-key": env.BACKEND_API_KEY || "",
					Accept: "text/event-stream",
					"Cache-Control": "no-cache"
				},
				signal: abortController.signal
			});

			if (!response.ok) {
				logger.error(`Item update proxy: Backend error ${response.status}`);
				lock.set(false);
				return function stop() {
					abortController.abort();
				};
			}

			const reader = response.body?.getReader();
			if (!reader) {
				logger.error("Item update proxy: No response body");
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
						const { error: emitError } = emit("item_update", data);
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
				logger.error("Item update proxy: Connection error:", e);
			}
		} finally {
			lock.set(false);
		}

		return function stop() {
			abortController.abort();
		};
	});
};
