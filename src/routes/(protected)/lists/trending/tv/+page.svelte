<script lang="ts">
    import { MediaListStore } from "../../../../../lib/services/lists-cache.svelte";
    import TrendingMediaList from "$lib/components/trending-media-list.svelte";

    const trendingShowsStore = new MediaListStore("trendingShows", "/api/tmdb/tv", "day");
</script>

<svelte:head>
    <title>Trending TV Shows - Riven</title>
</svelte:head>

<TrendingMediaList
    title="Trending TV Shows"
    store={trendingShowsStore}
    indexer="tmdb"
    type="tv"
    showTimeWindow={true} />
