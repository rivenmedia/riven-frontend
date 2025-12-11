import type { PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";
import { itemsSearchSchema } from "$lib/schemas/items";
import { zod4 } from "sveltekit-superforms/adapters";
import providers from "$lib/providers";
import { superValidate } from "sveltekit-superforms";
// import { message, fail, setError } from "sveltekit-superforms";

function extractYear(airedAt: string | null): number | null {
    if (!airedAt) return null;
    const year = new Date(airedAt).getFullYear();
    return isNaN(year) ? null : year;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformItems(items: any[]) {
    return items.map((item) => ({
        id:
            item.type === "movie"
                ? item.tmdb_id
                : item.type === "show"
                    ? item.tvdb_id
                    : item.type === "season"
                        ? item.parent_ids.tvdb_id
                        : item.type === "episode"
                            ? item.parent_ids.tvdb_id
                            : null,
        title: item.title,
        poster_path: item.poster_path,
        media_type: item.type,
        year: extractYear(item.aired_at),
        indexer: item.type === "movie" ? "tmdb" : "tvdb",
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
    }));
}

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user || !event.locals.session) {
        return redirect(302, "/auth/login");
    }

    const itemsSearchForm = await superValidate(event.url.searchParams, zod4(itemsSearchSchema));

    const countResponse = await providers.riven.GET("/api/v1/items", {
        params: {
            query: {
                ...itemsSearchForm.data,
                count_only: true
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        },
        baseUrl: event.locals.backendUrl,
        headers: {
            "x-api-key": event.locals.apiKey
        },
        fetch: event.fetch
    });

    if (countResponse.error) {
        error(500, "Failed to fetch items count");
    }

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

    return {
        items: itemsResponse.data ? transformItems(itemsResponse.data.items) : [],
        page: countResponse.data ? countResponse.data.page : 1,
        totalPages: countResponse.data ? countResponse.data.total_pages : 1,
        limit: countResponse.data ? countResponse.data.limit : 20,
        totalItems: countResponse.data ? countResponse.data.total_items : 0,
        itemsSearchForm
    };
};
