import { source } from "sveltekit-sse";
import providers from "$lib/providers";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("logs");

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
    #connectionStatus = $state<"connecting" | "connected" | "disconnected" | "error">(
        "disconnected"
    );
    #connection: ReturnType<typeof source> | null = null;
    #unsubscribe: (() => void) | null = null;

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

    async fetchHistoricalLogs() {
        try {
            this.#isLoadingHistorical = true;
            this.#historicalError = null;

            const response = await providers.riven.GET("/api/v1/logs");
            if (response.error) {
                throw new Error(response.error);
            }
            // @ts-expect-error ignore
            this.#historicalLogs = response.data?.logs || [];
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            logger.error("Failed to fetch historical logs:", e);
            this.#historicalError = `Failed to fetch historical logs: ${message}`;
        } finally {
            this.#isLoadingHistorical = false;
        }
    }

    connect() {
        if (this.#connection) {
            return;
        }

        this.#connectionStatus = "connecting";
        this.#error = null;

        this.#connection = source("/api/logs", {
            open() {
                // Connection opened
            },
            close: ({ connect }) => {
                if (this.#connectionStatus !== "disconnected") {
                    this.#connectionStatus = "error";
                    // Auto-reconnect
                    setTimeout(() => {
                        if (this.#connectionStatus !== "disconnected") {
                            connect();
                        }
                    }, 1000);
                }
            },
            error: (error) => {
                logger.error("Log stream error:", error);
                this.#error = "Connection error";
                this.#connectionStatus = "error";
            }
        });

        const logValue = this.#connection.select("log").json<LogEntry>(({ error, previous }) => {
            if (error) {
                logger.warn("Failed to parse log entry:", error);
            }
            return previous;
        });

        this.#connectionStatus = "connected";

        this.#unsubscribe = logValue.subscribe((value) => {
            if (value) {
                this.#logs.push(value);
                this.#error = null;
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

    setActiveTab(tab: "live" | "historical") {
        this.#activeTab = tab;
        if (tab === "historical" && this.#historicalLogs.length === 0) {
            this.fetchHistoricalLogs();
        }
    }
}

export const logStore = new LogStore();
