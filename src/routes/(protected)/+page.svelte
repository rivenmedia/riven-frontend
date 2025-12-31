<script lang="ts">
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import TmdbNowPlaying from "$lib/components/tmdb-now-playing.svelte";
    import ListCarousel from "$lib/components/list-carousel.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { MediaListStore, type BaseListItem } from "$lib/services/lists-cache.svelte";

    let { data }: { data: PageData } = $props();

    let trendingMoviesStore = $state<MediaListStore<BaseListItem> | null>(null);
    let trendingShowsStore = $state<MediaListStore<BaseListItem> | null>(null);
    let anilistTrendingStore = $state<MediaListStore<BaseListItem> | null>(null);

    onMount(() => {
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
    <h2 class="text-muted-foreground mb-4 max-w-max text-sm font-semibold md:text-base lg:text-lg">
        {title}
    </h2>
{/snippet}

<div class="flex flex-col gap-12 p-6 md:p-8 md:px-16">
    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            {@render listHeading("Trending Movies")}
            <div class="flex gap-2">
                <Button
                    variant={trendingMoviesStore?.timeWindow === "day" ? "secondary" : "outline"}
                    size="sm"
                    class="px-3 py-1 text-xs"
                    onclick={() => trendingMoviesStore?.changeTimeWindow("day")}>
                    Today
                </Button>
                <Button
                    variant={trendingMoviesStore?.timeWindow === "week" ? "secondary" : "outline"}
                    size="sm"
                    class="px-3 py-1 text-xs"
                    onclick={() => trendingMoviesStore?.changeTimeWindow("week")}>
                    This Week
                </Button>
                <Button class="text-xs" variant="link" href="/lists/trending/movie"
                    >View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingMoviesStore?.items ?? []} />
    </div>

    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            {@render listHeading("Trending TV Shows")}
            <div class="flex gap-2">
                <Button
                    variant={trendingShowsStore?.timeWindow === "day" ? "secondary" : "outline"}
                    size="sm"
                    class="px-3 py-1 text-xs"
                    onclick={() => trendingShowsStore?.changeTimeWindow("day")}>
                    Today
                </Button>
                <Button
                    variant={trendingShowsStore?.timeWindow === "week" ? "secondary" : "outline"}
                    size="sm"
                    class="px-3 py-1 text-xs"
                    onclick={() => trendingShowsStore?.changeTimeWindow("week")}>
                    This Week
                </Button>
                <Button class="text-xs" variant="link" href="/lists/trending/tv">View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingShowsStore?.items ?? []} />
    </div>

    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            {@render listHeading("Trending Anime")}
            <Button class="text-xs" variant="link" href="/lists/trending/anime">View All</Button>
        </div>
        <ListCarousel data={anilistTrendingStore?.items ?? []} indexer="anilist" />
    </div>
</div>
