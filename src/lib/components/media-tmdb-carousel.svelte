<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel/index.js';

	export let name: string;
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
		<div class="flex items-center gap-1">
			<Carousel.Previous class="static mt-8 h-8 w-8 rounded-md" />
			<Carousel.Next class="static mt-8 h-8 w-8 rounded-md" />
		</div>
	</div>
	<Carousel.Content class="h-full w-full">
		{#each results as result}
			<Carousel.Item class="basis-1/2 md:basis-1/4 lg:basis-1/6">
				<a href="/{result.media_type || mediaType}/{result.id}">
					<img
						alt={result.id}
						src="https://www.themoviedb.org/t/p/w780{result.poster_path}"
						class="h-full w-full rounded-lg object-cover object-center transition-all duration-300 ease-in-out hover:scale-95"
                        loading="lazy"
					/>
				</a>
			</Carousel.Item>
		{/each}
	</Carousel.Content>
</Carousel.Root>
