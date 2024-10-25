<script lang="ts">
	import { roundOff } from '$lib/helpers';
	import { Star } from 'lucide-svelte';
	import type { PageData } from './$types';
	import ItemRequest from '$lib/components/item-request.svelte';
	import Header from '$lib/components/header.svelte';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.details.name} | Riven</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="mt-32 p-8 md:px-24 lg:px-32">
	<h1 class="text-center text-4xl text-zinc-50 md:text-left">
		{data.details.name}
	</h1>

	<h2 class="text-center text-xl font-thin italic text-zinc-200 md:text-left">
		&quot;{data.details.overview}&quot;
	</h2>

	<div class="mt-8 flex flex-wrap overflow-x-auto px-1 lg:p-0">
		{#each data.details.parts as item}
			<div
				class="group relative mb-2 flex w-1/2 flex-shrink-0 flex-col gap-2 rounded-lg p-2 xl:w-1/7 xl:p-[.4rem]"
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
						href="/{item.media_type}/{item.id}"
						class="absolute inset-0 hidden flex-col justify-end from-zinc-900/70 p-2 group-hover:flex group-hover:bg-gradient-to-t"
					>
						<ItemRequest data={item} type={item.media_type} />
					</a>
				</div>
			</div>
		{/each}
	</div>
</div>
