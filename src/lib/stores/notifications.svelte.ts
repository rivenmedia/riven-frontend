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

export class NotificationStore {
    #notifications = $state<Notification[]>([]);
    #abortController = $state<AbortController | null>(null);
    #reconnectAttempts = $state<number>(0);
    #reconnectTimeoutId: number | null = null;
    #connectionStatus = $state<"connecting" | "connected" | "disconnected" | "error">(
        "disconnected"
    );
    #maxReconnectAttempts = 10;

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

    #getReconnectDelay(attempt: number): number {
        return Math.min(30000, Math.pow(2, attempt) * 1000 + Math.random() * 1000);
    }

    async #startStream() {
        if (this.#abortController) {
            this.#abortController.abort();
        }

        this.#abortController = new AbortController();
        this.#connectionStatus = "connecting";

        try {
            const eventSource = new EventSource("/api/notifications");

            eventSource.onopen = () => {
                this.#connectionStatus = "connected";
                this.#reconnectAttempts = 0;
                console.log("Notification stream connected");
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.#handleNotificationEvent(data);
                } catch (e) {
                    console.warn("Failed to parse notification event:", e);
                }
            };

            eventSource.onerror = (error) => {
                console.error("Notification stream error:", error);
                eventSource.close();
                this.#connectionStatus = "error";
                this.#scheduleReconnect();
            };

            // Store reference to close it later
            // @ts-ignore
            this.#abortController.abort = () => {
                eventSource.close();
            };
        } catch (e) {
            console.error("Failed to create EventSource:", e);
            this.#connectionStatus = "error";
            this.#scheduleReconnect();
        }
    }

    #handleNotificationEvent(data: any) {
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

    #scheduleReconnect() {
        if (this.#reconnectAttempts >= this.#maxReconnectAttempts) {
            this.#connectionStatus = "error";
            console.error(
                `Failed to reconnect to notifications after ${this.#maxReconnectAttempts} attempts`
            );
            return;
        }

        const delay = this.#getReconnectDelay(this.#reconnectAttempts);
        this.#reconnectAttempts++;

        console.log(
            `Scheduling notification reconnect attempt ${this.#reconnectAttempts}/${this.#maxReconnectAttempts} in ${Math.round(delay / 1000)}s`
        );

        this.#reconnectTimeoutId = setTimeout(() => {
            if (this.#abortController?.signal.aborted) return;
            this.#startStream();
        }, delay) as unknown as number;
    }

    connect() {
        this.#startStream();
    }

    disconnect() {
        if (this.#reconnectTimeoutId) {
            clearTimeout(this.#reconnectTimeoutId);
            this.#reconnectTimeoutId = null;
        }
        if (this.#abortController) {
            this.#abortController.abort();
        }
        this.#connectionStatus = "disconnected";
    }

    reconnect() {
        if (this.#reconnectTimeoutId) {
            clearTimeout(this.#reconnectTimeoutId);
            this.#reconnectTimeoutId = null;
        }
        this.#reconnectAttempts = 0;
        this.#startStream();
    }
}

export const notificationStore = new NotificationStore();
