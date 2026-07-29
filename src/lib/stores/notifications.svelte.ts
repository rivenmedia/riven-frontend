import { gqlSubscribeClient } from "$lib/graphql-client";
import { createScopedLogger } from "$lib/logger";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

const logger = createScopedLogger("notifications");

export type Notification = {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: "movie" | "show" | "season" | "episode";
    severity: "success" | "warning" | "error";
    year?: number;
    duration?: number;
    imdb_id?: string;
    read: boolean;
    count: number;
    dedupeKey: string | null;
};

// Shape of a RivenNotification as returned by the GraphQL `notifications` subscription.
export type RivenNotificationPayload = {
    eventType: string;
    title?: string | null;
    fullTitle?: string | null;
    itemType?: string | null;
    year?: number | null;
    imdbId?: string | null;
    tmdbId?: string | null;
    tvdbId?: string | null;
    durationSeconds?: number | null;
    id?: number | null;
    streamCount?: number | null;
    count?: number | null;
    newItems?: number | null;
    error?: string | null;
};

const NOTIFICATIONS_SUBSCRIPTION = `subscription {
    notifications {
        eventType title fullTitle itemType year imdbId tmdbId tvdbId
        durationSeconds id streamCount count newItems error
    }
}`;

function mapItemType(raw?: string | null): "movie" | "show" | "season" | "episode" {
    switch (raw?.toLowerCase()) {
        case "movie":
            return "movie";
        case "show":
            return "show";
        case "season":
            return "season";
        case "episode":
            return "episode";
        default:
            return "movie";
    }
}

// Errors always get their own notification — every error is distinct.
// Success/warning events are keyed by (eventType, item identity) so that
// the same item firing the same event multiple times updates a single entry.
function buildDedupeKey(eventType: string, event: RivenNotificationPayload): string | null {
    if (eventType.includes(".error")) return null;
    const identity = event.imdbId ?? event.title ?? null;
    return identity ? `${eventType}:${identity}` : null;
}

function rivenNotificationToNotification(
    event: RivenNotificationPayload
): Omit<Notification, "id" | "read" | "count"> | null {
    const ts = new Date().toISOString();
    const dedupeKey = buildDedupeKey(event.eventType, event);

    switch (event.eventType) {
        case "riven.media-item.download.success":
            return {
                title: event.fullTitle ?? event.title ?? "Unknown",
                message: `Download complete${event.year ? ` (${event.year})` : ""}`,
                severity: "success",
                timestamp: ts,
                type: mapItemType(event.itemType),
                year: event.year ?? undefined,
                duration: event.durationSeconds
                    ? Math.round(event.durationSeconds / 60)
                    : undefined,
                imdb_id: event.imdbId ?? undefined,
                dedupeKey
            };

        case "riven.media-item.scrape.success":
            return {
                title: event.title ?? "Unknown",
                message: `Found ${event.streamCount ?? 0} stream(s)`,
                severity: "success",
                timestamp: ts,
                type: mapItemType(event.itemType),
                dedupeKey
            };

        case "riven.media-item.index.success":
            return {
                title: event.title ?? "Unknown",
                message: "Indexed successfully",
                severity: "success",
                timestamp: ts,
                type: mapItemType(event.itemType),
                dedupeKey
            };

        case "riven.item-request.create.success":
            return {
                title: "Content request processed",
                message: `${event.newItems ?? 0} new item(s) added`,
                severity: "success",
                timestamp: ts,
                type: "movie",
                dedupeKey
            };

        case "riven.media-item.download.error":
            return {
                title: event.title ?? "Download failed",
                message: event.error ?? "An error occurred",
                severity: "error",
                timestamp: ts,
                type: "movie",
                dedupeKey: null
            };

        case "riven.media-item.scrape.error":
            return {
                title: event.title ?? "Scrape failed",
                message: event.error ?? "An error occurred",
                severity: "error",
                timestamp: ts,
                type: "movie",
                dedupeKey: null
            };

        case "riven.media-item.scrape.error.no-new-streams":
            return {
                title: event.title ?? "No streams found",
                message: "No new streams found",
                severity: "warning",
                timestamp: ts,
                type: mapItemType(event.itemType),
                dedupeKey
            };

        default:
            return null;
    }
}

const scheduleFlush =
    typeof requestAnimationFrame !== "undefined"
        ? (cb: () => void) => requestAnimationFrame(cb)
        : (cb: () => void) => setTimeout(cb, 16) as unknown as number;

const cancelFlush =
    typeof cancelAnimationFrame !== "undefined"
        ? (h: number) => cancelAnimationFrame(h)
        : (h: number) => clearTimeout(h);

