<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import TmdbNowPlaying from "$lib/components/tmdb-now-playing.svelte";
    import ListCarousel from "$lib/components/list-carousel.svelte";
    import { TMDB_IMAGE_BASE_URL } from "$lib/providers/tmdb";
    import { Button } from "$lib/components/ui/button/index.js";

    let { data }: { data: PageData } = $props();

    let nowPlaying = $state<any | null>(null);
    let trendingMovies = $state<any | null>(null);
    let trendingMoviesTimeWindow = $state<"day" | "week">("day");
    let trenedingShows = $state<any | null>(null);
    let trendingShowsTimeWindow = $state<"day" | "week">("day");
    let anilistTrending = $state<any | null>(null);

    async function fetchDataWithStorage(url: string, storageKey: string): Promise<any> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${url}`);
            }
            const result = await response.json();
            sessionStorage.setItem(storageKey, JSON.stringify(result));
            return result;
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
            return null;
        }
    }

    async function getOrFetchData(
        storageKey: string,
        fetchFunction: () => Promise<any>
    ): Promise<any> {
        if (browser) {
            const storedData = sessionStorage.getItem(storageKey);
            if (storedData) {
                return JSON.parse(storedData);
            }
            return await fetchFunction();
        }
        return null;
    }

    async function changeTimeWindow(
        currentValue: "day" | "week",
        newValue: "day" | "week",
        storageKey: string,
        fetchFunction: () => Promise<void>
    ): Promise<"day" | "week"> {
        if (currentValue !== newValue) {
            sessionStorage.removeItem(storageKey);
            const updated = newValue;
            await fetchFunction();
            return updated;
        }
        return currentValue;
    }

    function parseMovieData(data: any) {
        return (
            data?.results.map((item: any) => ({
                id: item.id,
                title: item.title || item.original_title,
                poster_path: `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`,
                media_type: "Movie",
                year: new Date(item.release_date).getFullYear()
            })) || null
        );
    }

    function parseShowData(data: any) {
        return (
            data?.results.map((item: any) => ({
                id: item.id,
                title: item.name || item.original_name,
                poster_path: `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`,
                media_type: "TV",
                year: new Date(item.first_air_date).getFullYear()
            })) || null
        );
    }

    function parseAnimeData(data: any) {
        return (
            data?.data?.Page?.media.map((item: any) => ({
                id: item.id,
                title: item.title.romaji || item.title.english || item.title.native,
                poster_path: item.coverImage.large,
                media_type: item.format,
                year: item.seasonYear
            })) || null
        );
    }

    async function fetchNowPlaying() {
        nowPlaying = await fetchDataWithStorage("/api/tmdb/now-playing", "getNowPlaying");
    }

    async function fetchTrendingMovies() {
        trendingMovies = await fetchDataWithStorage(
            `/api/tmdb/movie/${trendingMoviesTimeWindow}/trending`,
            "getTrendingMovies"
        );
    }

    async function fetchTrendingShows() {
        trenedingShows = await fetchDataWithStorage(
            `/api/tmdb/tv/${trendingShowsTimeWindow}/trending`,
            "getTrendingShows"
        );
    }

    async function fetchAnilistTrending() {
        anilistTrending = await fetchDataWithStorage("/api/anilist/trending", "getAnilistTrending");
    }

    async function changeMoviesTimeWindow(window: "day" | "week") {
        trendingMoviesTimeWindow = await changeTimeWindow(
            trendingMoviesTimeWindow,
            window,
            "getTrendingMovies",
            fetchTrendingMovies
        );
    }

    async function changeShowsTimeWindow(window: "day" | "week") {
        trendingShowsTimeWindow = await changeTimeWindow(
            trendingShowsTimeWindow,
            window,
            "getTrendingShows",
            fetchTrendingShows
        );
    }

    let trendingMoviesParsed = $derived.by(() => parseMovieData(trendingMovies));
    let trendingShowsParsed = $derived.by(() => parseShowData(trenedingShows));
    let anilistTrendingParsed = $derived.by(() => parseAnimeData(anilistTrending));

    onMount(async () => {
        if (browser) {
            try {
                // Use the common pattern for loading all data sources
                nowPlaying = await getOrFetchData("getNowPlaying", fetchNowPlaying);
                trendingMovies = await getOrFetchData("getTrendingMovies", fetchTrendingMovies);
                trenedingShows = await getOrFetchData("getTrendingShows", fetchTrendingShows);
                anilistTrending = await getOrFetchData("getAnilistTrending", fetchAnilistTrending);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
    });
</script>

<TmdbNowPlaying data={nowPlaying} />

<div class="flex flex-col gap-12 p-6 md:p-8 md:px-16">
    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            <h2
                class="text-muted-foreground mb-4 max-w-max text-base font-semibold md:text-xl lg:text-2xl">
                Trending Movies
            </h2>
            <div class="flex gap-2">
                <Button
                    variant={trendingMoviesTimeWindow === "day" ? "default" : "outline"}
                    size="sm"
                    onclick={() => changeMoviesTimeWindow("day")}>
                    Today
                </Button>
                <Button
                    variant={trendingMoviesTimeWindow === "week" ? "default" : "outline"}
                    size="sm"
                    onclick={() => changeMoviesTimeWindow("week")}>
                    This Week
                </Button>
                <Button variant="link" href="/movie/trending">View All</Button>
            </div>
        </div>
        <ListCarousel bind:data={trendingMoviesParsed} />
    </div>

    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            <h2
                class="text-muted-foreground mb-4 max-w-max text-base font-semibold md:text-xl lg:text-2xl">
                Trending TV Shows
            </h2>
            <div class="flex gap-2">
                <Button
                    variant={trendingShowsTimeWindow === "day" ? "default" : "outline"}
                    size="sm"
                    onclick={() => changeShowsTimeWindow("day")}>
                    Today
                </Button>
                <Button
                    variant={trendingShowsTimeWindow === "week" ? "default" : "outline"}
                    size="sm"
                    onclick={() => changeShowsTimeWindow("week")}>
                    This Week
                </Button>
                <Button variant="link" href="/tv/trending">View All</Button>
            </div>
        </div>
        <ListCarousel bind:data={trendingShowsParsed} />
    </div>

    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            <h2
                class="text-muted-foreground mb-4 max-w-max text-base font-semibold md:text-xl lg:text-2xl">
                Trending Animes
            </h2>
            <Button variant="link" href="/anime/trending">View All</Button>
        </div>
        <ListCarousel bind:data={anilistTrendingParsed} />
    </div>
</div>
