import { gqlSubscribeClient } from "$lib/graphql-client";
import {
    MOVIE_REQUESTED_SUBSCRIPTION,
    SHOW_INDEXED_SUBSCRIPTION,
    SHOW_REQUESTED_SUBSCRIPTION,
    SHOW_REQUEST_UPDATED_SUBSCRIPTION
} from "$lib/services/riven-media";

const MEDIA_EVENT_SUBSCRIPTIONS = [
    MOVIE_REQUESTED_SUBSCRIPTION,
    SHOW_REQUESTED_SUBSCRIPTION,
    SHOW_REQUEST_UPDATED_SUBSCRIPTION,
    SHOW_INDEXED_SUBSCRIPTION,
    `subscription RivenItemScraped {
        itemScraped
    }`,
    `subscription RivenItemDownloaded {
        itemDownloaded
    }`,
    `subscription RivenItemFailed {
        itemFailed
    }`,
    `subscription RivenItemsDeleted {
        itemsDeleted
    }`
];

export function subscribeToRivenMediaEvents(
    refresh: () => void | Promise<void>,
    debounceMs = 250
): () => void {
    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    function refreshSoon() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
            if (!active) return;
            void refresh();
        }, debounceMs);
    }

    const unsubscribers = MEDIA_EVENT_SUBSCRIPTIONS.map((subscription) =>
        gqlSubscribeClient<Record<string, unknown>>(subscription, undefined, {
            onData: refreshSoon,
            onError: () => {
                // Callers keep their last successful data snapshot. The shared GraphQL
                // subscription client owns transport-level retry behaviour where needed.
            }
        })
    );

    return () => {
        active = false;
        clearTimeout(refreshTimer);
        for (const unsubscribe of unsubscribers) {
            unsubscribe();
        }
    };
}
