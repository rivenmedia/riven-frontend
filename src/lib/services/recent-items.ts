const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const RECENT_ITEMS_QUERY = `
    query RecentItems($page: Int, $limit: Int, $sort: String, $types: [MediaItemType!]) {
        items(page: $page, limit: $limit, sort: $sort, types: $types) {
            items {
                id
                itemType
                title
                tmdbId
                tvdbId
                posterPath
                airedAt
                year
            }
            page
            totalPages
            totalItems
        }
    }
`;

export interface RecentItemsResponse {
    items: {
        items: GqlRecentItem[];
        page: number;
        totalPages: number;
        totalItems: number;
    };
}

export interface GqlRecentItem {
    id: number;
    itemType: string;
    title: string;
    tmdbId?: string | null;
    tvdbId?: string | null;
    posterPath?: string | null;
    airedAt?: string | null;
    year?: number | null;
}

export interface RecentItemsPage {
    items: RecentListItem[];
    page: number;
    total_pages: number;
    total_results: number;
}

export interface RecentListItem {
    id: string | number;
    indexer: string;
    title: string;
    poster_path: string | null;
    media_type: string;
    year: number | string;
    riven_id: number;
    [key: string]: unknown;
}

export function getRecentItemsVariables(page = 1) {
    return {
        page,
        limit: 15,
        sort: "date_desc",
        types: ["MOVIE", "SHOW"]
    };
}

export function mapRecentItemsPage(data: RecentItemsResponse): RecentItemsPage {
    const items = data.items.items.map((item) => {
        const hasAbsolutePoster = item.posterPath?.startsWith("http");

        let id: string | number;
        let indexer: string;

        if (item.tmdbId) {
            id = parseInt(item.tmdbId, 10);
            indexer = "tmdb";
        } else if (item.tvdbId) {
            id = parseInt(item.tvdbId, 10);
            indexer = "tvdb";
        } else {
            id = item.id;
            indexer = "riven";
        }

        return {
            id,
            indexer,
            title: item.title,
            poster_path: item.posterPath
                ? hasAbsolutePoster
                    ? item.posterPath
                    : `${TMDB_IMAGE_BASE_URL}/w500${item.posterPath}`
                : null,
            media_type: item.itemType.toLowerCase() === "show" ? "tv" : item.itemType.toLowerCase(),
            year: item.year || (item.airedAt ? new Date(item.airedAt).getFullYear() : "N/A"),
            riven_id: item.id
        } satisfies RecentListItem;
    });

    return {
        items,
        page: data.items.page,
        total_pages: data.items.totalPages,
        total_results: data.items.totalItems
    };
}
