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

<PageShell class="bg-background relative flex min-h-screen flex-col overflow-x-hidden">
    <!-- Immersive Background -->
    <div class="pointer-events-none fixed inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black"></div>
        <div
            class="bg-primary/5 absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full blur-[120px]">
        </div>
        <div
            class="absolute right-[-5%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px]">
        </div>
    </div>

    <div
        class="relative z-10 mx-auto flex w-full max-w-[2400px] flex-col gap-6 px-6 pt-6 pb-24 md:px-12 md:pt-16 md:pb-12 lg:px-16">
        <div class="flex flex-col">
            <h1
                class="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
                Trending Anime
            </h1>
        </div>

        {#if Array.isArray(anilistTrendingStore.items) && anilistTrendingStore.items.length > 0}
            <div
                class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
                {#each anilistTrendingStore.items as item (item.id)}
                    <div class="aspect-[2/3] w-full">
                        <ListItem data={item} indexer="anilist" type={item.media_type} />
                    </div>
                {/each}
                {#if anilistTrendingStore.loading}
                    {#each Array(6) as i (i)}
                        <div class="aspect-[2/3] w-full">
                            <PortraitCardSkeleton />
                        </div>
                    {/each}
                {/if}
            </div>
        {:else}
            <div
                class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
                {#each Array(12) as i (i)}
                    <div class="aspect-[2/3] w-full">
                        <PortraitCardSkeleton />
                    </div>
                {/each}
            </div>
        {/if}
        <div bind:this={loadMoreTrigger}></div>
    </div>
</PageShell>
