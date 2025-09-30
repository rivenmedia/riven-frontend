import type { PageServerLoad } from "./$types";
import { stats, services } from "$lib/api";
import { error } from "@sveltejs/kit";

export const load = (async () => {
    const statistics = await stats();
    const svc = await services();

    if (statistics.error) {
        error(500, "Unable to fetch stats data");
    }

    if (svc.error) {
        error(500, "Unable to fetch services data");
    }

    return {
        statistics: statistics.data,
        services: svc.data
    };
}) satisfies PageServerLoad;
