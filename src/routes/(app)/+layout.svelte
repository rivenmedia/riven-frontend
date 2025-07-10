<script lang="ts">
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import Sidebar from '$lib/components/sidebar.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import NProgress from 'nprogress';
	import '../../app.css';
	import type { LayoutProps } from './$types';
	import { SidebarStore, isMobileStore } from '$lib/stores/global.svelte';
	import { setContext } from 'svelte';
	import Menu from '@lucide/svelte/icons/menu';
	import { Button } from '$lib/components/ui/button/index.js';

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

	setContext('sidebarStore', SidebarStore);
	setContext('ismobilestore', isMobileStore);

	$inspect(SidebarStore.isOpen, isMobileStore.isMobile);
</script>

<svelte:head>
	<title>Riven</title>
</svelte:head>

<ModeWatcher defaultMode={'dark'} />
<Toaster richColors closeButton />

<div
	class="bg-background grid h-screen w-screen grid-cols-1 overflow-hidden md:grid-cols-[auto_1fr]"
>
	<Sidebar user={data.user} />
	<main class="grid grid-rows-[auto_auto_1fr] overflow-hidden">
		<header class="bg-background md:bg-card flex h-18 w-full items-center px-2 md:px-4">
			 <div class="flex w-full items-center">
				<Input type="text" placeholder="Search..." class="h-9" />
				<Button
					variant="ghost"
					class="size-10 rounded-md md:hidden"
					onclick={() => SidebarStore.toggle()}
				>
					<Menu class="size-5" />
				</Button>
			</div>
		</header>
		<Separator class="w-full" />
		<div class="size-full overflow-x-hidden overflow-y-auto">
			{@render children?.()}
		</div>
	</main>
</div>
