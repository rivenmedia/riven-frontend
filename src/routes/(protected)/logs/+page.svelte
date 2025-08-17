<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    let logs = $state<any[]>([]);
    let error = $state<string | null>(null);
    let connectionStatus = $state<"connecting" | "connected" | "disconnected" | "error">(
        "connecting"
    );
    let abortController = $state<AbortController | null>(null);
    let reconnectAttempts = $state<number>(0);
    let maxReconnectAttempts = 10;
    let reconnectTimeoutId: number | null = null;

    function getReconnectDelay(attempt: number): number {
        const delay = Math.min(30000, Math.pow(2, attempt) * 1000 + Math.random() * 1000);
        return delay;
    }

    async function startStream() {
        if (abortController) {
            abortController.abort();
        }

        abortController = new AbortController();
        connectionStatus = "connecting";
        error = null;

        try {
            const response = await fetch("/api/logs", {
                method: "GET",
                headers: {
                    Accept: "text/event-stream",
                    "Cache-Control": "no-cache"
                },
                signal: abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No response body reader available");
            }

            connectionStatus = "connected";
            reconnectAttempts = 0;

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log("Stream ended normally");
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                let lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const jsonData = JSON.parse(line.trim());
                            logs.push(jsonData);
                            error = null;
                        } catch (e) {
                            if (line.startsWith("data: ")) {
                                try {
                                    const jsonStr = line.substring(6);
                                    const parsedData = JSON.parse(jsonStr);
                                    logs.push(parsedData);
                                    error = null;
                                } catch (parseError) {
                                    console.warn("Failed to parse SSE data:", parseError);
                                }
                            }
                        }
                    }
                }
            }

            scheduleReconnect();
        } catch (e: any) {
            if (e.name === "AbortError") {
                console.log("Stream aborted");
                connectionStatus = "disconnected";
                return;
            }

            console.error("Stream error:", e);
            connectionStatus = "error";
            error = `Connection error: ${e.message}`;
            scheduleReconnect();
        }
    }

    function scheduleReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            connectionStatus = "error";
            error = `Failed to reconnect after ${maxReconnectAttempts} attempts. Please refresh the page.`;
            return;
        }

        const delay = getReconnectDelay(reconnectAttempts);
        reconnectAttempts++;

        console.log(
            `Scheduling reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${Math.round(delay / 1000)}s`
        );

        reconnectTimeoutId = setTimeout(() => {
            if (abortController?.signal.aborted) return;
            startStream();
        }, delay) as unknown as number;
    }

    function manualReconnect() {
        if (reconnectTimeoutId) {
            clearTimeout(reconnectTimeoutId);
            reconnectTimeoutId = null;
        }
        reconnectAttempts = 0;
        startStream();
    }

    onMount(() => {
        try {
            startStream();
        } catch (e: any) {
            error = `Initialization error: ${e.message}`;
            connectionStatus = "error";
            console.error("Initialization error:", e);
        }
    });

    onDestroy(() => {
        if (reconnectTimeoutId) {
            clearTimeout(reconnectTimeoutId);
        }
        if (abortController) {
            abortController.abort();
        }
    });

    function getStatusColor() {
        switch (connectionStatus) {
            case "connected":
                return "bg-green-500";
            case "connecting":
                return "bg-yellow-500";
            case "disconnected":
                return "bg-gray-500";
            case "error":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    }

    function getStatusText() {
        switch (connectionStatus) {
            case "connected":
                return "Connected";
            case "connecting":
                return reconnectAttempts > 0
                    ? `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`
                    : "Connecting...";
            case "disconnected":
                return "Disconnected";
            case "error":
                return "Connection Error";
            default:
                return "Unknown";
        }
    }
</script>

<div class="flex h-full flex-col p-6 md:p-8 md:px-16">
    {#if error && connectionStatus === "error" && reconnectAttempts >= maxReconnectAttempts}
        <div class="bg-destructive/10 border-destructive/20 rounded-lg border p-6">
            <h3 class="text-destructive mb-3 text-lg font-semibold">Connection Failed</h3>
            <pre
                class="text-destructive/80 bg-destructive/5 mb-4 overflow-x-auto rounded border p-3 font-mono text-sm">{error}</pre>
            <button
                class="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 font-medium transition-colors"
                onclick={manualReconnect}>
                Try Again
            </button>
        </div>
    {:else if logs.length > 0 || connectionStatus === "connecting"}
        <div class="flex h-full min-h-0 flex-col">
            <div class="mb-6 flex flex-shrink-0 items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">Live Logs</h1>
                    <p class="text-muted-foreground mt-1">Real-time system monitoring</p>
                </div>
                <div class="flex items-center gap-4">
                    <div
                        class="bg-primary/10 text-primary border-primary/20 rounded-lg border px-4 py-2 font-medium">
                        {logs.length} entries
                    </div>
                </div>
            </div>

            <div class="bg-card flex min-h-0 flex-1 flex-col rounded-lg border shadow-sm">
                <div
                    class="bg-muted/30 flex flex-shrink-0 items-center justify-between border-b px-6 py-3">
                    <h2 class="text-foreground font-semibold">Stream Output</h2>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                            <div
                                class="{getStatusColor()} h-2 w-2 rounded-full {connectionStatus ===
                                'connecting'
                                    ? 'animate-pulse'
                                    : ''}">
                            </div>
                            <span class="text-muted-foreground text-sm">{getStatusText()}</span>
                        </div>
                        {#if connectionStatus === "error" && reconnectAttempts < maxReconnectAttempts}
                            <button
                                class="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded border px-3 py-1 text-sm font-medium transition-colors"
                                onclick={manualReconnect}>
                                Reconnect Now
                            </button>
                        {/if}
                    </div>
                </div>

                <div class="min-h-0 flex-1 overflow-y-auto">
                    {#if logs.length > 0}
                        {#each logs.slice().reverse() as log, index}
                            <div
                                class="border-border/50 hover:bg-muted/20 border-b transition-colors last:border-b-0">
                                <div class="p-4">
                                    {#if log.message}
                                        <div
                                            class="text-foreground/90 bg-muted/30 rounded border p-3 font-mono text-sm leading-relaxed">
                                            {log.message}
                                        </div>
                                    {:else}
                                        <pre
                                            class="bg-muted/30 text-foreground/90 overflow-x-auto rounded border p-3 font-mono text-sm">{JSON.stringify(
                                                log,
                                                null,
                                                2
                                            )}</pre>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    {:else if connectionStatus === "connecting"}
                        <div class="flex h-full flex-col items-center justify-center p-8">
                            <div
                                class="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent">
                            </div>
                            <p class="text-muted-foreground text-sm">{getStatusText()}</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <div class="flex h-full flex-col items-center justify-center">
            <div class="bg-card max-w-md rounded-lg border p-8 text-center shadow-sm">
                <div
                    class="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-t-transparent">
                </div>
                <h3 class="mb-2 text-lg font-semibold">Connecting to Stream</h3>
                <p class="text-muted-foreground text-sm">
                    Establishing connection to log server...
                </p>
            </div>
        </div>
    {/if}
</div>
