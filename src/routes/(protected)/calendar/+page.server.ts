import type { PageServerLoad } from "./$types";
import { gql } from "$lib/graphql-client";
import { error } from "@sveltejs/kit";

const CALENDAR_QUERY = `
    query Calendar($limit: Int) {
        calendar(limit: $limit) {
            itemId
            showTitle
            itemType
            airedAt
            season
            episode
            tmdbId
            tvdbId
            lastState
        }
    }
`;

export const load = (async ({ fetch, locals }) => {
    try {
        const data = await gql<{
            calendar: {
                itemId: number;
                showTitle: string;
                itemType: string;
                airedAt?: string | null;
                season?: number | null;
                episode?: number | null;
                tmdbId?: string | null;
                tvdbId?: string | null;
                lastState: string;
            }[];
        }>(locals.backendUrl, locals.apiKey, CALENDAR_QUERY, { limit: 200 }, fetch);

        const items = data.calendar.map((i) => ({
            item_id: i.itemId,
            show_title: i.showTitle,
            item_type: i.itemType,
            aired_at: i.airedAt ?? undefined,
            season: i.season ?? undefined,
            episode: i.episode ?? undefined,
            tmdb_id: i.tmdbId ?? undefined,
            tvdb_id: i.tvdbId ?? undefined,
            last_state: i.lastState
        }));

        return { calendar: { data: items } };
    } catch {
        error(500, "Unable to fetch calendar data");
    }
}) satisfies PageServerLoad;
