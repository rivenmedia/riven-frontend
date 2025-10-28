import type { PageServerLoad } from "./$types";
import { stats, services, downloadUserInfo } from "$lib/api";
import { error } from "@sveltejs/kit";

export const load = (async () => {

    const [statistics, svc, downloaderInfo] = await Promise.all([
        stats(),
        services(),
        downloadUserInfo()
    ]);

    if (statistics.error) {
        error(500, "Unable to fetch stats data");
    }

    if (svc.error) {
        error(500, "Unable to fetch services data");
    }

    return {
        statistics: statistics.data,
        services: svc.data,
        downloaderInfo: downloaderInfo.data
    };
}) satisfies PageServerLoad;
