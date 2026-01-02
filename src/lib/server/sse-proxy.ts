import type { Writable } from "svelte/store";
import type { Unsafe } from "sveltekit-sse";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("sse-proxy");

interface SSEProxyOptions {
	endpoint: string;
	eventName: string;
	backendUrl: string;
	apiKey: string;
	emit: (event: string, data: string) => Unsafe<void, Error>;
	lock: Writable<boolean>;
}

export async function createSSEProxy({
	endpoint,
	eventName,
	backendUrl,
	apiKey,
	emit,
	lock
}: SSEProxyOptions): Promise<() => void> {
	const abortController = new AbortController();

	try {
		const response = await fetch(`${backendUrl}/api/v1/stream/${endpoint}`, {
			method: "GET",
			headers: {
				"x-api-key": apiKey,
				Accept: "text/event-stream",
				"Cache-Control": "no-cache"
			},
			signal: abortController.signal
		});

		if (!response.ok) {
			logger.error(`${eventName} proxy: Backend error ${response.status}`);
			lock.set(false);
			return function stop() {
				abortController.abort();
			};
		}

		const reader = response.body?.getReader();
		if (!reader) {
			logger.error(`${eventName} proxy: No response body`);
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
					const { error: emitError } = emit(eventName, data);
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
			logger.error(`${eventName} proxy: Connection error:`, e);
		}
	} finally {
		lock.set(false);
	}

	return function stop() {
		abortController.abort();
	};
}
