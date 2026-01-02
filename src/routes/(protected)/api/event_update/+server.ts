import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { produce } from "sveltekit-sse";
import { createScopedLogger } from "$lib/logger";
import { createSSEProxy } from "$lib/server/sse-proxy";

const logger = createScopedLogger("event-update-api");

export const POST: RequestHandler = async ({ locals }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    const backendUrl = env.BACKEND_URL;
    if (!backendUrl) {
        logger.error("Event update proxy: BACKEND_URL is not configured");
        error(500, "Backend URL is not configured");
    }

    return produce(({ emit, lock }) =>
        createSSEProxy({
            endpoint: "event_update",
            eventName: "event_update",
            backendUrl,
            apiKey: env.BACKEND_API_KEY || "",
            emit,
            lock
        })
    );
};
