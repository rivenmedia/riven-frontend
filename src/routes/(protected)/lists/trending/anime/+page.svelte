<script lang="ts">
    import { MediaListStore, type BaseListItem } from "$lib/services/lists-cache.svelte";
    import ListItem from "$lib/components/list-item.svelte";
    import PortraitCardSkeleton from "$lib/components/media/portrait-card-skeleton.svelte";
    import { onMount } from "svelte";
    import PageShell from "$lib/components/page-shell.svelte";

    const anilistTrendingStore = new MediaListStore<BaseListItem>(
        "anilistTrending",
        "/api/anilist/trending"
    );
    let loadMoreTrigger: HTMLDivElement;

    onMount(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    anilistTrendingStore.hasMore &&
                    !anilistTrendingStore.loading
                ) {
                    anilistTrendingStore.loadMore();
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
    <title>Trending Animes - Riven</title>
</svelte:head>

<PageShell>
    <div class="flex flex-col">
        <h1 class="text-2xl font-bold md:text-3xl lg:text-4xl">Trending Animes</h1>
    </div>

    {#if Array.isArray(anilistTrendingStore.items) && anilistTrendingStore.items.length > 0}
        <div class="flex flex-wrap gap-4">
            {#each anilistTrendingStore.items as item (item.id)}
                <div>
                    <ListItem data={item} indexer="anilist" type={item.media_type} />
                </div>
            {/each}
            {#if anilistTrendingStore.loading}
                {#each Array(6) as _, i (i)}
                    <div class="w-36 md:w-44 lg:w-48">
                        <PortraitCardSkeleton />
                    </div>
                {/each}
            {/if}
        </div>
    {:else}
        <div class="flex flex-wrap gap-4">
            {#each Array(12) as _, i (i)}
                <div class="w-36 md:w-44 lg:w-48">
                    <PortraitCardSkeleton />
                </div>
            {/each}
        </div>
    {/if}
    <div bind:this={loadMoreTrigger}></div>
</PageShell>
