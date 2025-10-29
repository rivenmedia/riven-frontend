<script lang="ts">
    import { MediaListStore } from "../../../../../lib/services/lists-cache.svelte";
    import TrendingMediaList from "$lib/components/trending-media-list.svelte";

    const trendingMoviesStore = new MediaListStore("trendingMovies", "/api/tmdb/movie", "day");
</script>

<svelte:head>
    <title>Trending Movies - Riven</title>
</svelte:head>

<TrendingMediaList
    title="Trending Movies"
    store={trendingMoviesStore}
    indexer="tmdb"
    type="movie"
    showTimeWindow={true} />
