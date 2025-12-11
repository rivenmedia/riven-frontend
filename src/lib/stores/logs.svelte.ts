import providers from "$lib/providers";

export type LogEntry = {
    message?: string;
};

export class LogStore {
    #logs = $state<LogEntry[]>([]);
    #historicalLogs = $state<LogEntry[]>([]);
    #isLoadingHistorical = $state<boolean>(false);
    #activeTab = $state<"live" | "historical">("live");
    #error = $state<string | null>(null);
    #historicalError = $state<string | null>(null);
    #connectionStatus = $state<"connecting" | "connected" | "disconnected" | "error">("connecting");
    #abortController = $state<AbortController | null>(null);
    #reconnectAttempts = $state<number>(0);
    #maxReconnectAttempts = 10;
    #reconnectTimeoutId: number | null = null;

    get logs() {
        return this.#logs;
    }

    get historicalLogs() {
        return this.#historicalLogs;
    }

    get isLoadingHistorical() {
        return this.#isLoadingHistorical;
    }

    get activeTab() {
        return this.#activeTab;
    }

    get error() {
        return this.#error;
    }

    get historicalError() {
        return this.#historicalError;
    }

    get connectionStatus() {
        return this.#connectionStatus;
    }

    get reconnectAttempts() {
        return this.#reconnectAttempts;
    }

    get maxReconnectAttempts() {
        return this.#maxReconnectAttempts;
    }

    #getReconnectDelay(attempt: number): number {
        return Math.min(30000, Math.pow(2, attempt) * 1000 + Math.random() * 1000);
    }

    async fetchHistoricalLogs() {
        try {
            this.#isLoadingHistorical = true;
            this.#historicalError = null;

            const response = await providers.riven.GET("/api/v1/logs")
            if (response.error) {
                throw new Error(response.error);
            }
            // @ts-expect-error ignore
            this.#historicalLogs = response.data?.logs || [];
        } catch (e: any) {
            console.error("Failed to fetch historical logs:", e);
            this.#historicalError = `Failed to fetch historical logs: ${e.message}`;
        } finally {
            this.#isLoadingHistorical = false;
        }
    }

    async #startStream() {
        if (this.#abortController) {
            this.#abortController.abort();
        }

        this.#abortController = new AbortController();
        this.#connectionStatus = "connecting";
        this.#error = null;

        try {
            const response = await fetch("/api/logs", {
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
                    console.log("Stream ended normally");
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const jsonData = JSON.parse(line.trim());
                            this.#logs.push(jsonData);
                            this.#error = null;
                        } catch (e) {
                            if (line.startsWith("data: ")) {
                                try {
                                    const jsonStr = line.substring(6);
                                    const parsedData = JSON.parse(jsonStr);
                                    this.#logs.push(parsedData);
                                    this.#error = null;
                                } catch (parseError) {
                                    console.warn("Failed to parse SSE data:", parseError);
                                }
                            }
                        }
                    }
                }
            }

            this.#scheduleReconnect();
        } catch (e: any) {
            if (e.name === "AbortError") {
                console.log("Stream aborted");
                this.#connectionStatus = "disconnected";
                return;
            }

            console.error("Stream error:", e);
            this.#connectionStatus = "error";
            this.#error = `Connection error: ${e.message}`;
            this.#scheduleReconnect();
        }
    }

    #scheduleReconnect() {
        if (this.#reconnectAttempts >= this.#maxReconnectAttempts) {
            this.#connectionStatus = "error";
            this.#error = `Failed to reconnect after ${this.#maxReconnectAttempts} attempts. Please refresh the page.`;
            return;
        }

        const delay = this.#getReconnectDelay(this.#reconnectAttempts);
        this.#reconnectAttempts++;

        console.log(
            `Scheduling reconnect attempt ${this.#reconnectAttempts}/${this.#maxReconnectAttempts} in ${Math.round(delay / 1000)}s`
        );

        this.#reconnectTimeoutId = setTimeout(() => {
            if (this.#abortController?.signal.aborted) return;
            this.#startStream();
        }, delay) as unknown as number;
    }

    connect() {
        try {
            this.#startStream();
        } catch (e: any) {
            this.#error = `Initialization error: ${e.message}`;
            this.#connectionStatus = "error";
            console.error("Initialization error:", e);
        }
    }

    disconnect() {
        if (this.#reconnectTimeoutId) {
            clearTimeout(this.#reconnectTimeoutId);
            this.#reconnectTimeoutId = null;
        }
        if (this.#abortController) {
            this.#abortController.abort();
        }
    }

    reconnect() {
        if (this.#reconnectTimeoutId) {
            clearTimeout(this.#reconnectTimeoutId);
            this.#reconnectTimeoutId = null;
        }
        this.#reconnectAttempts = 0;
        this.#startStream();
    }

    setActiveTab(tab: "live" | "historical") {
        this.#activeTab = tab;
        if (tab === "historical" && this.#historicalLogs.length === 0) {
            this.fetchHistoricalLogs();
        }
    }
}

export const logStore = new LogStore();
