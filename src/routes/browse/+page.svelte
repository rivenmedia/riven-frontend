<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Header from '$lib/components/header.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { ItemsService } from '$lib/client';
	import { writable } from 'svelte/store';
	import MediaItem from '$lib/components/media-item.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import * as Select from '$lib/components/ui/select';
	import { Field, Control, Label, FieldErrors } from 'formsnap';
	import { Button } from '$lib/components/ui/button';
	import { SortAsc, SortDesc, Search } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import { browser } from '$app/environment';

	import { states, types, sortOptions } from '$lib/schema/browse';
	import type { RivenItem } from '$lib/types';
	import type { Selected } from 'bits-ui';

	export let data;

	let items = data.itemsData.items;
	let totalItems = data.itemsData.total_items;
	let pageNumber = $page.url.searchParams.get('page')
		? parseInt($page.url.searchParams.get('page')!)
		: 1;
	const limit = 24;

	$: totalDataItems = writable(totalItems);

	const form = superForm(data.form, {
		taintedMessage: false
	});

	const { form: formData, enhance } = form;

	$: {
		const params = $page.url.searchParams;
		if (params.size === 0) {
			$formData.state = ['All'];
			$formData.type = ['movie', 'show'];
			$formData.sort = 'date_desc';
			$formData.search = '';
			pageNumber = 1;

			if ($page.url.pathname === '/browse') {
				setTimeout(() => fetchItems(), 0);
			}
		} else {
			$formData.state = params
				.get('state')
				?.split(',')
				.filter((state) => state in states)
				.map((state) => state as keyof typeof states) || ['All'];
			$formData.type = params
				.get('type')
				?.split(',')
				.filter((type) => type in types)
				.map((type) => type as keyof typeof types) || ['movie', 'show'];
			$formData.sort = (params.get('sort') as keyof typeof sortOptions) || 'date_desc';
			$formData.search = params.get('search') || '';
		}
	}

	$: selectedState = $formData.state.map((state) => ({
		label: states[state],
		value: state
	}));

	$: selectedType = $formData.type.map((type) => ({
		label: types[type],
		value: type
	}));

	$: selectedSort = {
		label: sortOptions[$formData.sort],
		value: $formData.sort
	};

	async function fetchItems() {
		if (!browser) return;
		const url = new URL(window.location.href);
		url.searchParams.set('page', pageNumber.toString());
		url.searchParams.set('state', $formData.state.join(','));
		url.searchParams.set('type', $formData.type.join(','));
		url.searchParams.set('sort', $formData.sort);

		if ($formData.search) {
			url.searchParams.set('search', $formData.search);
		} else {
			url.searchParams.delete('search');
		}

		goto(url.toString(), { replaceState: true });

		let { data } = await ItemsService.getItems({
			query: {
				page: pageNumber,
				sort: $formData.sort,
				limit,
				type: $formData.type.join(','),
				states: $formData.state.join(','),
				search: $formData.search || undefined
			}
		});

		if (data) {
			items = data.items as unknown as RivenItem[];
			totalItems = data.total_items;
			$totalDataItems = totalItems;
		}
	}

	function handleFilterChange() {
		pageNumber = 1;
		fetchItems();
	}

	function toggleSortOrder() {
		$formData.sort = $formData.sort.includes('asc')
			? ($formData.sort.replace('asc', 'desc') as keyof typeof sortOptions)
			: ($formData.sort.replace('desc', 'asc') as keyof typeof sortOptions);
		fetchItems();
	}

	function mapSelectedStates(selectedStates: Selected<string>[]) {
		try {
			return [...(selectedStates?.values() ?? [])].map((v) => v?.value as keyof typeof states);
		} catch {
			return [];
		}
	}
	function mapSelectedTypes(selectedTypes: Selected<string>[]) {
		try {
			return [...(selectedTypes?.values() ?? [])].map((v) => v?.value as keyof typeof types);
		} catch {
			return [];
		}
	}

	async function retryLibrary() {
		let { data } = await ItemsService.retryLibraryItems();
		if (data) {
			toast.success(data.message);
		}
	}

	async function updateOngoing() {
		let { data } = await ItemsService.updateOngoingItems();
		if (data) {
			toast.success(data.message);
		}
	}

	async function handleSymlinkRepair() {
		let { data } = await ItemsService.repairSymlinks();
		if (data) {
			toast.success(data.message);
		}
	}

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		$formData.search = target.value;
	}

	function handleSearch(event: Event) {
		event.preventDefault();
		handleFilterChange();
	}

	function getCount(type: 'Movie' | 'Show' | 'Season' | 'Episode') {
		return items.filter((item) => item.type === type).length;
	}

	$: movieCount = items.filter((item) => item.type === 'Movie').length;
	$: showCount = items.filter((item) => item.type === 'Show').length;
	$: seasonCount = items.filter((item) => item.type === 'Season').length;
	$: episodeCount = items.filter((item) => item.type === 'Episode').length;
</script>

<svelte:head>
	<title>Browse | Riven</title>
</svelte:head>

<Header />

