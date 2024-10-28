<script lang="ts">
	import { Star, CalendarDays, Clapperboard, MoveUpRight } from 'lucide-svelte';
	import ItemRequest from './item-request.svelte';
	import { roundOff } from '$lib/helpers';
	import { writable } from 'svelte/store';
	import { goto } from '$app/navigation';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let trending: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let popular: any;
	export let name: string;
	export let type: string;

	const hoveredItem = writable(null);

	const handleMouseLeave = (e: MouseEvent) => {
		// Only reset hoveredItem if we're not hovering over a child element
		const currentTarget = e.currentTarget as HTMLElement;
		const relatedTarget = e.relatedTarget as HTMLElement;
		if (currentTarget.contains(relatedTarget)) {
			$hoveredItem = null;
		}
	};
</script>

<div class="flex h-full w-full flex-col p-8 md:px-24 lg:px-32">
	<div class="mx-auto flex w-full flex-col gap-4 xl:flex-row">
		<div class="my-2 flex flex-col gap-3 md:my-0 md:gap-4 xl:w-[70%]">
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<div class="rounded-md bg-primary p-2 text-white">
						<Clapperboard class="size-4" />
					</div>
					<h2 class="text-xl font-medium md:text-2xl">Trending {name}</h2>
				</div>
				<a href="/{type}/trending" class="flex items-center gap-2 text-sm text-primary-foreground">
					<MoveUpRight class="size-4" />
				</a>
			</div>

			<div class="no-scrollbar flex flex-wrap overflow-x-auto px-1 lg:p-0">
				{#each trending.results as item}
					<div
						class="group relative mb-2 flex w-1/2 flex-shrink-0 flex-col gap-2 rounded-lg p-2 sm:w-1/4 lg:w-1/6 xl:p-[.4rem]"
						role="button"
						tabindex="0"
						on:mouseenter={() => ($hoveredItem = item.id)}
						on:mouseleave={handleMouseLeave}
						on:focus={() => ($hoveredItem = item.id)}
						on:blur={() => ($hoveredItem = null)}
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								$hoveredItem = item.id;
							}
						}}
						on:click={() => goto(`/${type}/${item.id}`)}
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
									<ItemRequest data={item} {type} />
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div
			class="mt-0 hidden h-full w-full flex-col gap-3 overflow-y-hidden px-1 md:gap-4 lg:w-[30%] xl:flex"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="rounded-md bg-primary p-2 text-white">
						<Star class="size-4" />
					</div>
					<h2 class="text-xl font-medium md:text-2xl">Popular {name}</h2>
				</div>
				<a href="/{type}/popular" class="flex items-center gap-2 text-sm text-primary-foreground">
					<MoveUpRight class="size-4" />
				</a>
			</div>
			<div class="flex flex-col gap-2 overflow-hidden">
				{#each popular.results as item, i}
					{#if i <= 9}
						<a
							class="group flex aspect-[4.3/1] w-full gap-1 overflow-hidden rounded-lg 2xl:aspect-[5.33/1]"
							href="/{type}/{item.id}"
						>
							<div class="aspect-[1/1.2] h-full overflow-hidden rounded-md">
								<img
									src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
									alt={item.title || item.name}
									loading="lazy"
									class="h-full w-full object-cover object-center transition-all duration-300 ease-in-out group-hover:scale-105"
								/>
							</div>
							<div class="flex h-full w-full flex-col gap-1 p-2">
								<h3 class="line-clamp-2 w-full text-base leading-snug">
									{item.title || item.name}
								</h3>
								<div class="flex items-center gap-2 text-xs font-normal">
									<div class="flex items-center gap-1">
										<CalendarDays class="size-4 text-muted-foreground" />
										<p>{item.release_date || item.first_air_date}</p>
									</div>
									<div class="flex items-center gap-1">
										<Star class="size-4 text-muted-foreground" />
										<p>{roundOff(item.vote_average)}</p>
									</div>
								</div>
							</div>
						</a>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>
