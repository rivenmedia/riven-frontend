<script lang="ts">
	import type { PageData } from './$types';
	import { writable, type Writable } from 'svelte/store';
	import { page } from '$app/stores';
	import Header from '$lib/components/header.svelte';
	import MediaItem from '$lib/components/media-item.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import { statesName } from '$lib/constants';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	export let data: PageData;

	$: pageSize = writable(Number($page.url.searchParams.get('limit') || 24));
	$: totalDataItems = writable(Number($page.data.total));
	$: library = writable(data.library);

	$: limit = writable(Number($page.url.searchParams.get('limit')) || 24) as Writable<number>;
	$: query = writable($page.url.searchParams.get('query') || undefined) as Writable<
		string | undefined
	>;
	$: types = writable($page.url.searchParams.get('types') || undefined) as Writable<
		string | undefined
	>;
	$: states = writable($page.url.searchParams.get('states') || undefined) as Writable<
		string | undefined
	>;

	function submitQueries() {
		const queries = new URLSearchParams();

		if ($query) queries.set('query', $query);
		if ($limit) queries.set('limit', $limit.toString());

		if ($types) {
			queries.set('types', $types);
		}

		if ($states) {
			queries.set('states', $states);
		}

		goto(`?${queries.toString()}`, { replaceState: true });
	}

	function resetQueries() {
		$limit = 24;
		$query = undefined;
		$types = undefined;
		$states = undefined;

		goto(`?`, { replaceState: true });
	}

	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'Enter') {
				e.preventDefault();
				submitQueries();
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<svelte:head>
	<title>Library | Riven</title>
</svelte:head>

<Header />

<div class="mt-32 flex w-full flex-col p-8 md:px-24 lg:px-32">
	<div class="flex w-full flex-col gap-2 lg:flex-row lg:justify-between">
		<div class="flex w-full flex-col gap-2 lg:flex-row">
			<Select.Root
				onSelectedChange={(selected) => {
					$limit = Number(selected?.value);
				}}
				selected={{
					value: $limit,
					label: $limit?.toString() || 'Select limit'
				}}
			>
				<Select.Trigger class="w-full lg:max-w-20">
					<Select.Value placeholder="Select limit" />
				</Select.Trigger>

				<Select.Content>
					{#each [12, 24, 48, 96] as limit}
						<Select.Item value={limit} label={limit.toString()}>{limit}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<Select.Root
				onSelectedChange={(selected) => {
					$types = selected?.map((type) => type.value).join(',') || undefined;
				}}
				selected={($types || '')
					.split(',')
					.filter((type) => type.trim() !== '')
					.map((type) => ({
						value: type,
						label: type
					}))}
				multiple={true}
			>
				<Select.Trigger class="w-full lg:max-w-32">
					<Select.Value placeholder="Select type(s)" />
				</Select.Trigger>

				<Select.Content>
					<Select.Item value="movie" label="movie">Movie</Select.Item>
					<Select.Item value="show" label="show">Show</Select.Item>
					<Select.Item value="anime" label="anime">Anime</Select.Item>
				</Select.Content>
			</Select.Root>

			<Select.Root
				onSelectedChange={(selected) => {
					$states = selected?.map((state) => state.value).join(',') || undefined;
				}}
				selected={($states || '')
					.split(',')
					.filter((state) => state.trim() !== '')
					.map((state) => ({
						value: state,
						label: statesName[state]
					}))}
				multiple={true}
			>
				<Select.Trigger class="w-full lg:max-w-36">
					<Select.Value placeholder="Select state(s)" />
				</Select.Trigger>

				<Select.Content>
					{#each Object.keys(statesName) as state}
						<Select.Item value={state} label={statesName[state]}>{statesName[state]}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<Input
				type="text"
				id="query"
				placeholder="Search"
				class="w-full lg:w-80"
				bind:value={$query}
			/>

			<Button
				type="button"
				variant="destructive"
				class="w-full lg:max-w-max"
				on:click={resetQueries}>Reset</Button
			>
		</div>

		<div class="flex flex-col gap-2 lg:flex-row">
			<Button type="button" variant="secondary" class="w-full lg:max-w-max" on:click={submitQueries}
				>Search</Button
			>
		</div>
	</div>

	<div class="mt-8 flex w-full flex-wrap">
		{#each $library as item (item.id)}
			<MediaItem data={item} />
		{/each}
	</div>

	{#if $totalDataItems > 0}
		<Pagination.Root
			count={$totalDataItems}
			perPage={$pageSize}
			let:pages
			let:currentPage
			onPageChange={(page) => {
				const params = new URLSearchParams(window.location.search);
				params.set('page', page.toString());
				goto(`?${params.toString()}`, { replaceState: true });
			}}
		>
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.PrevButton />
				</Pagination.Item>
				{#each pages as page (page.key)}
					{#if page.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item>
							<Pagination.Link {page} isActive={currentPage === page.value}>
								{page.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item>
					<Pagination.NextButton />
				</Pagination.Item>
			</Pagination.Content>
		</Pagination.Root>
	{/if}
</div>
