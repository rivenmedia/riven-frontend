import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async ({ fetch, locals }) => {
    if (!locals.user || !locals.session) {
        error(401, "Unauthorized");
    }

    try {
        const response = await fetch(`${env.BACKEND_URL}/api/v1/stream/logging`, {
            method: "GET",
            headers: {
                "x-api-key": env.BACKEND_API_KEY || "",
                Accept: "text/event-stream",
                "Cache-Control": "no-cache"
            }
        });

        if (!response.ok) {
            throw error(response.status, `Backend error: ${response.statusText}`);
        }

        return new Response(response.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Access-Control-Allow-Origin": "*"
            }
        });
    } catch (e) {
        console.error("Stream error:", e);
        throw error(500, "Failed to connect to log stream");
    }
};
