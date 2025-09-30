import type { PageServerLoad } from "./$types";
import { stats } from "$lib/api";
import { error } from "@sveltejs/kit";

export const load = (async () => {
    const statistics = await stats();

    if (statistics.error) {
        error(500, "Unable to fetch stats data");
    }

    return {
        statistics: statistics.data
    };
}) satisfies PageServerLoad;
