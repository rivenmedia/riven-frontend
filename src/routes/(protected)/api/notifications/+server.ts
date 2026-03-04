import type { RequestHandler } from "./$types";
import { createSseProxy } from "$lib/server/sse-proxy";

/** Proxies the backend notifications SSE stream to the client. */
export const POST: RequestHandler = async ({ locals }) => {
    return createSseProxy({
        locals,
        path: "/api/v1/stream/notifications",
        eventName: "notification",
        logScope: "notifications-api"
    });
};
