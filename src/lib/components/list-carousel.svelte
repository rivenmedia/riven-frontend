<script lang="ts">
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { type CarouselAPI } from "$lib/components/ui/carousel/context.js";
    import ListItem from "./list-item.svelte";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";

    let api = $state<CarouselAPI>();
    let { data = $bindable(), indexer = undefined, type = "" } = $props();
</script>

{#if Array.isArray(data) && data.length > 0}
    <Carousel.Root
        opts={{
            dragFree: true,
            slidesToScroll: "auto"
        }}
        class="mt-1.5"
        setApi={(emblaApi) => (api = emblaApi)}>
        <Carousel.Content>
            {#each data as item (item.id)}
                <Carousel.Item class="max-w-max">
                    <ListItem
                        data={item}
                        indexer={indexer || item.indexer}
                        type={type || item.media_type || item.type} />
                </Carousel.Item>
            {/each}
        </Carousel.Content>
    </Carousel.Root>
{:else}
    <div class="flex gap-3 overflow-x-auto pb-2">
        {#each Array(2) as _, i}
            <div class="w-36 flex-none md:w-44 lg:w-48">
                <Skeleton class="aspect-2/3 w-full rounded-sm" />
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
