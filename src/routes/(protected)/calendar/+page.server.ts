import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { error } from "@sveltejs/kit";

export const load = (async ({ fetch, locals }) => {
    const calendar = await providers.riven.GET("/api/v1/calendar", {
        baseUrl: locals.backendUrl,
        headers: {
            "x-api-key": locals.apiKey
        },
        fetch: fetch
    });

    if (calendar.error) {
        error(500, "Unable to fetch calendar data");
    }

    return {
        calendar: calendar.data
    };
}) satisfies PageServerLoad;
