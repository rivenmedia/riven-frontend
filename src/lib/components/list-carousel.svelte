<script lang="ts">
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { type CarouselAPI } from "$lib/components/ui/carousel/context.js";
    import ListItem from "./list-item.svelte";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";

    let api = $state<CarouselAPI>();
    let { data = $bindable(), indexer, type = "" } = $props();
</script>

{#if data}
    <Carousel.Root
        opts={{
            dragFree: true,
            slidesToScroll: "auto"
        }}
        class="mt-1.5"
        setApi={(emblaApi) => (api = emblaApi)}>
        <Carousel.Content>
            {#each data as item}
                <Carousel.Item class="basis-36 md:basis-40 lg:basis-44">
                    <ListItem data={item} {indexer} {type} />
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
