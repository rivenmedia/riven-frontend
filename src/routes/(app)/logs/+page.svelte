<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let logs = $state<any[]>([]);
	let error = $state<string | null>(null);
	let abortController = $state<AbortController | null>(null);

	async function startStream() {
		abortController = new AbortController();
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

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				let lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.trim()) {
						try {
							const jsonData = JSON.parse(line.trim());
							logs.push(jsonData);
							error = null;
						} catch (e) {
							if (line.startsWith('data: ')) {
								try {
									const jsonStr = line.substring(6);
									const parsedData = JSON.parse(jsonStr);
									logs.push(parsedData);
									error = null;
								} catch (parseError) {
									console.warn('Failed to parse SSE data:', parseError);
								}
							}
						}
					}
				}
			}
		} catch (e: any) {
			if (e.name !== 'AbortError') {
				error = `Stream error: ${e.message}`;
				console.error('Stream error:', e);
			}
		}
	}

	onMount(() => {
		try {
			startStream();
		} catch (e: any) {
			error = `Initialization error: ${e.message}`;
			console.error('Initialization error:', e);
		}
	});

	onDestroy(() => {
		if (abortController) {
			abortController.abort();
		}
	});
</script>

<div class="flex h-full flex-col p-6 md:p-8 md:px-16">
	{#if error}
		<div class="bg-destructive/10 border-destructive/20 rounded-lg border p-6">
			<h3 class="text-destructive mb-3 text-lg font-semibold">Connection Error</h3>
			<pre
				class="text-destructive/80 bg-destructive/5 overflow-x-auto rounded border p-3 font-mono text-sm">{error}</pre>
		</div>
	{:else if logs.length > 0}
		<div class="flex h-full min-h-0 flex-col">
			<div class="mb-6 flex flex-shrink-0 items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight">Live Logs</h1>
					<p class="text-muted-foreground mt-1">Real-time system monitoring</p>
				</div>
				<div
					class="bg-primary/10 text-primary border-primary/20 rounded-lg border px-4 py-2 font-medium"
				>
					{logs.length} entries
				</div>
			</div>

			<div class="bg-card flex min-h-0 flex-1 flex-col rounded-lg border shadow-sm">
				<div class="bg-muted/30 flex flex-shrink-0 items-center justify-between border-b px-6 py-3">
					<h2 class="text-foreground font-semibold">Stream Output</h2>
					<div class="flex items-center gap-2">
						<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
						<span class="text-muted-foreground text-sm">Live</span>
					</div>
				</div>

				<div class="min-h-0 flex-1 overflow-y-auto">
					{#each logs.slice().reverse() as log, index}
						<div
							class="border-border/50 hover:bg-muted/20 border-b transition-colors last:border-b-0"
						>
							<div class="p-4">
								{#if log.message}
									<div
										class="text-foreground/90 bg-muted/30 rounded border p-3 font-mono text-sm leading-relaxed"
									>
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
				</div>
			</div>
		</div>
	{:else}
		<div class="flex h-full flex-col items-center justify-center">
			<div class="bg-card max-w-md rounded-lg border p-8 text-center shadow-sm">
				<div
					class="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-t-transparent"
				></div>
				<h3 class="mb-2 text-lg font-semibold">Connecting to Stream</h3>
				<p class="text-muted-foreground text-sm">Establishing connection to log server...</p>
			</div>
		</div>
	{/if}
</div>