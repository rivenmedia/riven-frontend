import { source } from "sveltekit-sse";
import { SvelteMap } from "svelte/reactivity";

type EventUpdateData = Record<string, number[]>; // {"Scraping": [1, 2], "Downloader": [3]}

type ItemUpdateData = {
    last_state: string;
    new_state: string;
    item_id: number;
    imdb_id?: string | null;
    tmdb_id?: string | null;
    tvdb_id?: string | null;
};

export class MediaProgressStore {
    // Expose these as public for reactive access
    itemStates = new SvelteMap<number, string>();
    activeServices = new SvelteMap<number, string[]>();
    // Map external IDs to internal item IDs for lookup
    externalIdMap = new SvelteMap<string, number>(); // "imdb:tt1234567" -> internal_id
    #connectionStatus = $state<"connecting" | "connected" | "disconnected" | "error">(
        "disconnected"
    );
    #eventConnection: ReturnType<typeof source> | null = null;
    #itemConnection: ReturnType<typeof source> | null = null;
    #unsubscribeEvent: (() => void) | null = null;
    #unsubscribeItem: (() => void) | null = null;

    get connectionStatus() {
        return this.#connectionStatus;
    }

    getItemState(itemId: number): string | undefined {
        return this.itemStates.get(itemId);
    }

    getItemStateByExternalId(
        externalId: string,
        idType: "imdb" | "tmdb" | "tvdb"
    ): string | undefined {
        const key = `${idType}:${externalId}`;
        const internalId = this.externalIdMap.get(key);
        return internalId ? this.itemStates.get(internalId) : undefined;
    }

    getActiveServices(itemId: number): string[] {
        return this.activeServices.get(itemId) || [];
    }

    getActiveServicesByExternalId(externalId: string, idType: "imdb" | "tmdb" | "tvdb"): string[] {
        const key = `${idType}:${externalId}`;
        const internalId = this.externalIdMap.get(key);
        return internalId ? this.getActiveServices(internalId) : [];
    }

    isProcessing(itemId: number): boolean {
        return this.getActiveServices(itemId).length > 0;
    }

    #handleEventUpdate(data: EventUpdateData) {
        // data = {"Scraping": [1, 2], "Downloader": [3], ...}

        // Clear previous active services
        this.activeServices.clear();

        // Rebuild from current event
        for (const [service, itemIds] of Object.entries(data)) {
            for (const itemId of itemIds) {
                const existing = this.activeServices.get(itemId) || [];
                this.activeServices.set(itemId, [...existing, service]);
            }
        }
    }

    #handleItemUpdate(data: ItemUpdateData) {
        // Update state by internal ID
        this.itemStates.set(data.item_id, data.new_state);

        // Map external IDs to internal ID for lookup
        if (data.imdb_id) {
            this.externalIdMap.set(`imdb:${data.imdb_id}`, data.item_id);
        }
        if (data.tmdb_id) {
            this.externalIdMap.set(`tmdb:${data.tmdb_id}`, data.item_id);
        }
        if (data.tvdb_id) {
            this.externalIdMap.set(`tvdb:${data.tvdb_id}`, data.item_id);
        }
    }

    connect() {
        if (this.#eventConnection) {
            return;
        }

        this.#connectionStatus = "connecting";

        // Connection 1: event_update stream
        this.#eventConnection = source("/api/event_update", {
            open: () => {
                this.#connectionStatus = "connected";
            },
            close: ({ connect }) => {
                setTimeout(() => {
                    if (this.#connectionStatus !== "disconnected") {
                        connect();
                    }
                }, 1000);
            },
            error: () => {
                this.#connectionStatus = "error";
            }
        });

        const eventValue = this.#eventConnection
            .select("event_update")
            .json<EventUpdateData>(({ previous }) => previous);

        this.#unsubscribeEvent = eventValue.subscribe((data) => {
            if (data) {
                this.#handleEventUpdate(data);
            }
        });

        // Connection 2: item_update stream
        this.#itemConnection = source("/api/item_update", {
            open: () => {},
            close: ({ connect }) => {
                setTimeout(() => {
                    if (this.#connectionStatus !== "disconnected") {
                        connect();
                    }
                }, 1000);
            },
            error: () => {}
        });

        const itemValue = this.#itemConnection
            .select("item_update")
            .json<ItemUpdateData>(({ previous }) => previous);

        this.#unsubscribeItem = itemValue.subscribe((data) => {
            if (data) {
                this.#handleItemUpdate(data);
            }
        });
    }

    disconnect() {
        this.#connectionStatus = "disconnected";

        if (this.#unsubscribeEvent) {
            this.#unsubscribeEvent();
            this.#unsubscribeEvent = null;
        }

        if (this.#unsubscribeItem) {
            this.#unsubscribeItem();
            this.#unsubscribeItem = null;
        }

        this.#eventConnection = null;
        this.#itemConnection = null;
    }
}

export const mediaProgressStore = new MediaProgressStore();
