<script lang="ts">
	import { roundOff } from '$lib/helpers';
	import { Star } from 'lucide-svelte';
	import type { PageData } from './$types';
	import ItemRequest from '$lib/components/item-request.svelte';
	import Header from '$lib/components/header.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { writable } from 'svelte/store';
	import { goto } from '$app/navigation';

	export let data: PageData;

	let totalItems = data.list.total_results;
	const limit = 24;
	const hoveredItem = writable(null);
</script>

<svelte:head>
	<title>Movies | Riven</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="mt-32 p-8 md:px-24 lg:px-32">
	<h1 class="mb-8 text-center text-4xl text-zinc-50 md:text-left">{data.listType} {data.type}</h1>

	<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
		{#each data.list.results as item (item.id)}
			<div
				class="group relative mb-2 flex flex-shrink-0 flex-col gap-2 rounded-lg p-2"
				role="button"
				tabindex="0"
				on:mouseenter={() => ($hoveredItem = item.id)}
				on:mouseleave={() => ($hoveredItem = null)}
				on:focus={() => ($hoveredItem = item.id)}
				on:blur={() => ($hoveredItem = null)}
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						$hoveredItem = item.id;
					}
				}}
				on:click={() => goto(`/${data.type}/${item.id}`)}
			>
				<div class="relative aspect-[1/1.5] w-full overflow-hidden rounded-lg">
					<img
						src="https://image.tmdb.org/t/p/w342{item.poster_path}"
						alt={item.title || item.name}
						loading="lazy"
						class="h-full w-full object-cover object-center transition-all duration-300 ease-in-out group-hover:scale-105"
					/>
					<div
						class="absolute right-0 top-1 flex items-center justify-center gap-1 rounded-l-md bg-slate-900/70 px-[5px] py-1"
					>
						<Star class="size-3 text-yellow-400" />
						<span class="text-xs font-light text-white">
							{roundOff(item.vote_average)}
						</span>
					</div>
					<div
						class="absolute inset-0 hidden flex-col justify-end from-zinc-900/70 p-2 group-hover:flex group-hover:bg-gradient-to-t"
					>
						{#if $hoveredItem === item.id}
							<ItemRequest data={item} type={data.type} />
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-8 flex flex-wrap overflow-x-auto px-1 lg:p-0">
		<Pagination.Root
			count={totalItems}
			perPage={limit}
			let:pages
			let:currentPage
			onPageChange={(page) => {
				goto(`/${data.type}/${data.listType}?page=${page}`);
			}}
		>
			<Pagination.Content class="flex items-center justify-center space-x-2">
				<Pagination.Item>
					<Pagination.PrevButton class="rounded-md bg-primary px-4 py-2 text-primary-foreground" />
				</Pagination.Item>
				{#each pages as page (page.key)}
					{#if page.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
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
				<Pagination.Item>
					<Pagination.NextButton class="rounded-md bg-primary px-4 py-2 text-primary-foreground" />
				</Pagination.Item>
			</Pagination.Content>
		</Pagination.Root>
	</div>
</div>
