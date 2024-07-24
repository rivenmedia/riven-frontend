<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel/index.js';

	export let name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let results: any;
	export let mediaType: string | null = null;
</script>

<Carousel.Root
	opts={{
		dragFree: true,
		slidesToScroll: 'auto'
	}}
	class="mt-4 h-full overflow-hidden"
>
	<div class="mb-2 flex items-center justify-between">
		<h3 class="text-2xl text-zinc-100">{name}</h3>
		<div class="flex items-center gap-1 text-zinc-900 dark:text-zinc-100">
			<Carousel.Previous class="static mt-8 h-8 w-8 rounded-md" />
			<Carousel.Next class="static mt-8 h-8 w-8 rounded-md" />
		</div>
	</div>
	<Carousel.Content class="h-full w-full">
		{#each results as result}
			<Carousel.Item class="basis-1/2 md:basis-1/4 lg:basis-1/6">
				<div class="group relative aspect-[1/1.5] w-full overflow-hidden rounded-lg">
					<span class="inline-block h-full w-full">
						<img
							alt={result.id}
							height="100%"
							src="https://www.themoviedb.org/t/p/w780{result.poster_path}"
							class="h-full w-full object-cover object-center transition-all duration-300 ease-in-out group-hover:scale-105"
							loading="lazy"
						/>
					</span>
				</div>
			</Carousel.Item>
		{/each}
	</Carousel.Content>
</Carousel.Root>
