import type { PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";
import { itemsSearchSchema } from "$lib/schemas/items";
import { zod4 } from "sveltekit-superforms/adapters";
import providers from "$lib/providers";
import { superValidate } from "sveltekit-superforms";
import * as dateUtils from "$lib/utils/date";

const VALID_ITEM_TYPES = ["movie", "show", "season", "episode"] as const;
type ValidItemType = (typeof VALID_ITEM_TYPES)[number];
type ItemType = ValidItemType | "unknown";

interface RivenLibraryItem {
    id: number;
    type: string;
    title: string;
    tmdb_id?: string | null;
    tvdb_id?: string | null;
    parent_ids?: {
        tmdb_id?: string | null;
        tvdb_id?: string | null;
    } | null;
    poster_path?: string | null;
    aired_at?: string | null;
}

function getItemType(type: string): ItemType {
    return VALID_ITEM_TYPES.includes(type as ValidItemType) ? (type as ValidItemType) : "unknown";
}

function extractYear(airedAt: string | null | undefined): number | string {
    if (!airedAt) return "N/A";
    const year = dateUtils.getYearFromISO(airedAt);
    return year ?? "N/A";
}

function transformItems(items: RivenLibraryItem[]) {
    return items
        .map((item) => {
            // Determine ID and indexer for navigation
            // Movies use TMDB, Shows use TVDB (skip resolution)
            let id: string | number | null = null;
            let indexer: "tmdb" | "tvdb" = "tmdb";

            if (item.type === "movie") {
                id = item.tmdb_id ?? null;
                indexer = "tmdb";
            } else if (item.type === "show") {
                // Shows use TVDB directly - skip TMDB->TVDB resolution
                id = item.tvdb_id ?? null;
                indexer = "tvdb";
            } else if (item.type === "season" || item.type === "episode") {
                // Seasons/episodes use parent's TVDB ID
                id = item.parent_ids?.tvdb_id ?? null;
                indexer = "tvdb";
            }

            // Skip items without valid navigation IDs
            if (id === null || id === undefined) {
                console.warn(
                    `Skipping item "${item.title}" (riven_id: ${item.id}, type: ${item.type}): missing required ID field`
                );
                return null;
            }

            return {
                id,
                title: item.title,
                poster_path: item.poster_path,
                media_type: item.type,
                year: extractYear(item.aired_at),
                indexer,
                type: getItemType(item.type),
                riven_id: item.id
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
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
        items: itemsResponse.data
            ? transformItems(itemsResponse.data.items as RivenLibraryItem[])
            : [],
        page: itemsResponse.data ? itemsResponse.data.page : 1,
        totalPages: itemsResponse.data ? itemsResponse.data.total_pages : 1,
        limit: itemsResponse.data ? itemsResponse.data.limit : 20,
        totalItems: itemsResponse.data ? itemsResponse.data.total_items : 0,
        itemsSearchForm
    };
};