export class NotificationStore {
    #notifications = $state<Notification[]>([]);
    #unreadCount = $state(0);
    #connectionStatus = $state<"connecting" | "connected" | "disconnected" | "error">(
        "disconnected"
    );
    #unsubscribe: (() => void) | null = null;
    #eventListeners = new SvelteSet<(event: RivenNotificationPayload) => void>();
    #connectionRefs = 0;
    #reconnectAttempts = 0;
    #maxReconnectAttempts = 3;

    #pending: Array<Omit<Notification, "id" | "read" | "count">> = [];
    #flushHandle: number | null = null;
    // dedupeKey → notification id (fast merge lookup)
    #dedupeIndex = new SvelteMap<string, string>();
    // notification id → dedupeKey (fast cleanup on remove)
    #idToDedupeKey = new SvelteMap<string, string>();

    onBatchAdded: ((batch: readonly Notification[]) => void) | null = null;

    get notifications() {
        return this.#notifications;
    }

    get unreadCount() {
        return this.#unreadCount;
    }

    get connectionStatus() {
        return this.#connectionStatus;
    }

    add(notification: Omit<Notification, "id" | "read" | "count">) {
        this.#pending.push(notification);
        if (this.#flushHandle === null) {
            this.#flushHandle = scheduleFlush(() => {
                this.#flushHandle = null;
                this.#flush();
            });
        }
    }

    #flush() {
        const batch = this.#pending;
        if (batch.length === 0) return;
        this.#pending = [];

        const toastBatch: Notification[] = [];
        const newItems: Notification[] = [];

        for (const item of batch) {
            // Attempt dedup merge for keyed events.
            if (item.dedupeKey !== null) {
                const existingId = this.#dedupeIndex.get(item.dedupeKey);
                if (existingId) {
                    const existing = this.#notifications.find((n) => n.id === existingId);
                    if (existing) {
                        existing.count++;
                        existing.timestamp = item.timestamp;
                        existing.message = item.message;
                        if (existing.read) {
                            existing.read = false;
                            this.#unreadCount++;
                        }
                        toastBatch.push({ ...existing });
                        continue;
                    }
                }
            }

            // New entry.
            const notif: Notification = {
                ...item,
                id: crypto.randomUUID(),
                read: false,
                count: 1
            };
            newItems.push(notif);
            toastBatch.push(notif);

            if (notif.dedupeKey !== null) {
                this.#dedupeIndex.set(notif.dedupeKey, notif.id);
                this.#idToDedupeKey.set(notif.id, notif.dedupeKey);
            }
        }

        if (newItems.length > 0) {
            const current = this.#notifications;
            const next = new Array<Notification>(newItems.length + current.length);
            let idx = 0;
            // Iterate batch in reverse so the last-arrived item lands at index 0.
            for (let i = newItems.length - 1; i >= 0; i--) next[idx++] = newItems[i];
            for (let i = 0; i < current.length; i++) next[idx++] = current[i];
            this.#notifications = next;
            this.#unreadCount += newItems.length;
        }

        if (toastBatch.length > 0) {
            this.onBatchAdded?.(toastBatch);
        }
    }

    markAsRead(id: string) {
        const notification = this.#notifications.find((n) => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            this.#unreadCount = Math.max(0, this.#unreadCount - 1);
        }
    }

    markAllAsRead() {
        this.#notifications.forEach((n) => (n.read = true));
        this.#unreadCount = 0;
    }

    clear() {
        this.#notifications = [];
        this.#unreadCount = 0;
        this.#dedupeIndex.clear();
        this.#idToDedupeKey.clear();
    }

    remove(id: string) {
        const idx = this.#notifications.findIndex((n) => n.id === id);
        if (idx === -1) return;
        const wasUnread = !this.#notifications[idx].read;
        this.#notifications.splice(idx, 1);
        const key = this.#idToDedupeKey.get(id);
        if (key) {
            this.#dedupeIndex.delete(key);
            this.#idToDedupeKey.delete(id);
        }
        if (wasUnread) this.#unreadCount = Math.max(0, this.#unreadCount - 1);
    }

    #disconnectTransport() {
        this.#connectionStatus = "disconnected";
        if (this.#unsubscribe) {
            this.#unsubscribe();
            this.#unsubscribe = null;
        }
        if (this.#flushHandle !== null) {
            cancelFlush(this.#flushHandle);
            this.#flushHandle = null;
            if (this.#pending.length > 0) this.#flush();
        }
    }

    #connectTransport() {
        if (this.#unsubscribe) {
            return;
        }

        this.#connectionStatus = "connecting";

        this.#unsubscribe = gqlSubscribeClient<{ notifications: RivenNotificationPayload }>(
            NOTIFICATIONS_SUBSCRIPTION,
            undefined,
            {
                onData: (payload) => {
                    this.#connectionStatus = "connected";
                    this.#reconnectAttempts = 0;
                    const event = payload.notifications;
                    this.#eventListeners.forEach((cb) => cb(event));
                    const mapped = rivenNotificationToNotification(event);
                    if (mapped) {
                        this.add(mapped);
                    }
                },
                onError: (error) => {
                    this.#reconnectAttempts += 1;

                    if (this.#reconnectAttempts >= this.#maxReconnectAttempts) {
                        logger.error("Notification subscription error:", error);
                        this.#connectionStatus = "error";
                        return;
                    }

                    this.#connectionStatus = "connecting";
                    this.#disconnectTransport();
                    const reconnectDelayMs = 5000 * this.#reconnectAttempts;
                    setTimeout(() => {
                        if (this.#connectionRefs > 0) {
                            this.#connectTransport();
                        }
                    }, reconnectDelayMs);
                }
            }
        );
    }

    connect() {
        this.#connectionRefs += 1;
        this.#connectTransport();
    }

    subscribe(callback: (event: RivenNotificationPayload) => void) {
        this.#eventListeners.add(callback);
        return () => {
            this.#eventListeners.delete(callback);
        };
    }

    disconnect() {
        this.#connectionRefs = Math.max(0, this.#connectionRefs - 1);

        if (this.#connectionRefs > 0) {
            return;
        }

        this.#disconnectTransport();
    }

    reconnect() {
        this.#disconnectTransport();
        if (this.#connectionRefs === 0) {
            this.#connectionRefs = 1;
        }
        this.#connectTransport();
    }
}

export const notificationStore = new NotificationStore();
