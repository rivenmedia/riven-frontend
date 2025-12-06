import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async ({ fetch, locals }) => {
    if (!locals.user || !locals.session) {
        console.log("Notification proxy: Unauthorized access attempt");
        throw error(401, "Unauthorized");
    }

    try {
        const backendUrl = env.BACKEND_URL;
        if (!backendUrl) {
            console.error("Notification proxy: BACKEND_URL is not configured");
            throw error(500, "Backend URL is not configured");
        }
        console.log(`Notification proxy: Connecting to ${backendUrl}/api/v1/stream/notifications`);

        const response = await fetch(`${backendUrl}/api/v1/stream/notifications`, {
            method: "GET",
            headers: {
                "x-api-key": env.BACKEND_API_KEY,
                Accept: "text/event-stream",
                "Cache-Control": "no-cache"
            }
        });

        console.log(`Notification proxy: Backend response status ${response.status}`);

        if (!response.ok) {
            const text = await response.text();
            console.error(`Notification proxy: Backend error ${response.status}: ${text}`);
            throw error(response.status, `Backend error: ${response.statusText}`);
        }

        return new Response(response.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*"
            }
        });
    } catch (e) {
        console.error("Notification proxy: Stream error:", e);
        throw error(500, "Failed to connect to log stream");
    }
};
