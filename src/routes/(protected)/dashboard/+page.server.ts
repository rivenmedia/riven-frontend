import type { PageServerLoad } from "./$types";
import { stats, services, downloadUserInfo } from "$lib/api";
import { error } from "@sveltejs/kit";

export const load = (async ({ fetch }) => {
    const [statistics, svc, downloaderInfo] = await Promise.all([
        stats({
            fetch: fetch
        }),
        services({
            fetch: fetch
        }),
        downloadUserInfo({
            fetch: fetch
        })
    ]);

    if (statistics.error) {
        error(500, "Unable to fetch stats data");
    }

    if (svc.error) {
        error(500, "Unable to fetch services data");
    }

    if (downloaderInfo.error) {
        error(500, "Unable to fetch downloader info data");
    }

    return {
        statistics: statistics.data,
        services: svc.data,
        downloaderInfo: downloaderInfo.data
    };
}) satisfies PageServerLoad;
