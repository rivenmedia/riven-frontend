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
    #connectionStatus = $state<"connecting" | "connected" | "disconnected" | "error">("disconnected");
    #maxReconnectAttempts = 10;

    get notifications() {
        return this.#notifications;
    }

    get unreadCount() {
        return this.#notifications.filter(n => !n.read).length;
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
        const notification = this.#notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
        }
    }

    markAllAsRead() {
        this.#notifications.forEach(n => n.read = true);
    }

    clear() {
        this.#notifications = [];
    }

    remove(id: string) {
        this.#notifications = this.#notifications.filter(n => n.id !== id);
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
            // TODO: Replace with actual backend URL
            const response = await fetch("/api/notifications", {
                method: "GET",
                headers: {
                    Accept: "text/event-stream",
                    "Cache-Control": "no-cache"
                },
                signal: this.#abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No response body reader available");
            }

            this.#connectionStatus = "connected";
            this.#reconnectAttempts = 0;

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log("Notification stream ended normally");
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                let lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const jsonData = JSON.parse(line.trim());
                            this.#handleNotificationEvent(jsonData);
                        } catch (e) {
                            if (line.startsWith("data: ")) {
                                try {
                                    const jsonStr = line.substring(6);
                                    const parsedData = JSON.parse(jsonStr);
                                    this.#handleNotificationEvent(parsedData);
                                } catch (parseError) {
                                    console.warn("Failed to parse SSE notification data:", parseError);
                                }
                            }
                        }
                    }
                }
            }

            this.#scheduleReconnect();
        } catch (e: any) {
            if (e.name === "AbortError") {
                console.log("Notification stream aborted");
                this.#connectionStatus = "disconnected";
                return;
            }

            console.error("Notification stream error:", e);
            this.#connectionStatus = "error";
            this.#scheduleReconnect();
        }
    }

    #handleNotificationEvent(data: any) {
        const message = data.type === "movie"
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
            console.error(`Failed to reconnect to notifications after ${this.#maxReconnectAttempts} attempts`);
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
