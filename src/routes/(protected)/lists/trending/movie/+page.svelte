<script lang="ts">
    import { MediaListStore, type BaseListItem } from "$lib/services/lists-cache.svelte";
    import ListItem from "$lib/components/list-item.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
    import { onMount } from "svelte";

    const trendingMoviesStore = new MediaListStore<BaseListItem>(
        "trendingMovies",
        "/api/tmdb/movie",
        "day"
    );
    let loadMoreTrigger: HTMLDivElement;

    onMount(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    trendingMoviesStore.hasMore &&
                    !trendingMoviesStore.loading
                ) {
                    trendingMoviesStore.loadMore();
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

<svelte:head>
    <title>Trending Movies - Riven</title>
</svelte:head>

<div class="mt-14 flex flex-col gap-6 p-6 md:p-8 md:px-16">
    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold md:text-3xl lg:text-4xl">Trending Movies</h1>
            <div class="flex gap-2">
                <Button
                    variant={trendingMoviesStore.timeWindow === "day" ? "default" : "outline"}
                    size="sm"
                    onclick={() => trendingMoviesStore.changeTimeWindow("day")}>
                    Today
                </Button>
                <Button
                    variant={trendingMoviesStore.timeWindow === "week" ? "default" : "outline"}
                    size="sm"
                    onclick={() => trendingMoviesStore.changeTimeWindow("week")}>
                    This Week
                </Button>
            </div>
        </div>
    </div>

    {#if Array.isArray(trendingMoviesStore.items) && trendingMoviesStore.items.length > 0}
        <div class="flex flex-wrap gap-4">
            {#each trendingMoviesStore.items as item (item.id)}
                <div>
                    <ListItem data={item} indexer="tmdb" type="movie" />
                </div>
            {/each}
            {#if trendingMoviesStore.loading}
                {#each Array(6) as _, i (i)}
                    <div class="w-full">
                        <Skeleton class="aspect-2/3 w-full rounded-sm" />
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
        <div class="flex flex-wrap gap-4">
            {#each Array(12) as _, i (i)}
                <div>
                    <Skeleton class="aspect-2/3 w-full rounded-sm" />
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
