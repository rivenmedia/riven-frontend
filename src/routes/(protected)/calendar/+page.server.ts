import type { PageServerLoad } from "./$types";
import { fetchCalendar } from "$lib/api";
import { error } from "@sveltejs/kit";

export const load = (async () => {
    const calendar = await fetchCalendar();

    if (calendar.error) {
        error(500, "Unable to fetch calendar data");
    }

    return {
        calendar: calendar.data
    };
}) satisfies PageServerLoad;
