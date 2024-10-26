<!-- <script lang="ts">
	import { source } from 'sveltekit-sse';
	import { writable } from 'svelte/store';

	// import type { PageData } from './$types';
	// export let data: PageData;

	interface LogMessage {
		time: string;
		level: string;
		message: string;
	}

	class FixedLengthQueue<T> {
		private maxLength: number;
		public queue: T[];

		constructor(maxLength: number) {
			this.maxLength = maxLength;
			this.queue = [];
		}

		enqueue(item: T): void {
			if (this.queue.length >= this.maxLength) {
				this.queue.shift();
			}
			this.queue.push(item);
		}

		dequeue(): T | undefined {
			return this.queue.shift();
		}

		size(): number {
			return this.queue.length;
		}

		peek(): T | undefined {
			return this.queue[0];
		}
	}

	const connection = source('/api/sse/logging');
	const data = connection.select('message').json(function or({ error, raw, previous }) {
		console.error(`Could not parse "${raw}" as json.`, error);
		return previous;
	});

	const logMessagesStore = new FixedLengthQueue<LogMessage>(10)
    $: logArray = logMessagesStore.queue;
    $: logMessagesStore.enqueue($data);
</script>

{#if logArray.length > 0}
    <div class="flex flex-col space-y-2">
        {#each logArray as logMessage}
            <div class="flex flex-row space-x-2">
                <div class="text-xs text-gray-500">{logMessage.time}</div>
                <div class="text-xs text-gray-500">{logMessage.level}</div>
                <div class="text-xs">{logMessage.message}</div>
            </div>
        {/each}
    </div>
{:else}
    <div class="text-center">No log messages</div>
{/if} -->

<!-- so issue with above i suspect is reactivity, as logMessagesStore is a class, svelte doesn't know when it's items are updated, so it doesn't re-render the component. -->

<script lang="ts">
	import { source } from 'sveltekit-sse';

	const connection = source('/api/sse/logging');
	const data = connection.select('message').transform(s => {
		return s ? JSON.parse(s) : null;
	});

	let logMessagesStore: any[] = [];

	$: logMessagesStore = [...logMessagesStore, $data].filter(Boolean);
	$: console.log($data);
	$: console.log(logMessagesStore);
</script>

{#if logMessagesStore.length > 0}
	<div class="flex flex-col space-y-2">
		{#each logMessagesStore as logMessage}
			<div class="flex flex-row space-x-2">
				<div class="text-xs text-gray-500">{logMessage?.time}</div>
				<div class="text-xs text-gray-500">{logMessage?.level}</div>
				<div class="text-xs">{logMessage?.message}</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="text-center">No log messages</div>
{/if}
