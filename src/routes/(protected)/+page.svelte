<script lang="ts">
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import TmdbNowPlaying from "$lib/components/tmdb-now-playing.svelte";
    import ListCarousel from "$lib/components/list-carousel.svelte";
    import AnimatedToggle from "$lib/components/animated-toggle.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { MediaListStore, type BaseListItem } from "$lib/services/lists-cache.svelte";
    import PageShell from "$lib/components/page-shell.svelte";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    let { data }: { data: PageData } = $props();

    const viewAllButtonClass =
        "text-muted-foreground border-border/50 bg-background/50 hover:bg-muted hover:text-foreground h-9 w-20 rounded-full border text-xs backdrop-blur-md";

    const recentlyAddedStore = new MediaListStore<BaseListItem>(
        "recentlyAdded",
        "/api/library/recent",
        null,
        { noCache: true, initialData: data.recentlyAdded }
    );
    const trendingMoviesStore = new MediaListStore<BaseListItem>(
        "trendingMovies",
        "/api/tmdb/movie",
        "day"
    );
    const trendingShowsStore = new MediaListStore<BaseListItem>(
        "trendingShows",
        "/api/tmdb/tv",
        "day"
    );
    const anilistTrendingStore = new MediaListStore<BaseListItem>(
        "anilistTrending",
        "/api/anilist/trending"
    );
</script>

<svelte:head>
    <title>Home - Riven</title>
</svelte:head>

<div in:fly|global={{ y: 20, duration: 400, delay: 0, easing: cubicOut }}>
    <TmdbNowPlaying data={data.nowPlaying} />
</div>

{#snippet listHeading(title: string)}
    <h2 class="text-xl font-bold tracking-tight drop-shadow-md">
        {title}
    </h2>
{/snippet}

<PageShell class="mt-4 md:mt-6">
    {#if recentlyAddedStore.items.length}
        <div
            class="flex flex-col gap-3"
            in:fly|global={{ y: 20, duration: 400, delay: 100, easing: cubicOut }}>
            {@render listHeading("Recently Added")}
            <ListCarousel data={recentlyAddedStore.items} />
        </div>
    {/if}

    <div
        class="flex flex-col"
        in:fly|global={{ y: 20, duration: 400, delay: 150, easing: cubicOut }}>
        <div class="mb-3 flex items-center justify-between">
            {@render listHeading("Trending Movies")}
            <div class="flex items-center gap-2">
                <AnimatedToggle
                    options={[
                        { label: "Today", value: "day" },
                        { label: "This Week", value: "week" }
                    ]}
                    value={trendingMoviesStore.timeWindow ?? "day"}
                    onchange={(v) => trendingMoviesStore.changeTimeWindow(v as "day" | "week")} />
                <Button class={viewAllButtonClass} variant="ghost" href="/lists/trending/movie"
                    >View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingMoviesStore.items} />
    </div>

    <div
        class="flex flex-col"
        in:fly|global={{ y: 20, duration: 400, delay: 200, easing: cubicOut }}>
        <div class="mb-3 flex items-center justify-between">
            {@render listHeading("Trending TV Shows")}
            <div class="flex items-center gap-2">
                <AnimatedToggle
                    options={[
                        { label: "Today", value: "day" },
                        { label: "This Week", value: "week" }
                    ]}
                    value={trendingShowsStore.timeWindow ?? "day"}
                    onchange={(v) => trendingShowsStore.changeTimeWindow(v as "day" | "week")} />
                <Button class={viewAllButtonClass} variant="ghost" href="/lists/trending/tv"
                    >View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingShowsStore.items} />
    </div>

    <div
        class="flex flex-col"
        in:fly|global={{ y: 20, duration: 400, delay: 250, easing: cubicOut }}>
        <div class="mb-3 flex items-center justify-between">
            {@render listHeading("Trending Anime")}
            <Button class={viewAllButtonClass} variant="ghost" href="/lists/trending/anime"
                >View All</Button>
        </div>
        <ListCarousel data={anilistTrendingStore.items} indexer="anilist" />
    </div>
</PageShell>
