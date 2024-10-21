<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import '../app.css';

	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	import { setContext } from 'svelte';
	import { dev } from '$app/environment';
	import { writable, type Writable } from 'svelte/store';
	import { source } from 'sveltekit-sse';
	import { toast } from 'svelte-sonner';

	// function handleSSE(message: string) {
	// 	const data = JSON.parse(message);

	// 	if (data.type === 'health') {
	// 		toast.info('Websocket is connected');
	// 	}

	// 	if (data.type === 'item_update') {
	// 		const item = JSON.parse(data.item);
	// 		toast.info(`${item.type} ${item.title} has been updated to ${item.state}`);
	// 	}
	// }

	// const value = source('/api/sse').select('message');
	// $: if ($value) {
	// 	handleSSE($value);
	// }

	const showMenu: Writable<boolean> = writable(false);

	setContext('formDebug', dev);
	setContext('showMenu', showMenu);

	beforeNavigate(() => {
		NProgress.start();
	});
	afterNavigate(() => {
		NProgress.done();
	});
	NProgress.configure({
		showSpinner: false
	});
</script>

<ModeWatcher track={true} />
<Toaster richColors closeButton />

<div class="bg-background font-primary font-medium">
	<slot />
</div>
