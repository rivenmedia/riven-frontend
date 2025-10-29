<script lang="ts">
    import { MediaListStore } from "$lib/services/lists-cache.svelte";
    import ListItem from "$lib/components/list-item.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
    import { onMount } from "svelte";

    interface Props {
        title: string;
        store: MediaListStore;
        indexer: "tmdb" | "anilist";
        type: "movie" | "tv" | "anime";
        showTimeWindow?: boolean;
    }

    let { title, store, indexer, type, showTimeWindow = false }: Props = $props();

    let loadMoreTrigger: HTMLDivElement;

    onMount(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && store.hasMore && !store.loading) {
                    store.loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreTrigger) {
            observer.observe(loadMoreTrigger);
        }

        return () => observer.disconnect();
    });
</script>

<div class="mt-14 flex flex-col gap-6 p-6 md:p-8 md:px-16">
    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold md:text-3xl lg:text-4xl">{title}</h1>
            {#if showTimeWindow}
                <div class="flex gap-2">
                    <Button
                        variant={store.timeWindow === "day" ? "default" : "outline"}
                        size="sm"
                        onclick={() => store.changeTimeWindow("day")}>
                        Today
                    </Button>
                    <Button
                        variant={store.timeWindow === "week" ? "default" : "outline"}
                        size="sm"
                        onclick={() => store.changeTimeWindow("week")}>
                        This Week
                    </Button>
                </div>
            {/if}
        </div>
    </div>

    {#if Array.isArray(store.items) && store.items.length > 0}
        <div
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {#each store.items as item}
                <div>
                    <ListItem data={item} {indexer} {type} />
                </div>
            {/each}
            {#if store.loading}
                {#each Array(6) as _}
                    <div class="w-full">
                        <Skeleton class="aspect-[2/3] w-full rounded-sm" />
                        <Skeleton class="mt-2 h-4 w-full" />
                        <div class="mt-1 flex items-center justify-between">
                            <Skeleton class="h-4 w-12 rounded-full" />
                            <Skeleton class="h-4 w-12 rounded-full" />
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {:else}
        <div
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {#each Array(12) as _}
                <div>
                    <Skeleton class="aspect-[2/3] w-full rounded-sm" />
                    <Skeleton class="mt-2 h-4 w-full" />
                    <div class="mt-1 flex items-center justify-between">
                        <Skeleton class="h-4 w-12 rounded-full" />
                        <Skeleton class="h-4 w-12 rounded-full" />
                    </div>
                </div>
            {/each}
        </div>
    {/if}
    <div bind:this={loadMoreTrigger}></div>
</div>
