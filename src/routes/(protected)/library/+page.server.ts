import type { PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";
import { itemsSearchSchema } from "$lib/schemas/items";
import { zod4 } from "sveltekit-superforms/adapters";
import providers from "$lib/providers";
import { superValidate } from "sveltekit-superforms";
import * as dateUtils from "$lib/utils/date";
// import { message, fail, setError } from "sveltekit-superforms";

function extractYear(airedAt: string | null): number | string {
    if (!airedAt) return "N/A";
    const year = dateUtils.getYearFromISO(airedAt);
    return year ?? "N/A";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformItems(items: any[]) {
    return items.map((item) => {
        // Determine ID and indexer for navigation
        // Movies use TMDB, Shows use TVDB (skip resolution)
        let id: string | number | null = null;
        let indexer: "tmdb" | "tvdb" = "tmdb";

        if (item.type === "movie") {
            id = item.tmdb_id;
            indexer = "tmdb";
        } else if (item.type === "show") {
            // Shows use TVDB directly - skip TMDB->TVDB resolution
            id = item.tvdb_id;
            indexer = "tvdb";
        } else if (item.type === "season" || item.type === "episode") {
            // Seasons/episodes use parent's TVDB ID
            id = item.parent_ids?.tvdb_id;
            indexer = "tvdb";
        }

        return {
            id,
            title: item.title,
            poster_path: item.poster_path,
            media_type: item.type,
            year: extractYear(item.aired_at),
            indexer,
            type:
                item.type === "movie"
                    ? "movie"
                    : item.type === "show"
                      ? "show"
                      : item.type === "season"
                        ? "season"
                        : item.type === "episode"
                          ? "episode"
                          : "unknown",
            riven_id: item.id
        };
    });
}

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user || !event.locals.session) {
        return redirect(302, "/auth/login");
    }

    const itemsSearchForm = await superValidate(event.url.searchParams, zod4(itemsSearchSchema));

    const itemsResponse = await providers.riven.GET("/api/v1/items", {
        params: {
            query: itemsSearchForm.data
        },
        baseUrl: event.locals.backendUrl,
        headers: {
            "x-api-key": event.locals.apiKey
        },
        fetch: event.fetch
    });

    if (itemsResponse.error) {
        error(500, "Failed to fetch items");
    }

    return {
        items: itemsResponse.data ? transformItems(itemsResponse.data.items) : [],
        page: itemsResponse.data ? itemsResponse.data.page : 1,
        totalPages: itemsResponse.data ? itemsResponse.data.total_pages : 1,
        limit: itemsResponse.data ? itemsResponse.data.limit : 20,
        totalItems: itemsResponse.data ? itemsResponse.data.total_items : 0,
        itemsSearchForm
    };
};
