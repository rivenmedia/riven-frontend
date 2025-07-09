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

	const navItems = [
		{ href: '/', icon: Home, label: 'Home' },
		{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
		{ href: '/settings', icon: Settings, label: 'Settings' },
		{ href: '/auth', icon: User, label: 'Profile' }
	];

	let { user } = $props();
</script>

<aside
	class="bg-card border-r-border top-0 left-0 flex h-screen w-16 flex-col items-center border-r"
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

		<Button
			variant="ghost"
			size="icon"
			class="group relative h-10 w-10 rounded-md"
			aria-label="Logout"
		>
			<LogOut class="h-5 w-5" />
		</Button>
	</div>
</aside>
