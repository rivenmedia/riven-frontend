<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$lib/components/header.svelte';
	import MediaItem from '$lib/components/media-item.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { goto } from '$app/navigation';
	import { Star } from 'lucide-svelte';
	import { roundOff } from '$lib/helpers';
	import ItemRequest from '$lib/components/item-request.svelte';
	import { writable } from 'svelte/store';

	export let data: PageData;

	$: movies = writable(data.movies.results)
	$: totalMovies = writable(Number(data.movies.total_results))
</script>

<svelte:head>
	<title>Trending | Riven</title>
</svelte:head>

<Header />

<div class="mt-32 flex w-full flex-col p-8 md:px-24 lg:px-32">
	<h1 class="text-4xl">Movies</h1>
	<div class="mt-8 flex w-full flex-wrap">
		{#each $movies as item (item.id)}
			<div
				class="group relative mb-2 flex w-1/2 flex-shrink-0 flex-col gap-2 rounded-lg p-2 sm:w-1/4 lg:w-1/6 xl:p-[.4rem]"
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
					<a
						href="/movie/{item.id}"
						class="absolute inset-0 hidden flex-col justify-end from-zinc-900/70 p-2 group-hover:flex group-hover:bg-gradient-to-t"
					>
						<ItemRequest data={item} type="movie" />
					</a>
				</div>
			</div>
		{/each}
	</div>

	{#if $totalMovies > 0}
		<Pagination.Root
			count={$totalMovies}
			perPage={20}
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
