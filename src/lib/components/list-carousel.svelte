<script lang="ts">
    import * as Carousel from '$lib/components/ui/carousel/index.js';
    import { AspectRatio } from '$lib/components/ui/aspect-ratio/index.js';

    let {
        list,
        orientation,
        title,
        class: className
    }: { list: any; orientation: string; title: string; class: string } = $props();
</script>

{#snippet horizontal(item: any)}
    <Carousel.Item class="w-full min-w-80 basis-80 md:min-w-96 md:basis-96">
        <AspectRatio ratio={2 / 1} class="w-full">
            <img
                src="https://www.themoviedb.org/t/p/w780{item.backdrop_path}"
                alt={item.title || item.name || item.original_name}
                class="h-full w-full select-none rounded-md object-cover object-center"
                loading="lazy"
            />
        </AspectRatio>
        <span class="mt-2 line-clamp-1 block text-sm">
            {item.title || item.name || item.original_name}
        </span>
    </Carousel.Item>
{/snippet}

{#snippet vertical(item: any)}
    <Carousel.Item class="w-full min-w-52 basis-52">
        <AspectRatio ratio={2 / 3} class="w-full">
            <img
                src="https://www.themoviedb.org/t/p/w342{item.poster_path}"
                alt={item.title || item.name || item.original_name}
                class="h-full w-full select-none rounded-md object-cover object-center"
                loading="lazy"
            />
        </AspectRatio>
        <span class="mt-2 line-clamp-1 block text-sm">
            {item.title || item.name || item.original_name}
        </span>
    </Carousel.Item>
{/snippet}

<Carousel.Root
    opts={{
        dragFree: true,
        slidesToScroll: 'auto'
    }}
    class={className}
>
    <div class="flex w-full items-center justify-between">
        <h2 class="text-3xl">{title}</h2>
        <div class="flex items-center gap-1">
            <Carousel.Previous class="static mt-8 h-8 w-8 rounded-md" />
            <Carousel.Next class="static mt-8 h-8 w-8 rounded-md" />
        </div>
    </div>
    <Carousel.Content>
        {#each list as item (item.id)}
            {#if orientation === 'horizontal'}
                {@render horizontal(item)}
            {:else if orientation === 'vertical'}
                {@render vertical(item)}
            {/if}
        {/each}
    </Carousel.Content>
</Carousel.Root>
