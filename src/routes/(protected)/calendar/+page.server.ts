import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { error } from "@sveltejs/kit";
import * as dateUtils from "$lib/utils/date";

export const load = (async ({ fetch, locals, url }) => {
    const today = dateUtils.getToday();
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");

    let year = today.year;
    let month = today.month;

    if (yearParam && monthParam) {
        year = parseInt(yearParam, 10) || year;
        month = parseInt(monthParam, 10) || month;
    }

    const firstDay = dateUtils.getFirstDayOfMonth(year, month);
    const lastDay = dateUtils.getLastDayOfMonth(year, month);

    const start_date = new Date(firstDay.year, firstDay.month - 1, firstDay.day);
    start_date.setDate(start_date.getDate() - 7);

    const end_date = new Date(lastDay.year, lastDay.month - 1, lastDay.day);
    end_date.setDate(end_date.getDate() + 7);

    const startISO = start_date.toISOString();
    const endISO = end_date.toISOString();

    const calendar = await providers.riven.GET("/api/v1/calendar", {
        baseUrl: locals.backendUrl,
        params: {
            // The generated API types for this endpoint may not yet include start_date/end_date
            // in their query param schema. Cast through unknown to avoid compile error until spec regen.
            query: {
                start_date: startISO,
                end_date: endISO
            } as unknown as Record<string, string>
        },
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
