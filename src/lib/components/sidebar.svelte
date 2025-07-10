<script lang="ts">
	import { page } from '$app/state';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Home from '@lucide/svelte/icons/home';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Mountain from '@lucide/svelte/icons/mountain';
	import Settings from '@lucide/svelte/icons/settings';
	import User from '@lucide/svelte/icons/user';
	import Tooltip from './tooltip.svelte';
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { goto } from '$app/navigation';

	const navItems = [
		{ href: '/', icon: Home, label: 'Home' },
		{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
		{ href: '/settings', icon: Settings, label: 'Settings' },
		{ href: '/auth', icon: User, label: 'Profile' }
	];

	let { user } = $props();

	const SidebarStore: any = getContext('sidebarStore');
	const isMobileStore: any = getContext('ismobilestore');
</script>

<aside
	class="bg-card border-r-border top-0 left-0 hidden h-screen w-16 flex-col items-center border-r md:flex"
>
	<div class="flex h-18 w-full items-center justify-center">
		<div class="text-primary-foreground flex size-10 items-center justify-center">
			<Mountain class="size-6" />
		</div>
	</div>
	<Separator class="mb-4 w-full" />
	<nav class="flex flex-col items-center gap-4">
		{#each navItems as item}
			<Tooltip>
				{#snippet trigger()}
					<a
						href={item.href}
						class="hover:bg-accent/80 group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors"
						class:bg-accent={page.url.pathname === item.href}
						aria-label={item.label}
					>
						<item.icon class="size-5" />
					</a>
				{/snippet}
				{#snippet content()}
					<p>
						{item.label}
					</p>
				{/snippet}
			</Tooltip>
		{/each}
	</nav>

	<div class="mt-auto flex flex-col items-center gap-4 pb-4">
		<Tooltip>
			{#snippet trigger()}
				<Avatar.Root class="cursor-pointer">
					<Avatar.Image src="https://github.com/ayushsehrawat.png" alt="@ayushsehrawat" />
					<Avatar.Fallback>CN</Avatar.Fallback>
				</Avatar.Root>
			{/snippet}
			{#snippet content()}
				<p class="font-medium">
					{user.username}
				</p>
			{/snippet}
		</Tooltip>

		<Button variant="ghost" size="icon" class="size-10 rounded-md" aria-label="Logout">
			<LogOut class="h-5 w-5" />
		</Button>
	</div>
</aside>

<Drawer.Root bind:open={SidebarStore.isOpen}>
	<Drawer.Trigger class="hidden"></Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header class="flex flex-row items-center justify-between">
			<div class="flex items-center gap-2">
				<Avatar.Root class="cursor-pointer">
					<Avatar.Image src="https://github.com/ayushsehrawat.png" alt="@ayushsehrawat" />
					<Avatar.Fallback>CN</Avatar.Fallback>
				</Avatar.Root>
				<p class="font-medium">
					{user.username}
				</p>
			</div>

			<Button
				variant="ghost"
				size="icon"
				class="size-10 rounded-md"
				aria-label="Logout"
			>
				<Drawer.Close class="text-muted-foreground">
					<LogOut class="h-5 w-5" />
				</Drawer.Close>
			</Button>
		</Drawer.Header>

		<Separator class="my-2" />
		<nav class="mb-8 flex flex-col items-start gap-2">
			{#each navItems as item}
				<Drawer.Close
					onclick={() => {
						goto(item.href);
					}}
					class="w-full"
				>
					<span
						class="flex w-full items-center gap-2 px-4 py-2 text-sm
						{cn('hover:bg-accent/80 transition-colors', page.url.pathname === item.href && 'bg-accent')}"
						aria-label={item.label}
					>
						<item.icon class="size-5" />
						<span>{item.label}</span>
					</span>
				</Drawer.Close>
			{/each}
		</nav>
	</Drawer.Content>
</Drawer.Root>
