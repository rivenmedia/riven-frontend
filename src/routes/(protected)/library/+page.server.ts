import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { itemsSearchSchema } from "$lib/schemas/items";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms";
import { gql } from "$lib/graphql-client";
import * as dateUtils from "$lib/utils/date";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("library-page-server");
const LIBRARY_ITEMS_DEPENDENCY = "riven:library-items";

interface FilterOption {
    value: string;
    label: string;
}

interface GqlMediaItem {
    id: number;
    itemType: string;
    title: string;
    tmdbId?: string | null;
    tvdbId?: string | null;
    parentId?: number | null;
    posterPath?: string | null;
    airedAt?: string | null;
    seasonNumber?: number | null;
    episodeNumber?: number | null;
    showId?: number | null;
    showTitle?: string | null;
    showTmdbId?: string | null;
    showTvdbId?: string | null;
    showPosterPath?: string | null;
}

interface GqlItemsPage {
    items: GqlMediaItem[];
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
}

const ITEMS_QUERY = `
    query GetItems(
        $page: Int
        $limit: Int
        $sort: String
        $types: [MediaItemType!]
        $search: String
        $states: [MediaItemState!]
    ) {
        items(page: $page, limit: $limit, sort: $sort, types: $types, search: $search, states: $states) {
            items {
                id
                itemType
                title
                tmdbId
                tvdbId
                parentId
                posterPath
                airedAt
                seasonNumber
                episodeNumber
                showId
                showTitle
                showTmdbId
                showTvdbId
                showPosterPath
            }
            page
            limit
            totalItems
            totalPages
        }
    }
`;

const FILTER_ENUMS_QUERY = `
    query LibraryFilterEnums {
        mediaItemType: __type(name: "MediaItemType") {
            enumValues {
                name
            }
        }
        mediaItemState: __type(name: "MediaItemState") {
            enumValues {
                name
            }
        }
    }
`;

function labelFromEnum(value: string): string {
    return value
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function typeValueFromEnum(value: string): string {
    return value.toLowerCase();
}

function extractYear(airedAt: string | null | undefined): number | string {
    if (!airedAt) return "N/A";
    const year = dateUtils.getYearFromISO(airedAt);
    return year ?? "N/A";
}

function transformItems(items: GqlMediaItem[]) {
    return items
        .map((item) => {
            const rawType = item.itemType.toLowerCase();
            let id: string | number | null = null;
            let indexer: "tmdb" | "tvdb" = "tmdb";
            let mediaPageType = rawType === "show" ? "tv" : rawType;
            let posterPath = item.posterPath;
            const detailParams = new URLSearchParams();

            if (rawType === "movie") {
                id = item.tmdbId ?? null;
                indexer = "tmdb";
            } else if (rawType === "show") {
                id = item.tvdbId ?? null;
                indexer = "tvdb";
            } else if (rawType === "season" || rawType === "episode") {
                id = item.showTvdbId ?? item.showTmdbId ?? null;
                indexer = item.showTvdbId ? "tvdb" : "tmdb";
                mediaPageType = "tv";
                posterPath = item.showPosterPath ?? item.posterPath;
                if (item.seasonNumber != null) {
                    detailParams.set("season", item.seasonNumber.toString());
                }
                if (item.episodeNumber != null) {
                    detailParams.set("episode", item.episodeNumber.toString());
                }
            }

            if (!id || id === "") {
                logger.warn(
                    `Rendering item "${item.title}" (id: ${item.id}, type: ${item.itemType}) without a details link: missing external ID`
                );
            }

            return {
                id,
                title: item.title,
                poster_path: posterPath,
                media_type: mediaPageType,
                year: extractYear(item.airedAt),
                indexer,
                type: mediaPageType,
                details_query: detailParams.toString(),
                badge:
                    rawType === "season"
                        ? { text: "Season", variant: "default" }
                        : rawType === "episode"
                          ? { text: "Episode", variant: "default" }
                          : undefined,
                riven_id: item.id
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
}

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user || !event.locals.session) {
        return redirect(302, "/auth/login");
    }
    event.depends(LIBRARY_ITEMS_DEPENDENCY);

    const itemsSearchForm = await superValidate(event.url.searchParams, zod4(itemsSearchSchema));
    const { page, limit, sort, type: types, search, states } = itemsSearchForm.data;

    // Apply defaults optimistically without waiting for schema introspection.
    // The Select only ever emits valid values so this is safe.
    const effectiveTypes = types?.length ? types : ["movie", "show"];
    const effectiveStates = states?.filter((s) => s !== "All") ?? [];
    itemsSearchForm.data.type = effectiveTypes;
    itemsSearchForm.data.states = effectiveStates.length > 0 ? effectiveStates : ["All"];

    // Both queries start in parallel. Bundling into a single streaming Promise
    // means navigation is instant — the page renders immediately and content fills in.
    const filterEnumsTask = gql<{
        mediaItemType?: { enumValues?: { name: string }[] } | null;
        mediaItemState?: { enumValues?: { name: string }[] } | null;
    }>(event.locals.backendUrl, event.locals.apiKey, FILTER_ENUMS_QUERY, undefined, event.fetch);

    const itemsTask = gql<{ items: GqlItemsPage }>(
        event.locals.backendUrl,
        event.locals.apiKey,
        ITEMS_QUERY,
        {
            page: page ?? 1,
            limit: limit ?? 20,
            sort: (Array.isArray(sort) ? sort[0] : sort) ?? "date_desc",
            types: effectiveTypes.map((t) => t.toUpperCase()),
            search: search ?? undefined,
            states: effectiveStates.length > 0 ? effectiveStates : undefined
        },
        event.fetch
    );

    const pageData = Promise.all([filterEnumsTask, itemsTask])
        .then(([filterData, itemsData]) => {
            const typeEnums = filterData.mediaItemType?.enumValues?.map((e) => e.name) ?? [];
            const stateEnums = filterData.mediaItemState?.enumValues?.map((e) => e.name) ?? [];

            const typeOptions: FilterOption[] = typeEnums.map((value) => ({
                value: typeValueFromEnum(value),
                label: labelFromEnum(value)
            }));
            const stateOptions: FilterOption[] = [
                { value: "All", label: "All" },
                ...stateEnums.map((value) => ({ value, label: labelFromEnum(value) }))
            ];

            return {
                items: transformItems(itemsData.items.items),
                page: itemsData.items.page,
                totalPages: itemsData.items.totalPages,
                limit: itemsData.items.limit,
                totalItems: itemsData.items.totalItems,
                typeOptions,
                stateOptions
            };
        })
        .catch((err) => {
            logger.error("Failed to fetch library data:", err);
            return null;
        });

    return {
        itemsSearchForm,
        pageData
    };
};
