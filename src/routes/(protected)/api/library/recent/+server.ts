import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

interface BackendItem {
    id: string | number;
    tmdb_id?: string;
    tvdb_id?: string;
    title: string;
    poster_path?: string;
    type: string;
    year?: number;
    aired_at?: string;
}

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const GET: RequestHandler = async ({ locals, url }) => {
    // Backend API is mounted at /api/v1
    const backendUrl = new URL("/api/v1/items", locals.backendUrl);
    backendUrl.searchParams.set("sort", "date_desc");
    backendUrl.searchParams.set("limit", "15");
    backendUrl.searchParams.set("page", url.searchParams.get("page") || "1");
    // Filter to only shows and movies
    backendUrl.searchParams.append("type", "movie");
    backendUrl.searchParams.append("type", "show");

    try {
        const response = await fetch(backendUrl.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": locals.apiKey
            }
        });

        if (!response.ok) {
            const body = await response.text();
            console.error(
                `Failed to fetch library items: ${response.status} ${response.statusText}`,
                body
            );
            throw error(500, `Failed to fetch data from backend: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform items to match BaseListItem structure expected by frontend
        const items = (data.items || []).map((item: BackendItem) => {
            const hasAbsolutePoster = item.poster_path?.startsWith("http");

            // Determine correct ID and Indexer
            let id: string | number;
            let indexer: string;

            if (item.tmdb_id) {
                id = parseInt(item.tmdb_id, 10);
                indexer = "tmdb";
            } else if (item.tvdb_id) {
                id = parseInt(item.tvdb_id, 10);
                indexer = "tvdb";
            } else {
                // Fallback to internal Riven ID when no external ID exists
                id = typeof item.id === "string" ? parseInt(item.id, 10) || item.id : item.id;
                indexer = "riven";
            }

            return {
                id,
                indexer,
                title: item.title,
                poster_path: item.poster_path
                    ? hasAbsolutePoster
                        ? item.poster_path
                        : `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`
                    : null,
                media_type: item.type === "show" ? "tv" : item.type,
                year: item.year || (item.aired_at ? new Date(item.aired_at).getFullYear() : "N/A"),
                riven_id: item.id // Keep internal ID if needed
            };
        });

        return json({
            items, // Return as 'items' to differentiate from standard TMDB 'results'
            page: data.page,
            total_pages: data.total_pages,
            total_results: data.total_items
        });
    } catch (err) {
        console.error("Error fetching library items:", err);
        const message = err instanceof Error ? err.message : String(err);
        throw error(500, `Failed to fetch library items: ${message}`);
    }
};
