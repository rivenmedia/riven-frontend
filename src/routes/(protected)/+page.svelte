<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import TmdbNowPlaying from "$lib/components/tmdb-now-playing.svelte";
    import ListCarousel from "$lib/components/list-carousel.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { MediaListStore } from "./listStore.svelte";

    let { data }: { data: PageData } = $props();

    const nowPlayingStore = new MediaListStore("nowPlaying", "/api/tmdb/now-playing");
    const trendingMoviesStore = new MediaListStore("trendingMovies", "/api/tmdb/movie", "day");
    const trendingShowsStore = new MediaListStore("trendingShows", "/api/tmdb/tv", "day");
    const anilistTrendingStore = new MediaListStore("anilistTrending", "/api/anilist/trending");
</script>

<TmdbNowPlaying data={nowPlayingStore.items} />

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
                    variant={trendingMoviesStore.timeWindow === "day" ? "secondary" : "outline"}
                    size="sm"
                    class="px-3 py-1 text-xs"
                    onclick={() => trendingMoviesStore.changeTimeWindow("day")}>
                    Today
                </Button>
                <Button
                    variant={trendingMoviesStore.timeWindow === "week" ? "secondary" : "outline"}
                    size="sm"
                    class="px-3 py-1 text-xs"
                    onclick={() => trendingMoviesStore.changeTimeWindow("week")}>
                    This Week
                </Button>
                <Button class="text-xs" variant="link" href="/lists/trending/movie"
                    >View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingMoviesStore.items} indexer="tmdb" type="movie" />
    </div>

    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            {@render listHeading("Trending TV Shows")}
            <div class="flex gap-2">
                <Button
                    variant={trendingShowsStore.timeWindow === "day" ? "secondary" : "outline"}
                    size="sm"
                    class="px-3 py-1 text-xs"
                    onclick={() => trendingShowsStore.changeTimeWindow("day")}>
                    Today
                </Button>
                <Button
                    variant={trendingShowsStore.timeWindow === "week" ? "secondary" : "outline"}
                    size="sm"
                    class="px-3 py-1 text-xs"
                    onclick={() => trendingShowsStore.changeTimeWindow("week")}>
                    This Week
                </Button>
                <Button class="text-xs" variant="link" href="/lists/trending/tv">View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingShowsStore.items} indexer="tmdb" type="tv" />
    </div>

    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            {@render listHeading("Trending Anime")}
            <Button class="text-xs" variant="link" href="/lists/trending/anime">View All</Button>
        </div>
        <ListCarousel data={anilistTrendingStore.items} indexer="anilist" />
    </div>
</div>
