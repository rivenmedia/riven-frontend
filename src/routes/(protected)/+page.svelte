<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import TmdbNowPlaying from "$lib/components/tmdb-now-playing.svelte";
    import ListCarousel from "$lib/components/list-carousel.svelte";
    import { Button } from "$lib/components/ui/button/index.js";

    let { data }: { data: PageData } = $props();

    let nowPlaying = $state<any | null>(null);
    let trendingMovies = $state<any | null>(null);
    let trendingMoviesTimeWindow = $state<"day" | "week">("day");
    let trendingShows = $state<any | null>(null);
    let trendingShowsTimeWindow = $state<"day" | "week">("day");
    let anilistTrending = $state<any | null>(null);

    if (browser) {
        const savedMoviesWindow = sessionStorage.getItem("trendingMoviesTimeWindow");
        if (savedMoviesWindow) {
            trendingMoviesTimeWindow = savedMoviesWindow as "day" | "week";
        }

        const savedShowsWindow = sessionStorage.getItem("trendingShowsTimeWindow");
        if (savedShowsWindow) {
            trendingShowsTimeWindow = savedShowsWindow as "day" | "week";
        }
    }

    async function fetchData(url: string, storageKey: string): Promise<any> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${url}`);
            }
            const result = await response.json();
            if (browser) {
                sessionStorage.setItem(storageKey, JSON.stringify(result));
            }
            return result;
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
            return null;
        }
    }

    function getStorageKey(baseKey: string, timeWindow?: "day" | "week"): string {
        return timeWindow ? `${baseKey}_${timeWindow}` : baseKey;
    }

    async function loadData(type: string): Promise<any> {
        switch (type) {
            case "nowPlaying":
                const nowPlayingKey = getStorageKey("nowPlaying");
                nowPlaying = await fetchData("/api/tmdb/now-playing", nowPlayingKey);
                return nowPlaying;
            
            case "trendingMovies":
                const moviesKey = getStorageKey("trendingMovies", trendingMoviesTimeWindow);
                trendingMovies = await fetchData(
                    `/api/tmdb/movie/${trendingMoviesTimeWindow}/trending`, 
                    moviesKey
                );
                return trendingMovies;
            
            case "trendingShows":
                const showsKey = getStorageKey("trendingShows", trendingShowsTimeWindow);
                trendingShows = await fetchData(
                    `/api/tmdb/tv/${trendingShowsTimeWindow}/trending`, 
                    showsKey
                );
                return trendingShows;
            
            case "anilistTrending":
                const anilistKey = getStorageKey("anilistTrending");
                anilistTrending = await fetchData("/api/anilist/trending", anilistKey);
                return anilistTrending;
        }
    }

    async function loadOrGetFromCache(type: string): Promise<any> {
        if (!browser) return null;

        let storageKey: string;
        switch (type) {
            case "nowPlaying": 
                storageKey = getStorageKey("nowPlaying");
                break;
            case "trendingMovies": 
                storageKey = getStorageKey("trendingMovies", trendingMoviesTimeWindow);
                break;
            case "trendingShows": 
                storageKey = getStorageKey("trendingShows", trendingShowsTimeWindow);
                break;
            case "anilistTrending": 
                storageKey = getStorageKey("anilistTrending");
                break;
            default:
                return null;
        }

        const storedData = sessionStorage.getItem(storageKey);
        if (storedData) {
            return JSON.parse(storedData);
        }
        
        return await loadData(type);
    }

    async function changeTimeWindow(type: "movies" | "shows", window: "day" | "week") {
        if (type === "movies") {
            if (trendingMoviesTimeWindow !== window) {
                trendingMoviesTimeWindow = window;
                if (browser) {
                    sessionStorage.setItem("trendingMoviesTimeWindow", window);
                }
                await loadData("trendingMovies");
            }
        } else {
            if (trendingShowsTimeWindow !== window) {
                trendingShowsTimeWindow = window;
                if (browser) {
                    sessionStorage.setItem("trendingShowsTimeWindow", window);
                }
                await loadData("trendingShows");
            }
        }
    }

    onMount(async () => {
        if (browser) {
            try {
                const [nowPlayingResult, moviesResult, showsResult, anilistResult] = await Promise.all([
                    loadOrGetFromCache("nowPlaying"),
                    loadOrGetFromCache("trendingMovies"),
                    loadOrGetFromCache("trendingShows"),
                    loadOrGetFromCache("anilistTrending")
                ]);
                
                nowPlaying = nowPlayingResult;
                trendingMovies = moviesResult;
                trendingShows = showsResult;
                anilistTrending = anilistResult;
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
                    onclick={() => changeTimeWindow("movies", "day")}>
                    Today
                </Button>
                <Button
                    variant={trendingMoviesTimeWindow === "week" ? "default" : "outline"}
                    size="sm"
                    onclick={() => changeTimeWindow("movies", "week")}>
                    This Week
                </Button>
                <Button variant="link" href="/movie/trending">View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingMovies?.results} />
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
                    onclick={() => changeTimeWindow("shows", "day")}>
                    Today
                </Button>
                <Button
                    variant={trendingShowsTimeWindow === "week" ? "default" : "outline"}
                    size="sm"
                    onclick={() => changeTimeWindow("shows", "week")}>
                    This Week
                </Button>
                <Button variant="link" href="/tv/trending">View All</Button>
            </div>
        </div>
        <ListCarousel data={trendingShows?.results} />
    </div>

    <div class="flex flex-col">
        <div class="flex items-center justify-between">
            <h2
                class="text-muted-foreground mb-4 max-w-max text-base font-semibold md:text-xl lg:text-2xl">
                Trending Animes
            </h2>
            <Button variant="link" href="/anime/trending">View All</Button>
        </div>
        <ListCarousel data={anilistTrending?.data?.Page?.media} />
    </div>
</div>