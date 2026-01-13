<script lang="ts">
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
        "text-muted-foreground border-white/10 bg-black/20 hover:bg-black/40 hover:text-foreground h-8 w-24 rounded-full border text-xs font-medium backdrop-blur-md shadow-sm transition-all";

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
    <div class="flex items-center gap-3">
        <div class="bg-primary h-6 w-1 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]">
        </div>
        <h2 class="text-foreground text-2xl font-bold tracking-tight drop-shadow-md">
            {title}
        </h2>
    </div>
{/snippet}

<PageShell class="mt-4 flex flex-col gap-10 pb-20 md:mt-8">
    {#if recentlyAddedStore.items.length}
        <div
            class="flex flex-col gap-4"
            in:fly|global={{ y: 20, duration: 400, delay: 100, easing: cubicOut }}>
            {@render listHeading("Recently Added")}
            <ListCarousel data={recentlyAddedStore.items} />
        </div>
    {/if}

    <div
        class="flex flex-col gap-4"
        in:fly|global={{ y: 20, duration: 400, delay: 150, easing: cubicOut }}>
        <div class="mb-1 flex items-center justify-between">
            {@render listHeading("Trending Movies")}
            <div class="flex items-center gap-3">
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
        class="flex flex-col gap-4"
        in:fly|global={{ y: 20, duration: 400, delay: 200, easing: cubicOut }}>
        <div class="mb-1 flex items-center justify-between">
            {@render listHeading("Trending TV Shows")}
            <div class="flex items-center gap-3">
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
        class="flex flex-col gap-4"
        in:fly|global={{ y: 20, duration: 400, delay: 250, easing: cubicOut }}>
        <div class="mb-1 flex items-center justify-between">
            {@render listHeading("Trending Anime")}
            <Button class={viewAllButtonClass} variant="ghost" href="/lists/trending/anime"
                >View All</Button>
        </div>
        <ListCarousel data={anilistTrendingStore.items} indexer="anilist" />
    </div>
</PageShell>
