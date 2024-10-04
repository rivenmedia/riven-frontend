<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$lib/components/header.svelte';
	import { Star } from 'lucide-svelte';
	import { formatDate } from '$lib/helpers';
	import { statesName } from '$lib/constants';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.details.name} | {data.mediaDetails.name || data.mediaDetails.original_name}</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="relative flex flex-col text-zinc-100">
	<div class="fixed bottom-0 left-0 z-[-1] h-screen w-full bg-[#09101A]">
		<span>
			<img
				alt={data.mediaDetails.id}
				class="h-full w-full object-cover opacity-50 blur"
				src="https://www.themoviedb.org/t/p/original{data.mediaDetails.backdrop_path}"
				loading="lazy"
			/>
			<div
				class="absolute bottom-0 left-0 right-0 h-full w-full bg-gradient-to-b from-transparent to-zinc-900/55"
			></div>
		</span>
	</div>
	<div class="absolute z-[2] mt-32 flex h-full w-full flex-col items-center p-8 md:px-24 lg:px-32">
		<div class="mx-auto flex w-full max-w-7xl flex-col">
			<div class="flex w-full flex-col items-center md:flex-row md:items-start">
				<div class="w-[180px] flex-shrink-0 overflow-hidden md:w-[25%]">
					<div
						class="aspect-[1/1.5] flex-shrink-0 overflow-hidden rounded-lg backdrop-blur md:rounded-xl"
					>
						<img
							alt={data.details.id}
							src="https://www.themoviedb.org/t/p/w780{data.details.poster_path}"
							class="h-full w-full object-cover object-center"
						/>
					</div>
				</div>
				<div class="flex w-full flex-col gap-2 md:w-[75%] md:pl-12 lg:pl-16">
					<h1 class="text-center text-4xl text-zinc-50 md:text-left">
						{data.mediaDetails.name || data.mediaDetails.original_name}
					</h1>
					<h3 class="text-center text-2xl text-zinc-50 md:text-left">
						{data.details.name}
					</h3>
					{#if data.details.vote_average}
						<div class="flex items-center justify-center gap-1 md:justify-start">
							<Star class="size-4 text-yellow-400" />
							<span class="text-base font-thin text-zinc-200">
								{data.details.vote_average}
							</span>
						</div>
					{/if}
					{#if data.details.overview}
						<p class="text-center text-base font-thin leading-tight text-zinc-200 md:text-left">
							{data.details.overview}
						</p>
					{/if}
				</div>
			</div>

			{#if data.details.episodes}
				<div
					class="mb-32 mt-16 flex w-full select-none flex-col gap-4 rounded-lg bg-zinc-50/10 p-8"
				>
					<h3 class="text-2xl text-zinc-100">Episodes</h3>

					<div class="relative flex w-full cursor-pointer flex-wrap">
						{#each data.details.episodes as episode}
							<div class="group relative aspect-[2/1] h-fit w-full p-2 sm:w-1/2 xl:w-1/3">
								<div class="h-full w-full overflow-hidden rounded-lg bg-white/10 shadow-xl">
									<img
										alt={episode.id}
										src={episode.still_path
											? `https://www.themoviedb.org/t/p/w780${episode.still_path}`
											: 'https://via.placeholder.com/198x228.png?text=No+thumbnail'}
										class=" h-full w-full object-cover brightness-75 transition-all duration-300 ease-in-out group-hover:scale-105"
										loading="lazy"
									/>
									<div class="absolute left-0 top-0 flex h-full w-full flex-col px-4 py-3">
										<div
											class="line-clamp-2 w-fit rounded-md bg-zinc-900/60 px-2 text-sm font-medium capitalize text-white sm:text-base"
										>
											Episode {episode.episode_number}
										</div>
										<div class="mt-auto flex w-full justify-between">
											{#if data.mediaItemDetails.find((x) => x.number == episode.episode_number)}
												<div
													class="mt-1 line-clamp-1 rounded-md bg-zinc-900/60 px-2 text-xs text-white sm:text-sm"
												>
													{statesName[
														data.mediaItemDetails.find((x) => x.number == episode.episode_number)
															?.state ?? 'Unknown'
													]}
												</div>
											{/if}
											<div
												class="ml-auto mt-1 line-clamp-1 rounded-md bg-zinc-900/60 px-2 text-xs text-white sm:text-sm"
											>
												{formatDate(episode.air_date, 'short')}
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
