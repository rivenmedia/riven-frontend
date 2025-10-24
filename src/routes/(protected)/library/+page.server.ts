import type { Actions, PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";
import { getItems } from "$lib/api";
import { itemsSearchSchema } from "$lib/schemas/items";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, fail, setError } from "sveltekit-superforms";

function extractYear(airedAt: string | null): number | null {
    if (!airedAt) return null;
    const year = new Date(airedAt).getFullYear();
    return isNaN(year) ? null : year;
}

function transformItems(items: any[]) {
    return items.map((item) => ({
        id:
            item.type === "Movie"
                ? item.tmdb_id
                : item.type === "Show"
                  ? item.tvdb_id
                  : item.type === "Season"
                    ? item.parent_ids.tvdb_id
                    : item.type === "Episode"
                      ? item.parent_ids.tvdb_id
                      : null,
        title: item.title,
        poster_path: item.poster_path,
        media_type: item.type,
        year: extractYear(item.aired_at),
        indexer: item.type === "Movie" ? "tmdb" : "tvdb",
        type:
            item.type === "Movie"
                ? "movie"
                : item.type === "Show"
                  ? "show"
                  : item.type === "Season"
                    ? "season"
                    : item.type === "Episode"
                      ? "episode"
                      : "unknown"
    }));
}

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user || !event.locals.session) {
        return redirect(302, "/auth/login");
    }

    const itemsSearchForm = await superValidate(event.url.searchParams, zod4(itemsSearchSchema));

    const itemsResponse = await getItems({
        query: itemsSearchForm.data
    });

    if (itemsResponse.error) {
        error(500, "Failed to fetch items");
    }

    return {
        items: itemsResponse.data ? transformItems(itemsResponse.data.items) : [],
        itemsSearchForm
    };
};
