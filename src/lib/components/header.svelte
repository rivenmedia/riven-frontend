<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { NavItem } from '$lib/types';
	import { Mountain, MoreHorizontal, Search, Film } from 'lucide-svelte';
	import ThemeSwitcher from '$lib/components/theme-switcher.svelte';
	import NavigationItem from '$lib/components/header-item.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import { searchContent, searchTMDB } from '$lib/utils/search';

	const navItems: NavItem[] = [
		{ name: 'Home', path: '/' },
		{ name: 'Browse', path: '/browse' },
		{ name: 'Summary', path: '/summary' },
		{ name: 'Settings', path: '/settings' }
	];

	let showMenu: Writable<boolean> = getContext('showMenu');
	let searchQuery = '';
	let searchResults: Array<{
		title: string;
		path: string;
		media_type: string;
		excerpt: string;
		type: 'component' | 'media' | 'action';
		posterPath?: string;
	}> = [];
	let isSearchOpen = false;
	let selectedIndex = -1;
	let searchResultElements: HTMLButtonElement[] = [];

	async function handleSearch() {
		if (searchQuery.trim() === '') {
			searchResults = [];
			return;
		}

		try {
			searchResults = await searchContent(searchQuery);
			selectedIndex = -1; // Reset selection when search results change
		} catch {
			searchResults = [];
		}
	}

	async function handleMediaSearch() {
		const tmdbResults = await searchTMDB(searchQuery);
		searchResults = [...tmdbResults];
		selectedIndex = -1;
		await tick(); // Wait for DOM update
		if (searchResultElements[0]) {
			searchResultElements[0].focus();
			selectedIndex = 0;
		}
	}

	function handleResultClick(result: (typeof searchResults)[number]) {
		if (result.type === 'action') {
			handleMediaSearch();
		} else {
			goto(result.path);
			isSearchOpen = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!searchResults.length) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1);
				searchResultElements[selectedIndex]?.focus();
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (selectedIndex === 0) {
					document.querySelector('input')?.focus();
					selectedIndex = -1;
				} else {
					selectedIndex = Math.max(selectedIndex - 1, 0);
					searchResultElements[selectedIndex]?.focus();
				}
				break;
			case 'Enter':
				if (searchResults.length === 1) {
					handleResultClick(searchResults[0]);
				} else if (selectedIndex >= 0) {
					handleResultClick(searchResults[selectedIndex]);
				}
				break;
		}
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		// Check for Ctrl+K (or Cmd+K on Mac)
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault(); // Prevent default browser behavior
			isSearchOpen = true;
			// Focus the search input after the dialog opens
			tick().then(() => {
				document.querySelector('input')?.focus();
			});
		}
	}

	let applyBackdropBlur = () => {};

	onMount(() => {
		const header = document.getElementById('header');

		applyBackdropBlur = () => {
			if (window.scrollY) {
				header?.classList.remove('p-8');
				header?.classList.add('p-4');
				header?.classList.add('backdrop-blur-sm');
			} else {
				header?.classList.remove('p-4');
				header?.classList.add('p-8');
				header?.classList.remove('backdrop-blur-sm');
			}
		};

		applyBackdropBlur();

		if (browser) {
			window.addEventListener('scroll', applyBackdropBlur);
			window.addEventListener('keydown', handleGlobalKeydown);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('scroll', applyBackdropBlur);
			window.removeEventListener('keydown', handleGlobalKeydown);
		}
	});
</script>

<header
	id="header"
	class="fixed top-0 z-[99] flex w-full items-center justify-between bg-transparent p-8 transition-all duration-300 ease-in-out md:px-24 lg:px-32"
>
	<div class="flex items-center gap-2">
		<a href="/" class="flex items-center gap-2">
			<Mountain class="size-6 md:size-8" />
			<h1 class="text-xl font-medium md:text-2xl">Riven</h1>
		</a>
	</div>
	<nav class="hidden items-center gap-6 tracking-wider md:flex">
		<div class="flex items-center gap-3">
			{#each navItems as navItem}
				<NavigationItem {navItem} />
			{/each}
		</div>
		<Button variant="ghost" size="icon" on:click={() => (isSearchOpen = true)}>
			<Search class="h-5 w-5" />
			<span class="sr-only">Search</span>
		</Button>
		<ThemeSwitcher />
	</nav>
	<nav class="flex items-center gap-2 tracking-wider md:hidden">
		<Button variant="ghost" size="icon" on:click={() => (isSearchOpen = true)}>
			<Search class="h-5 w-5" />
			<span class="sr-only">Search</span>
		</Button>
		<ThemeSwitcher />
		<Drawer.Root
			onClose={() => {
				showMenu.set(false);
			}}
			open={$showMenu}
		>
			<Drawer.Trigger>
				<Button type="button" size="sm" class="max-w-max">
					<MoreHorizontal class="h-4 w-4" />
				</Button>
			</Drawer.Trigger>
			<Drawer.Content>
				<nav class="my-4 flex w-full flex-col items-center justify-center gap-2">
					{#each navItems as navItem}
						<Drawer.Close asChild let:builder>
							<Button
								on:click={() => {
									goto(navItem.path);
								}}
								builders={[builder]}
								size="sm"
								variant="ghost"
							>
								{navItem.name}
							</Button>
						</Drawer.Close>
					{/each}
				</nav>
			</Drawer.Content>
		</Drawer.Root>
	</nav>
</header>

<Dialog.Root bind:open={isSearchOpen}>
	<Dialog.Content class="p-0 sm:max-w-[600px]">
		<div class="border-b p-4">
			<div class="flex items-center">
				<Input
					type="text"
					placeholder="Search..."
					bind:value={searchQuery}
					on:input={handleSearch}
					on:keydown={handleKeydown}
					class="flex-grow"
				/>
			</div>
		</div>
		{#if searchResults.length > 0}
			<div class="max-h-[400px] overflow-y-auto p-4">
				<ul class="space-y-4">
					{#each searchResults as result, index}
						<li>
							<button
								class="search-result block w-full rounded p-2 text-left hover:bg-muted focus:bg-muted"
								on:click={() => handleResultClick(result)}
								on:keydown={handleKeydown}
								bind:this={searchResultElements[index]}
								tabindex={index === 0 ? 0 : -1}
							>
								<div class="flex items-start">
									{#if result.type === 'media' && result.posterPath}
										<img
											src={result.posterPath}
											alt={result.title}
											class="mr-4 h-24 w-16 rounded object-cover"
										/>
									{:else if result.type === 'media'}
										<div class="mr-4 flex h-24 w-16 items-center justify-center rounded bg-muted">
											<Film class="h-8 w-8" />
										</div>
									{/if}
									<div class="flex-1">
										<div class="font-medium">{result.title}</div>
										<div class="text-sm text-muted-foreground">{result.excerpt}</div>
										<div class="test-secondary">
											{result.media_type}
										</div>
									</div>
								</div>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{:else if searchQuery.trim() !== ''}
			<p class="text-center text-sm text-muted-foreground">No results found</p>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.backdrop) {
		backdrop-filter: blur(4px);
		background-color: rgba(0, 0, 0, 0.5);
	}
</style>
