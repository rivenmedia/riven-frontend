import { redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("watch-redirect");

export const GET: RequestHandler = async ({ params, fetch }) => {
    const backendUrl = env.BACKEND_URL;
    let mediaType = "movie";

    if (!backendUrl) {
        logger.warn(`No BACKEND_URL configured`);
    } else {
        const targetUrl = `${backendUrl.replace(/\/?$/, "")}/api/v1/triven/item/${params.id}`;
        try {
            const res = await fetch(targetUrl, {
                method: "GET",
                headers: {
                    "x-api-key": env.BACKEND_API_KEY ?? "",
                    "Cache-Control": "no-cache"
                }
            });

            if (res.ok) {
                const item = await res.json();
                if (item && item.type === "show") {
                    mediaType = "tv";
                }
            } else {
                logger.warn(
                    `Backend lookup failed for id=${params.id} (Status ${res.status}), falling back to movie`
                );
            }
        } catch (e: any) {
            logger.warn(
                `Backend fetch error for id=${params.id} (${e.message}), falling back to movie`
            );
        }
    }

    redirect(307, `/details/media/${params.id}/${mediaType}?play=true`);
};
