<script lang="ts">
	import '../../app.css';
	import type { LayoutProps } from './$types';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NProgress from 'nprogress';
	import AppSidebar from '$lib/components/sidebar/app-sidebar.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

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

{#if data.user}
	<Sidebar.Provider>
		<AppSidebar user={data.user} />
		<Sidebar.Inset class="overflow-x-hidden">
			<header
				class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
			>
				<div class="flex w-full items-center gap-2 px-4">
					<Sidebar.Trigger class="-ml-1" />
					<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
					<Input type="search" placeholder="Search..." class="h-8 w-full" />
				</div>
			</header>
			<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
				{@render children?.()}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
{:else}
	<div class="bg-background">
		{@render children?.()}
	</div>
{/if}
