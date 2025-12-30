import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { error } from "@sveltejs/kit";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("dashboard");

export const load = (async ({ fetch, locals }) => {
    const [statistics, svc, downloaderInfo] = await Promise.all([
        providers.riven.GET("/api/v1/stats", {
            baseUrl: locals.backendUrl,
            headers: {
                "x-api-key": locals.apiKey
            },
            fetch: fetch
        }),

        providers.riven.GET("/api/v1/services", {
            baseUrl: locals.backendUrl,
            headers: {
                "x-api-key": locals.apiKey
            },
            fetch: fetch
        }),
        providers.riven.GET("/api/v1/downloader_user_info", {
            baseUrl: locals.backendUrl,
            headers: {
                "x-api-key": locals.apiKey
            },
            fetch: fetch
        })
    ]);

    if (statistics.error) {
        logger.error("Statistics fetch error:", statistics.error);
        error(500, "Unable to fetch stats data");
    }

    if (svc.error) {
        logger.error("Services fetch error:", svc.error);
        error(500, "Unable to fetch services data");
    }

    if (downloaderInfo.error) {
        logger.error("Downloader info fetch error:", downloaderInfo.error);
        error(500, "Unable to fetch downloader info data");
    }

    return {
        statistics: statistics.data,
        services: svc.data || {},
        downloaderInfo: downloaderInfo.data
    };
}) satisfies PageServerLoad;
