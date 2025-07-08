<script lang="ts">
	import '../../app.css';
	import type { LayoutProps } from './$types';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Sidebar from '$lib/components/sidebar.svelte';

	let { data, children }: LayoutProps = $props();

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

<svelte:head>
	<title>Riven</title>
</svelte:head>

<ModeWatcher defaultMode={'dark'} />
<Toaster richColors closeButton />

<div class="bg-background flex min-h-screen">
	<Sidebar user={data.user} />
	<main class="ml-16 flex flex-1 flex-col">
		<header class="bg-card flex h-18 items-center px-4">
			<div class="w-full">
				<Input type="text" placeholder="Search..." class="h-9" />
			</div>
		</header>
		<Separator class="w-full" />
		<div class="flex-1">
			{@render children?.()}
		</div>
	</main>
</div>
