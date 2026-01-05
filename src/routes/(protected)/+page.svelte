<script lang="ts">
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import TmdbNowPlaying from "$lib/components/tmdb-now-playing.svelte";
    import ListCarousel from "$lib/components/list-carousel.svelte";
    import AnimatedToggle from "$lib/components/animated-toggle.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { MediaListStore, type BaseListItem } from "$lib/services/lists-cache.svelte";

    let { data }: { data: PageData } = $props();

    let trendingMoviesStore = $state<MediaListStore<BaseListItem> | null>(null);
    let trendingShowsStore = $state<MediaListStore<BaseListItem> | null>(null);
    let anilistTrendingStore = $state<MediaListStore<BaseListItem> | null>(null);
    let recentlyAddedStore = $state<MediaListStore<BaseListItem> | null>(null);

    onMount(() => {
        recentlyAddedStore = new MediaListStore<BaseListItem>(
            "recentlyAdded",
            "/api/library/recent",
            null,
            { noCache: true }
        );
        trendingMoviesStore = new MediaListStore<BaseListItem>(
            "trendingMovies",
            "/api/tmdb/movie",
            "day"
        );
        trendingShowsStore = new MediaListStore<BaseListItem>(
            "trendingShows",
            "/api/tmdb/tv",
            "day"
        );
        anilistTrendingStore = new MediaListStore<BaseListItem>(
            "anilistTrending",
            "/api/anilist/trending"
        );
    });
</script>

<svelte:head>
    <title>Home - Riven</title>
</svelte:head>

<TmdbNowPlaying data={data.nowPlaying} />

{#snippet listHeading(title: string)}
    <h2 class="text-xl font-bold tracking-tight drop-shadow-md">
        {title}
    </h2>
{/snippet}

<div class="flex flex-col gap-8 p-6 md:p-8 md:px-16">
    {#if recentlyAddedStore?.items.length}
        <div class="flex flex-col gap-3">
            {@render listHeading("Recently Added")}
            <ListCarousel data={recentlyAddedStore.items} />
        </div>
    {/if}

    <div class="flex flex-col">
        <div class="mb-3 flex items-center justify-between">
            {@render listHeading("Trending Movies")}
            <div class="flex items-center gap-2">
                <AnimatedToggle
                    options={[
                        { label: "Today", value: "day" },
                        { label: "This Week", value: "week" }
                    ]}
                    value={trendingMoviesStore?.timeWindow ?? "day"}
                    onchange={(v) => trendingMoviesStore?.changeTimeWindow(v as "day" | "week")} />
                <Button
                    class="text-muted-foreground border-border/50 bg-background/50 hover:bg-muted hover:text-foreground h-9 w-20 rounded-full border text-xs backdrop-blur-md"
                    variant="ghost"
                    href="/lists/trending/movie">View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingMoviesStore?.items ?? []} />
    </div>

    <div class="flex flex-col">
        <div class="mb-3 flex items-center justify-between">
            {@render listHeading("Trending TV Shows")}
            <div class="flex items-center gap-2">
                <AnimatedToggle
                    options={[
                        { label: "Today", value: "day" },
                        { label: "This Week", value: "week" }
                    ]}
                    value={trendingShowsStore?.timeWindow ?? "day"}
                    onchange={(v) => trendingShowsStore?.changeTimeWindow(v as "day" | "week")} />
                <Button
                    class="text-muted-foreground border-border/50 bg-background/50 hover:bg-muted hover:text-foreground h-9 w-20 rounded-full border text-xs backdrop-blur-md"
                    variant="ghost"
                    href="/lists/trending/tv">View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingShowsStore?.items ?? []} />
    </div>

    <div class="flex flex-col">
        <div class="mb-3 flex items-center justify-between">
            {@render listHeading("Trending Anime")}
            <Button
                class="text-muted-foreground border-border/50 bg-background/50 hover:bg-muted hover:text-foreground h-9 w-20 rounded-full border text-xs backdrop-blur-md"
                variant="ghost"
                href="/lists/trending/anime">View All</Button>
        </div>
        <ListCarousel data={anilistTrendingStore?.items ?? []} indexer="anilist" />
    </div>
</div>
