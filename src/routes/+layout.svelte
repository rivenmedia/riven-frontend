<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import '../app.css';

	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	import { setContext } from 'svelte';
	import { dev } from '$app/environment';
	import { writable, type Writable } from 'svelte/store';

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

<ModeWatcher track={true}></ModeWatcher>
<Toaster richColors closeButton />

<div class="bg-background font-primary font-medium">
	<slot />
</div>