<div class="min-h-screen bg-background text-foreground">
	<main class="container mx-auto mt-16 h-screen w-screen px-4 py-8">
		<form
			method="POST"
			use:enhance
			on:submit|preventDefault={handleFilterChange}
			class="mb-6 flex flex-wrap items-center gap-4"
		>
			<div class="flex items-center gap-2.5">
				<Field {form} name="state">
					<Control let:attrs>
						<Label>State</Label>
						<Select.Root
							selected={selectedState}
							onSelectedChange={(s) => {
								if (s) {
									$formData.state = mapSelectedStates(s);
									handleFilterChange();
								}
							}}
							multiple
						>
							<Select.Input name={attrs.name} />
							<Select.Trigger {...attrs} class="w-[180px]">
								<Select.Value placeholder="Filter by state" />
							</Select.Trigger>
							<Select.Content>
								{#each Object.entries(states) as [value, label]}
									<Select.Item {value} {label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</Control>
					<FieldErrors />
				</Field>
			</div>

			<div class="flex items-center gap-2.5">
				<Field {form} name="type">
					<Control let:attrs>
						<Label>Type</Label>
						<Select.Root
							selected={selectedType}
							onSelectedChange={(s) => {
								if (s) {
									$formData.type = mapSelectedTypes(s);
									handleFilterChange();
								}
							}}
							multiple
						>
							<Select.Input name={attrs.name} />
							<Select.Trigger {...attrs} class="w-[180px]">
								<Select.Value placeholder="Filter by type" />
							</Select.Trigger>
							<Select.Content>
								{#each Object.entries(types) as [value, label]}
									<Select.Item {value} {label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</Control>
					<FieldErrors />
				</Field>
			</div>

			<div class="flex items-center gap-2.5">
				<Field {form} name="sort">
					<Control let:attrs>
						<Label>Sort</Label>
						<Select.Root
							selected={selectedSort}
							onSelectedChange={(s) => {
								if (s) {
									$formData.sort = s.value;
									handleFilterChange();
								}
							}}
						>
							<Select.Input name={attrs.name} />
							<Select.Trigger {...attrs} class="w-[180px]">
								<Select.Value placeholder="Sort by" />
							</Select.Trigger>
							<Select.Content>
								{#each Object.entries(sortOptions) as [value, label]}
									<Select.Item {value} {label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</Control>
					<FieldErrors />
				</Field>
			</div>

			<Button variant="outline" size="icon" on:click={toggleSortOrder}>
				{#if $formData.sort.includes('asc')}
					<SortAsc class="h-4 w-4" />
				{:else}
					<SortDesc class="h-4 w-4" />
				{/if}
			</Button>
		</form>

		<div class="flex w-full flex-col items-center justify-between gap-2 md:flex-row">
			<Field {form} name="search">
				<Control let:attrs>
					<Input
						{...attrs}
						type="text"
						placeholder="Search titles..."
						value={$formData.search}
						on:input={handleSearchInput}
						class="w-full"
					/>
				</Control>
				<FieldErrors />
			</Field>

			<Button
				on:click={handleSearch}
				type="submit"
				class="w-full md:max-w-24"
				variant="default"
				size="default">Search</Button
			>
		</div>

		<div class="mb-8 mt-4 flex flex-wrap items-center justify-start gap-4">
			<Button
				on:click={async () => {
					await retryLibrary();
				}}
				variant="outline"
				size="sm">Retry Library</Button
			>
			<Button
				on:click={async () => {
					await updateOngoing();
				}}
				variant="outline"
				size="sm">Update Release Status</Button
			>

			<Button
				on:click={async () => {
					await handleSymlinkRepair();
				}}
				variant="outline"
				size="sm">Repair Symlinks</Button
			>
		</div>

		<p class="mb-4 text-sm text-muted-foreground">
			Showing {movieCount} movies, {showCount} shows, {seasonCount} seasons, and {episodeCount} episodes
			{#if $formData.search}
				matching "{$formData.search}"
			{/if}
			<br />
			Total items: {$totalDataItems}.
		</p>

		<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each items as item (item.id)}
				<div
					class="relative aspect-[2/3] overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105"
				>
					<MediaItem data={item} />
				</div>
			{/each}

			{#if !items.length}
				<div class="col-span-full text-center text-muted-foreground">
					No items found matching the selected filters.
					<br />
					Select season and episode filter in type to see all items.
				</div>
			{/if}
		</div>

		<div class="my-8">
			<Pagination.Root
				count={$totalDataItems}
				perPage={limit}
				page={pageNumber}
				let:pages
				let:currentPage
				onPageChange={(page) => {
					pageNumber = page;
					fetchItems();
				}}
			>
				<Pagination.Content class="flex flex-col items-center justify-center">
					<div class="flex items-center justify-center space-x-2">
						{#each pages as page (page.key)}
							{#if page.type === 'ellipsis'}
								<Pagination.Item>
									<Pagination.Ellipsis class="px-4 py-2" />
								</Pagination.Item>
							{:else}
								<Pagination.Item>
									<Pagination.Link
										{page}
										isActive={currentPage === page.value}
										class="rounded-md px-4 py-2"
									>
										{page.value}
									</Pagination.Link>
								</Pagination.Item>
							{/if}
						{/each}
					</div>
					<div class="mt-2 flex items-start justify-center space-x-2">
						<Pagination.Item>
							<Pagination.PrevButton
								class="rounded-md bg-primary px-4 py-2 text-primary-foreground"
							/>
						</Pagination.Item>

						<Pagination.Item>
							<Pagination.NextButton
								class="rounded-md bg-primary px-4 py-2 text-primary-foreground"
							/>
						</Pagination.Item>
					</div>
				</Pagination.Content>
			</Pagination.Root>
		</div>
	</main>
</div>
