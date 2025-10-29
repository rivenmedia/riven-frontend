<script lang="ts">
    import { MediaListStore } from "../../../../../lib/services/lists-cache.svelte";
    import TrendingMediaList from "$lib/components/trending-media-list.svelte";

    const anilistTrendingStore = new MediaListStore("anilistTrending", "/api/anilist/trending");
</script>

<svelte:head>
    <title>Trending Animes - Riven</title>
</svelte:head>

<TrendingMediaList
    title="Trending Animes"
    store={anilistTrendingStore}
    indexer="anilist"
    type="anime"
    showTimeWindow={false} />
