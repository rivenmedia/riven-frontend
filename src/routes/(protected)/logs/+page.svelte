<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import providers from "$lib/providers";
    import { Button } from "$lib/components/ui/button/index.js";
    import { toast } from "svelte-sonner";
    import { logStore, type LogEntry } from "$lib/stores/logs.svelte";
    import { createScopedLogger } from "$lib/logger";
    import PageShell from "$lib/components/page-shell.svelte";

    const logger = createScopedLogger("logs-page");

    const {
        logs,
        historicalLogs,
        isLoadingHistorical,
        activeTab,
        error,
        historicalError,
        connectionStatus,
        reconnectAttempts,
        maxReconnectAttempts
    } = $derived({
        logs: logStore.logs,
        historicalLogs: logStore.historicalLogs,
        isLoadingHistorical: logStore.isLoadingHistorical,
        activeTab: logStore.activeTab,
        error: logStore.error,
        historicalError: logStore.historicalError,
        connectionStatus: logStore.connectionStatus,
        reconnectAttempts: logStore.reconnectAttempts,
        maxReconnectAttempts: logStore.maxReconnectAttempts
    });

    onMount(() => {
        logStore.connect();
    });

    onDestroy(() => {
        logStore.disconnect();
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

    async function handleUploadLogs() {
        try {
            const response = await providers.riven.POST("/api/v1/upload_logs");
            if (response.error) {
                toast.error(`Failed to upload logs: ${response.error}`);
            }

            if (response.data?.success) {
                navigator.clipboard.writeText(response.data.url);
                toast.success("Logs uploaded! URL copied to clipboard.");
            } else {
                toast.error(
                    "Failed to copy logs link. Make sure you are using https or localhost."
                );
            }
        } catch (e: any) {
            logger.error("Failed to upload logs:", e);
        }
    }
</script>

<svelte:head>
    <title>Logs - Riven</title>
</svelte:head>

{#snippet logEntry(log: LogEntry)}
    <div class="border-border/50 hover:bg-muted/20 border-b transition-colors last:border-b-0">
        <div class="text-foreground/90 p-4 font-mono text-xs wrap-break-word whitespace-pre-wrap">
            {log.message || log}
        </div>
    </div>
{/snippet}

{#snippet loadingSpinner(message: string)}
    <div class="flex h-full flex-col items-center justify-center p-8">
        <div
            class="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent">
        </div>
        <p class="text-muted-foreground text-sm">{message}</p>
    </div>
{/snippet}

{#snippet errorDisplay(
    errorMessage: string,
    retryAction: () => void,
    buttonText: string = "Try Again"
)}
    <div class="bg-destructive/10 border-destructive/20 rounded-lg border p-6">
        <h3 class="text-destructive mb-3 text-lg font-semibold">Error Loading Logs</h3>
        <pre
            class="text-destructive/80 bg-destructive/5 mb-4 overflow-x-auto rounded border p-3 font-mono text-sm">{errorMessage}</pre>
        <button
            class="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 font-medium transition-colors"
            onclick={retryAction}>
            {buttonText}
        </button>
    </div>
{/snippet}

{#snippet tabButton(name: string, isActive: boolean, onClickAction: () => void)}
    <button
        class="rounded px-3 py-1.5 text-sm font-medium transition-colors {isActive
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted/50'}"
        onclick={onClickAction}>
        {name}
    </button>
{/snippet}

{#snippet statusIndicator()}
    <div class="flex items-center gap-2">
        <div
            class="{getStatusColor()} h-2 w-2 rounded-full {connectionStatus === 'connecting'
                ? 'animate-pulse'
                : ''}">
        </div>
        <span class="text-muted-foreground text-sm">{getStatusText()}</span>
    </div>
{/snippet}

{#snippet emptyState(message: string, actionText?: string, actionFn?: () => void)}
    <div class="flex h-full flex-col items-center justify-center p-8">
        <p class="text-muted-foreground text-sm">{message}</p>
        {#if actionText && actionFn}
            <button
                class="bg-primary/10 hover:bg-primary/20 text-primary mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                onclick={actionFn}>
                {actionText}
            </button>
        {/if}
    </div>
{/snippet}

<PageShell class="h-full">
    {#if error && connectionStatus === "error" && reconnectAttempts >= maxReconnectAttempts}
        <div class="bg-destructive/10 border-destructive/20 rounded-lg border p-6">
            <h3 class="text-destructive mb-3 text-lg font-semibold">Connection Failed</h3>
            <pre
                class="text-destructive/80 bg-destructive/5 mb-4 overflow-x-auto rounded border p-3 font-mono text-sm">{error}</pre>
            <button
                class="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 font-medium transition-colors"
                onclick={() => logStore.reconnect()}>
                Try Again
            </button>
        </div>
    {:else if logs.length > 0 || historicalLogs.length > 0 || connectionStatus === "connecting" || isLoadingHistorical}
        <div class="flex h-full min-h-0 flex-col">
            <div class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">System Logs</h1>
                    <p class="text-muted-foreground mt-1">System monitoring and logs</p>
                </div>
                <div class="flex items-center gap-4">
                    <Button variant="secondary" onclick={handleUploadLogs}>Upload Logs</Button>
                    <div
                        class="bg-primary/10 text-primary border-primary/20 rounded-lg border px-4 py-2 font-medium">
                        {activeTab === "live" ? logs.length : historicalLogs.length} entries
                    </div>
                </div>
            </div>

            <div class="bg-card flex min-h-0 flex-1 flex-col rounded-lg border shadow-sm">
                <div
                    class="bg-muted/30 flex flex-shrink-0 flex-col items-center justify-between gap-4 border-b px-6 py-3 md:flex-row">
                    <div class="flex items-center gap-2">
                        {@render tabButton("Live Logs", activeTab === "live", () =>
                            logStore.setActiveTab("live")
                        )}
                        {@render tabButton("Historical Logs", activeTab === "historical", () =>
                            logStore.setActiveTab("historical")
                        )}
                    </div>
                    <div class="flex items-center gap-4">
                        {#if activeTab === "live"}
                            {@render statusIndicator()}
                            {#if connectionStatus === "error" && reconnectAttempts < maxReconnectAttempts}
                                <button
                                    class="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded border px-3 py-1 text-sm font-medium transition-colors"
                                    onclick={() => logStore.reconnect()}>
                                    Reconnect Now
                                </button>
                            {/if}
                        {:else}
                            <button
                                class="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded border px-3 py-1 text-sm font-medium transition-colors"
                                onclick={() => logStore.fetchHistoricalLogs()}
                                disabled={isLoadingHistorical}>
                                {isLoadingHistorical ? "Loading..." : "Refresh"}
                            </button>
                        {/if}
                    </div>
                </div>

                <div class="min-h-0 flex-1 overflow-y-auto">
                    {#if activeTab === "live"}
                        {#if logs.length > 0}
                            {#each logs.slice().reverse() as log}
                                {@render logEntry(log)}
                            {/each}
                        {:else if connectionStatus === "connecting"}
                            {@render loadingSpinner(getStatusText())}
                        {/if}
                    {:else if isLoadingHistorical}
                        {@render loadingSpinner("Loading historical logs...")}
                    {:else if historicalError}
                        <div class="p-8">
                            {@render errorDisplay(historicalError, () =>
                                logStore.fetchHistoricalLogs()
                            )}
                        </div>
                    {:else if historicalLogs.length > 0}
                        {#each historicalLogs.slice().reverse() as log}
                            {@render logEntry(log)}
                        {/each}
                    {:else}
                        {@render emptyState("No historical logs found", "Refresh", () =>
                            logStore.fetchHistoricalLogs()
                        )}
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
                <h3 class="mb-2 text-lg font-semibold">Connecting to Logs</h3>
                <p class="text-muted-foreground text-sm">
                    Establishing connection to log server...
                </p>
            </div>
        </div>
    {/if}
</PageShell>
