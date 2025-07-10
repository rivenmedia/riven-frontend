<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { type CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import { TMDB_IMAGE_BASE_URL } from '$lib/tmdb';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Calender from '@lucide/svelte/icons/calendar';
	import Tv from '@lucide/svelte/icons/tv';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio/index.js';

	let api = $state<CarouselAPI>();
	let trendingTimeWindow = $state<'day' | 'week'>('day');

	let { data = $bindable(), type } = $props();
</script>

<div class="flex flex-col">
	<div class="flex items-center justify-between">
		<div class="flex max-w-max items-center gap-2">
			<h2
				class="text-muted-foreground mb-4 max-w-max text-base font-semibold md:text-xl lg:text-2xl"
			>
				Trending {type === 'movie' ? 'Movies' : 'TV Shows'}
			</h2>
			<Select.Root
				bind:value={trendingTimeWindow}
				onValueChange={async (value) => {
					const response = await fetch(`/api/tmdb/${type}/${value}/trending`);
					if (!response.ok) {
						throw new Error(`Failed to fetch trending ${type}`);
					}
					data = await response.json();
				}}
				type="single"
			>
				<Select.Trigger class="w-28">
					{trendingTimeWindow === 'day' ? 'Today' : 'This Week'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="day">Today</Select.Item>
					<Select.Item value="week">This Week</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		<Button variant="link" href="/{type}/{trendingTimeWindow}/trending">View All</Button>
	</div>
	{#if data}
		<Carousel.Root
			opts={{
				dragFree: true,
				slidesToScroll: 'auto'
			}}
			class="mt-1.5"
			setApi={(emblaApi) => (api = emblaApi)}
		>
			<Carousel.Content>
				{#each data.results as item}
					<Carousel.Item class="basis-36 md:basis-40 lg:basis-44">
						<AspectRatio ratio={2 / 3}>
							<img
								src="{TMDB_IMAGE_BASE_URL}/w500{item.poster_path}"
								alt={item.title || item.name || item.original_title || item.original_name}
								class="object-cover object-center transition-transform duration-300 select-none hover:scale-105"
								loading="lazy"
							/>
						</AspectRatio>
						<a
							href="/details/{item.id}"
							class="mt-1 block h-10 text-sm font-semibold hover:underline"
						>
							<p class="line-clamp-2">
								{item.title || item.name || item.original_title || item.original_name}
							</p>
						</a>
						<div class="mt-1.5 flex flex-wrap items-center justify-between">
							<div class="flex items-center gap-0.5">
								<Calender class="text-muted-foreground size-3" />
								<p class="text-muted-foreground text-xs">
									{new Date(item.release_date || item.first_air_date).getFullYear()}
								</p>
							</div>

							<div class="flex items-center gap-0.5">
								<Tv class="text-muted-foreground size-3" />
								<p class="text-muted-foreground text-xs">
									{item.media_type === 'movie' ? 'Movie' : 'TV Show'}
								</p>
							</div>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</Carousel.Root>
	{:else}
		<div class="flex gap-3 overflow-x-auto pb-2">
			{#each Array(2) as _, i}
				<div class="w-[140px] flex-none sm:w-[160px] md:w-[180px]">
					<Skeleton class="aspect-[2/3] w-full rounded-sm" />
					<Skeleton class="mt-2 h-4 w-full" />
					<div class="mt-1 flex items-center justify-between">
						<div class="flex items-center gap-1">
							<Skeleton class="h-4 w-12 rounded-full" />
						</div>
						<div class="flex items-center gap-1">
							<Skeleton class="h-4 w-12 rounded-full" />
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
