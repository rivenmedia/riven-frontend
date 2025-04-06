<script lang="ts">
    import * as Carousel from '$lib/components/ui/carousel/index.js';
    import MediaItem from './media-item.svelte';
    import { cn } from '$lib/utils';

    let {
        list,
        orientation,
        title,
        class: className
    }: { list: any; orientation: string; title: string; class: string } = $props();
</script>

{#snippet itemContainer(orientation: string, item: any)}
    <Carousel.Item
        class={cn(
            'w-full',
            orientation === 'horizontal'
                ? 'min-w-80 basis-80 md:min-w-96 md:basis-96'
                : 'min-w-52 basis-52'
        )}
    >
        <MediaItem {item} {orientation} />
        <a href="{item.media_type}/{item.id}" class="mt-2 line-clamp-1 block text-sm hover:underline">
            {item.title || item.name || item.original_name}
        </a>
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
        <h2 class="text-xl lg:text-2xl">{title}</h2>
        <div class="flex items-center gap-1">
            <Carousel.Previous class="static mt-8 h-8 w-8 rounded-md" />
            <Carousel.Next class="static mt-8 h-8 w-8 rounded-md" />
        </div>
    </div>
    <Carousel.Content>
        {#each list as item (item.id)}
            {#if orientation === 'horizontal'}
                {@render itemContainer(orientation, item)}
            {:else if orientation === 'vertical'}
                {@render itemContainer(orientation, item)}
            {/if}
        {/each}
    </Carousel.Content>
</Carousel.Root>
