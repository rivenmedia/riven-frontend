<script lang="ts">
	import { roundOff } from '$lib/helpers';
	import { Star } from 'lucide-svelte';
	import type { PageData } from './$types';
	import ItemRequest from '$lib/components/item-request.svelte';
	import Header from '$lib/components/header.svelte';

	export let data: PageData;
	$: data.details.combined_credits.cast.sort(
		(itemA: { popularity: number }, itemB: { popularity: number }) =>
			itemB.popularity - itemA.popularity
	);
	$: data.details.combined_credits.crew.sort(
		(itemA: { popularity: number }, itemB: { popularity: number }) =>
			itemB.popularity - itemA.popularity
	);
</script>

<svelte:head>
	<title>{data.details.name} | Riven</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="mt-16 p-8 md:px-24 lg:px-32">
	<div class="flex-column flex gap-8">
		<img
			src={data.details.profile_path
				? `https://image.tmdb.org/t/p/w342${data.details.profile_path}`
				: '/images/avatar.png'}
			alt={data.details.name}
			loading="lazy"
			class="aspect-[1/1.5] h-96 object-cover object-center transition-all duration-300 ease-in-out group-hover:scale-105"
		/>
		<div>
			<h1 class="text-center text-4xl text-zinc-50 md:text-left">
				{data.details.name}
			</h1>

			<h2>
				aka. {data.details.also_known_as.join(', ')}
			</h2>

			<div class="mt-4 grid grid-cols-2 gap-4">
				{#if data.details.homepage}
					<div>Website</div>
					<div>
						<a href={data.details.homepage} target="_blank" rel="noopener noreferrer">{data.details.homepage}</a>
					</div>
				{/if}
				{#if data.details.birthday}
					<div>Birthday</div>
					<div>
						<p>{data.details.birthday}</p>
					</div>
				{/if}
				{#if data.details.deathday}
					<div>Deathday</div>
					<div>
						<p>{data.details.deathday}</p>
					</div>
				{/if}
				{#if data.details.place_of_birth}
					<div>Place of Birth</div>
					<div>
						<p>{data.details.place_of_birth}</p>
					</div>
				{/if}
			</div>

			<div class="mt-8">
				<h3>Biography</h3>
				<p>{data.details.biography}</p>
			</div>
		</div>
	</div>

	<!-- <h2 class="text-center text-xl italic text-zinc-200 md:text-left">
		&quot;{data.details.overview}&quot;
	</h2> -->

	<h3 class="mt-8 text-2xl">Cast</h3>
	<div class="no-scrollbar mt-4 flex flex-wrap overflow-x-auto px-1 lg:p-0">
		{#each data.details.combined_credits.cast as item}
			<div
				class="group relative mb-2 flex w-1/2 flex-shrink-0 flex-col gap-2 rounded-lg p-2 sm:w-1/4 lg:w-1/6 xl:p-[.4rem]"
			>
				<div class="relative aspect-[1/1.5] w-full overflow-hidden rounded-lg">
					<img
						src={item.poster_path
							? `https://image.tmdb.org/t/p/w342${item.poster_path}`
							: 'https://via.placeholder.com/198x228.png?text=No+thumbnail'}
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

	<h3 class="mt-8 text-2xl">Crew</h3>
	<div class="no-scrollbar mt-4 flex flex-wrap overflow-x-auto px-1 lg:p-0">
		{#each data.details.combined_credits.crew as item}
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
