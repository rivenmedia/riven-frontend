import { source } from "sveltekit-sse";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("notifications");

export type Notification = {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: "movie" | "show" | "season" | "episode";
    year?: number;
    duration?: number;
    imdb_id?: string;
    read: boolean;
};

type NotificationEvent = {
    title: string;
    log_string: string;
    timestamp: string;
    type: "movie" | "show" | "season" | "episode";
    year?: number;
    duration?: number;
    imdb_id?: string;
};

export class NotificationStore {
    #notifications = $state<Notification[]>([]);
    #connectionStatus = $state<"connecting" | "connected" | "disconnected" | "error">(
        "disconnected"
    );
    #connection: ReturnType<typeof source> | null = null;
    #unsubscribe: (() => void) | null = null;

    get notifications() {
        return this.#notifications;
    }

    get unreadCount() {
        return this.#notifications.filter((n) => !n.read).length;
    }

    get connectionStatus() {
        return this.#connectionStatus;
    }

    add(notification: Omit<Notification, "id" | "read">) {
        const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            read: false
        };
        this.#notifications = [newNotification, ...this.#notifications];
    }

    markAsRead(id: string) {
        const notification = this.#notifications.find((n) => n.id === id);
        if (notification) {
            notification.read = true;
        }
    }

    markAllAsRead() {
        this.#notifications.forEach((n) => (n.read = true));
    }

    clear() {
        this.#notifications = [];
    }

    remove(id: string) {
        this.#notifications = this.#notifications.filter((n) => n.id !== id);
    }

    #handleNotificationEvent(data: NotificationEvent) {
        const message =
            data.type === "movie"
                ? `${data.log_string} (${data.year || "Unknown"}) completed`
                : `${data.log_string} completed`;

        this.add({
            title: data.title,
            message,
            timestamp: data.timestamp,
            type: data.type,
            year: data.year,
            duration: data.duration,
            imdb_id: data.imdb_id
        });
    }

    connect() {
        if (this.#connection) {
            return;
        }

        this.#connectionStatus = "connecting";

        this.#connection = source("/api/notifications", {
            open: () => {
                this.#connectionStatus = "connected";
                logger.info("Notification stream connected");
            },
            close: ({ connect }) => {
                if (this.#connectionStatus !== "disconnected") {
                    this.#connectionStatus = "error";
                    logger.info("Notification stream closed, reconnecting...");
                    // Auto-reconnect
                    setTimeout(() => {
                        if (this.#connectionStatus !== "disconnected") {
                            connect();
                        }
                    }, 1000);
                }
            },
            error: (error) => {
                logger.error("Notification stream error:", error);
                this.#connectionStatus = "error";
            }
        });

        const notificationValue = this.#connection
            .select("notification")
            .json<NotificationEvent>(({ error, previous, raw }) => {
                // Ignore empty messages (SSE heartbeats/keep-alive)
                if (error && raw && raw.trim() !== "") {
                    logger.warn("Failed to parse notification:", error);
                }
                return previous;
            });

        this.#unsubscribe = notificationValue.subscribe((value) => {
            if (value) {
                this.#handleNotificationEvent(value);
            }
        });
    }

    disconnect() {
        this.#connectionStatus = "disconnected";
        if (this.#unsubscribe) {
            this.#unsubscribe();
            this.#unsubscribe = null;
        }
        if (this.#connection) {
            this.#connection.close();
            this.#connection = null;
        }
    }

    reconnect() {
        this.disconnect();
        this.connect();
    }
}

export const notificationStore = new NotificationStore();
