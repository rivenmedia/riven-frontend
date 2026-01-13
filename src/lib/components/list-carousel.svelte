<script lang="ts">
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import ListItem from "./list-item.svelte";
    import PortraitCardSkeleton from "$lib/components/media/portrait-card-skeleton.svelte";

    let { data = $bindable(), indexer = undefined, type = "" } = $props();
</script>

{#if Array.isArray(data) && data.length > 0}
    <Carousel.Root
        opts={{
            dragFree: true,
            slidesToScroll: "auto"
        }}
        class="mt-0">
        <Carousel.Content class="-ml-3">
            {#each data as item (item.id)}
                <Carousel.Item class="max-w-max pl-3">
                    <ListItem
                        data={item}
                        indexer={indexer || item.indexer}
                        type={type || item.media_type || item.type}
                        class="w-36 md:w-44 lg:w-48" />
                </Carousel.Item>
            {/each}
        </Carousel.Content>
    </Carousel.Root>
{:else}
    <div class="mt-1.5 flex gap-3 overflow-x-auto pb-2">
        {#each Array(6) as i (i)}
            <div class="w-36 flex-none md:w-44 lg:w-48">
                <PortraitCardSkeleton />
            </div>
        {/each}
    </div>
{/if}
