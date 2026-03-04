import type { RequestHandler } from "./$types";
import { createSseProxy } from "$lib/server/sse-proxy";

/** Proxies the backend logging SSE stream to the client. */
export const POST: RequestHandler = async ({ locals }) => {
    return createSseProxy({
        locals,
        path: "/api/v1/stream/logging",
        eventName: "log",
        logScope: "logs-api"
    });
};
