<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Header from '$lib/components/header.svelte';
	import { DefaultService } from '$lib/client';
	import { toast } from 'svelte-sonner';

	let logs: any[] = [];
	let oldLogs: any[] = [];
	let showHistoricalLogs = false;
	let loadingHistoricalLogs = false;
	let historicalLogsError: string | null = null;
	let error: string | null = null;
	let connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'connecting';
	let abortController: AbortController | null = null;
	let reconnectAttempts: number = 0;
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
		connectionStatus = 'connecting';
		error = null;

		try {
			const response = await fetch('/api/logs', {
				method: 'GET',
				headers: {
					Accept: 'text/event-stream',
					'Cache-Control': 'no-cache'
				},
				signal: abortController.signal
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('No response body reader available');
			}

			connectionStatus = 'connected';
			reconnectAttempts = 0;

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					console.log('Stream ended normally');
					break;
				}

				buffer += decoder.decode(value, { stream: true });

				let lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.trim()) {
						try {
							const jsonData = JSON.parse(line.trim());
							logs = [...logs, jsonData];
							error = null;
						} catch (e) {
							if (line.startsWith('data: ')) {
								try {
									const jsonStr = line.substring(6);
									const parsedData = JSON.parse(jsonStr);
									logs = [...logs, parsedData];
									error = null;
								} catch (parseError) {
									console.warn('Failed to parse SSE data:', parseError);
								}
							}
						}
					}
				}
			}

			scheduleReconnect();
		} catch (e: any) {
			if (e.name === 'AbortError') {
				console.log('Stream aborted');
				connectionStatus = 'disconnected';
				return;
			}

			console.error('Stream error:', e);
			connectionStatus = 'error';
			error = `Connection error: ${e.message}`;
			scheduleReconnect();
		}
	}

	function scheduleReconnect() {
		if (reconnectAttempts >= maxReconnectAttempts) {
			connectionStatus = 'error';
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

	async function fetchHistoricalLogs() {
		loadingHistoricalLogs = true;
		historicalLogsError = null;

		try {
			const oldLogsResponse = await DefaultService.logs();
			oldLogs = oldLogsResponse.data?.logs || [];
			showHistoricalLogs = true;
		} catch (e: any) {
			historicalLogsError = `Failed to fetch historical logs: ${e.message}`;
			console.error('Error fetching historical logs:', e);
		} finally {
			loadingHistoricalLogs = false;
		}
	}

	function switchToLiveLogs() {
		showHistoricalLogs = false;
	}

	onMount(() => {
		try {
			startStream();
		} catch (e: any) {
			error = `Initialization error: ${e.message}`;
			connectionStatus = 'error';
			console.error('Initialization error:', e);
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
			case 'connected':
				return 'bg-green-500';
			case 'connecting':
				return 'bg-yellow-500';
			case 'disconnected':
				return 'bg-gray-500';
			case 'error':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getStatusText() {
		switch (connectionStatus) {
			case 'connected':
				return 'Connected';
			case 'connecting':
				return reconnectAttempts > 0
					? `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`
					: 'Connecting...';
			case 'disconnected':
				return 'Disconnected';
			case 'error':
				return 'Connection Error';
			default:
				return 'Unknown';
		}
	}

	async function uploadLogs() {
		const response = await DefaultService.uploadLogs();

		if (!response.error) {
			navigator.clipboard.writeText(String(response?.data?.url));
			toast.success('Logs uploaded successfully and link copied to clipboard');
		} else {
			toast.error(`Failed to upload logs: ${response.error}`);
		}
	}
</script>

<Header />

<div class="mt-16 flex h-full flex-col p-6 md:p-8 md:px-24 lg:px-32">
	{#if error && connectionStatus === 'error' && reconnectAttempts >= maxReconnectAttempts}
		<div class="rounded-lg border border-destructive/20 bg-destructive/10 p-6">
			<h3 class="mb-3 text-lg font-semibold text-destructive">Connection Failed</h3>
			<pre
				class="mb-4 overflow-x-auto rounded border bg-destructive/5 p-3 font-mono text-sm text-destructive/80">{error}</pre>
			<button
				class="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				on:click={manualReconnect}
			>
				Try Again
			</button>
		</div>
	{:else if logs.length > 0 || connectionStatus === 'connecting' || showHistoricalLogs}
		<div class="flex h-full min-h-0 flex-col">
			<div
				class="mb-6 flex flex-col items-start lg:justify-between lg:flex-row lg:items-center w-full"
			>
				<div class="flex flex-col items-start">
					<h1 class="text-3xl font-bold tracking-tight">
						{showHistoricalLogs ? 'Historical Logs' : 'Live Logs'}
					</h1>
					<p class="mt-1 text-muted-foreground">
						{showHistoricalLogs ? 'Previously recorded system logs' : 'Real-time system monitoring'}
					</p>
				</div>
				<div class="mt-4 flex w-full lg:w-auto flex-col items-center gap-4 lg:mt-0 lg:flex-row">
					<div
						class="w-full rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-center font-medium text-primary lg:w-48"
					>
						{showHistoricalLogs ? oldLogs.length : logs.length} entries
					</div>

					{#if showHistoricalLogs}
						<button
							class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 lg:w-48"
							on:click={switchToLiveLogs}
						>
							Return to Live Logs
						</button>
					{:else}
						<button
							class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 lg:w-48"
							on:click={fetchHistoricalLogs}
							disabled={loadingHistoricalLogs}
						>
							{loadingHistoricalLogs ? 'Loading...' : 'View Historical Logs'}
						</button>
					{/if}

					<button
						class="w-full rounded-lg bg-secondary px-4 py-2 font-medium text-secondary-foreground transition-colors hover:bg-secondary/90 lg:w-48"
						on:click={uploadLogs}
					>
						Upload Logs
					</button>
				</div>
			</div>

			<div class="flex min-h-0 flex-1 flex-col rounded-lg border bg-card shadow-sm">
				<div class="flex flex-shrink-0 items-center justify-between border-b bg-muted/30 px-6 py-3">
					<h2 class="font-semibold text-foreground">
						{showHistoricalLogs ? 'Historical Logs' : 'Stream Output'}
					</h2>
					{#if !showHistoricalLogs}
						<div class="flex items-center gap-4">
							<div class="flex items-center gap-2">
								<div
									class="{getStatusColor()} h-2 w-2 rounded-full {connectionStatus === 'connecting'
										? 'animate-pulse'
										: ''}"
								></div>
								<span class="text-sm text-muted-foreground">{getStatusText()}</span>
							</div>
							{#if connectionStatus === 'error' && reconnectAttempts < maxReconnectAttempts}
								<button
									class="rounded border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
									on:click={manualReconnect}
								>
									Reconnect Now
								</button>
							{/if}
						</div>
					{/if}
				</div>

				<div class="min-h-0 flex-1 overflow-y-auto">
					{#if showHistoricalLogs}
						{#if historicalLogsError}
							<div class="p-4">
								<div class="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
									<h3 class="mb-2 font-semibold text-destructive">Error Loading Historical Logs</h3>
									<p class="text-sm text-destructive/80">{historicalLogsError}</p>
								</div>
							</div>
						{:else if loadingHistoricalLogs}
							<div class="flex h-full flex-col items-center justify-center p-8">
								<div
									class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
								></div>
								<p class="text-sm text-muted-foreground">Loading historical logs...</p>
							</div>
						{:else if oldLogs.length > 0}
							{#each oldLogs.slice().reverse() as log, index}
								<div
									class="border-b border-border/50 transition-colors last:border-b-0 hover:bg-muted/20"
								>
									<div class="p-4">
										<pre
											class="overflow-x-auto rounded border bg-muted/30 p-3 font-mono text-xs text-foreground/90">{JSON.stringify(
												log,
												null,
												2
											)}</pre>
									</div>
								</div>
							{/each}
						{:else}
							<div class="flex h-full flex-col items-center justify-center p-8">
								<p class="text-sm text-muted-foreground">No historical logs available</p>
							</div>
						{/if}
					{:else if logs.length > 0}
						{#each logs.slice().reverse() as log, index}
							<div
								class="border-b border-border/50 transition-colors last:border-b-0 hover:bg-muted/20"
							>
								<div class="p-4">
									{#if log.message}
										<div
											class="rounded border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground/90"
										>
											{log.message}
										</div>
									{:else}
										<pre
											class="overflow-x-auto rounded border bg-muted/30 p-3 font-mono text-xs text-foreground/90">{JSON.stringify(
												log,
												null,
												2
											)}</pre>
									{/if}
								</div>
							</div>
						{/each}
					{:else if connectionStatus === 'connecting'}
						<div class="flex h-full flex-col items-center justify-center p-8">
							<div
								class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
							></div>
							<p class="text-sm text-muted-foreground">{getStatusText()}</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="flex h-full flex-col items-center justify-center">
			<div class="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent"
				></div>
				<h3 class="mb-2 text-lg font-semibold">Connecting to Stream</h3>
				<p class="text-sm text-muted-foreground">Establishing connection to log server...</p>
			</div>
		</div>
	{/if}
</div>
