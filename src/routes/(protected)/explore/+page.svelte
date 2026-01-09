<script lang="ts">
    import { getContext, onDestroy, onMount } from "svelte";
    import { type Action } from "svelte/action";
    import ListItem from "$lib/components/list-item.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import PortraitCardSkeleton from "$lib/components/media/portrait-card-skeleton.svelte";
    import { SearchStore } from "$lib/services/search-store.svelte";
    import AnimatedToggle from "$lib/components/animated-toggle.svelte";
    import SearchIcon from "@lucide/svelte/icons/search";
    import Sparkles from "@lucide/svelte/icons/sparkles";
    import Play from "@lucide/svelte/icons/play";
    import Info from "@lucide/svelte/icons/info";
    import { scale, fade } from "svelte/transition";
    import { goto } from "$app/navigation";

    let { data } = $props();

    const searchStore = getContext<SearchStore>("searchStore");

    let currentExampleIndex = $state(0);
    let currentHeroIndex = $state(0);
    let showEmptyState = $derived(
        !searchStore.rawSearchString && Object.keys(searchStore.filterParams).length === 0
    );
    let hasResults = $derived(Array.isArray(searchStore.results) && searchStore.results.length > 0);

    // Hero item derived from rotation
    let heroItem = $derived(
        data.heroItems && data.heroItems.length > 0 ? data.heroItems[currentHeroIndex] : null
    );

    // Ratings promise derived from hero item
    let ratingsPromise = $derived.by(async () => {
        if (!heroItem) return null;
        const res = await fetch(`/api/ratings/${heroItem.id}?type=${heroItem.media_type}`);
        return res.ok
            ? (res.json() as Promise<{
                  scores: Array<{ name: string; image?: string; score: string; url: string }>;
              }>)
            : null;
    });

    // Derived background image: Use hero item for empty state, first result for active search
    let backgroundImage = $derived(
        hasResults && searchStore.results[0]
            ? (searchStore.results[0].backdrop_path ?? searchStore.results[0].poster_path)
            : !hasResults && heroItem
              ? (heroItem.backdrop_path ?? heroItem.poster_path)
              : null
    );

    function handleFeelingLucky() {
        if (!data.feelingLuckyItems?.length) return;
        const randomItem =
            data.feelingLuckyItems[Math.floor(Math.random() * data.feelingLuckyItems.length)];
        const route = `/details/media/${randomItem.id}/${randomItem.media_type}`;
        goto(route);
    }

    onMount(() => {
        // Rotate search examples
        const exampleInterval = setInterval(() => {
            currentExampleIndex = (currentExampleIndex + 6) % data.searchExamples.length;
        }, 4000);

        // Rotate hero item every 8 seconds (faster for more dynamism)
        const heroInterval = setInterval(() => {
            if (data.heroItems?.length) {
                currentHeroIndex = (currentHeroIndex + 1) % data.heroItems.length;
            }
        }, 8000);

        return () => {
            clearInterval(exampleInterval);
            clearInterval(heroInterval);
        };
    });

    $effect.pre(() => {
        if (data.parsed) {
            searchStore.syncQuery(data.parsed);
        }
    });

    onDestroy(() => {
        searchStore.clear();
    });

    const infiniteScroll: Action<HTMLDivElement> = (node) => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !searchStore.loading && searchStore.hasMore) {
                    searchStore.loadMore();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(node);

        return {
            destroy() {
                observer.disconnect();
                searchStore.cancelPendingRequests();
            }
        };
    };
</script>

<svelte:head>
    <title>Explore - Riven</title>
</svelte:head>

<div class="relative min-h-screen w-full overflow-x-hidden">
    <!-- Immersive Background -->
    {#if backgroundImage}
        <div class="fixed top-0 left-0 z-0 h-screen w-full transition-opacity duration-1000">
            {#key backgroundImage}
                <img
                    alt=""
                    class="absolute inset-0 h-full w-full object-cover opacity-30 blur-3xl"
                    src={backgroundImage}
                    loading="lazy"
                    transition:scale={{ duration: 2000, start: 1.1, opacity: 0 }} />
            {/key}
            <div class="bg-background/80 absolute inset-0 mix-blend-multiply"></div>
            <div
                class="to-background absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent">
            </div>
            <div
                class="to-background absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-transparent to-transparent">
            </div>
        </div>
    {:else}
        <!-- Default subtle background -->
        <div class="fixed top-0 left-0 z-0 h-screen w-full">
            <div
                class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950">
            </div>
        </div>
    {/if}

    <!-- Content Container -->
    <div class="relative z-10 flex flex-col gap-6 px-4 pt-4 pb-24 md:px-8 md:pt-14 md:pb-8">
        <!-- Header -->
        <div class="flex flex-col gap-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-col gap-2">
                    <h1
                        class="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
                        {#if searchStore.rawSearchString}
                            Search Results
                        {:else}
                            Explore
                        {/if}
                    </h1>
                    <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                        {#if searchStore.rawSearchString}
                            <span>Results for</span>
                            <span
                                class="bg-muted/50 border-border rounded-md border px-2 py-0.5 font-mono text-xs">
                                {searchStore.rawSearchString}
                            </span>
                        {/if}
                        {#if searchStore.totalResults > 0 && !searchStore.loading}
                            {#if searchStore.rawSearchString}
                                <span class="text-border">•</span>
                            {/if}
                            <span class="font-medium tabular-nums"
                                >{searchStore.totalResults.toLocaleString()} results</span>
                        {/if}
                    </div>
                </div>

                <!-- Desktop filter tabs -->
                <div class="hidden md:block">
                    <AnimatedToggle
                        options={[
                            { label: "All", value: "both" },
                            { label: "Movies", value: "movie" },
                            { label: "TV Shows", value: "tv" },
                            { label: "People", value: "person" },
                            { label: "Studios", value: "company" }
                        ]}
                        value={searchStore.mediaType}
                        onchange={(value) =>
                            searchStore.setMediaType(
                                value as "both" | "movie" | "tv" | "person" | "company"
                            )} />
                </div>
            </div>

            <!-- Mobile filter tabs - inline below header -->
            <div class="-mx-1 block overflow-x-auto md:hidden">
                <AnimatedToggle
                    options={[
                        { label: "All", value: "both" },
                        { label: "Movies", value: "movie" },
                        { label: "TV Shows", value: "tv" },
                        { label: "People", value: "person" },
                        { label: "Studios", value: "company" }
                    ]}
                    value={searchStore.mediaType}
                    onchange={(value) =>
                        searchStore.setMediaType(
                            value as "both" | "movie" | "tv" | "person" | "company"
                        )} />
            </div>

            <!-- Warnings -->
            {#if searchStore.warnings?.length > 0}
                <div
                    class="rounded-lg border border-yellow-500 bg-yellow-500/10 p-4 text-yellow-600 dark:text-yellow-500">
                    <p class="font-semibold">Warnings</p>
                    <ul class="mt-1 list-disc pl-5 text-sm">
                        {#each searchStore.warnings as warning}
                            <li>{warning}</li>
                        {/each}
                    </ul>
                </div>
            {/if}

            <!-- Error -->
            {#if searchStore.error}
                <div class="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-500">
                    <p class="font-semibold">Error</p>
                    <p class="text-sm">{searchStore.error}</p>
                </div>
            {/if}

            <!-- Content -->
            {#if showEmptyState}
                <div class="relative flex flex-col gap-12 py-12 md:py-16">
                    <!-- Hero section -->
                    {#if heroItem}
                        {#key heroItem.id}
                            <div
                                class="animate-in fade-in slide-in-from-bottom-8 flex flex-col gap-6 duration-1000 md:gap-8">
                                <div class="max-w-3xl space-y-4">
                                    <div class="flex items-center gap-4">
                                        {#await ratingsPromise}
                                            <div
                                                class="h-6 w-24 animate-pulse rounded-full bg-white/10">
                                            </div>
                                        {:then ratings}
                                            {#if ratings?.scores?.length}
                                                <div class="flex items-center gap-3">
                                                    {#each ratings.scores as score (score.name)}
                                                        <div
                                                            title={score.name}
                                                            class="bg-background/50 flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 backdrop-blur-md transition-transform hover:scale-105">
                                                            {#if score.image}
                                                                <img
                                                                    src="/rating-logos/{score.image}"
                                                                    alt={score.name}
                                                                    class="h-4 w-4 object-contain" />
                                                            {:else}
                                                                <span class="font-bold text-white"
                                                                    >{score.name}</span>
                                                            {/if}
                                                            <span
                                                                class="text-sm font-bold text-white"
                                                                >{score.score}</span>
                                                        </div>
                                                    {/each}
                                                </div>
                                            {:else if heroItem.vote_average}
                                                <div
                                                    class="bg-background/50 flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 backdrop-blur-md">
                                                    <span class="font-black text-[#01b4e4]"
                                                        >TMDB</span>
                                                    <span class="text-sm font-bold text-white">
                                                        {heroItem.vote_average.toFixed(1)}
                                                    </span>
                                                </div>
                                            {/if}
                                        {:catch}
                                            {#if heroItem.vote_average}
                                                <div
                                                    class="bg-background/50 flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 backdrop-blur-md">
                                                    <span class="font-black text-[#01b4e4]"
                                                        >TMDB</span>
                                                    <span class="text-sm font-bold text-white">
                                                        {heroItem.vote_average.toFixed(1)}
                                                    </span>
                                                </div>
                                            {/if}
                                        {/await}
                                    </div>
                                    <h2
                                        class="text-foreground text-4xl font-black tracking-tight drop-shadow-lg md:text-6xl lg:text-7xl">
                                        {heroItem.title}
                                    </h2>
                                    <p
                                        class="text-muted-foreground line-clamp-3 text-lg md:text-xl md:leading-relaxed">
                                        {heroItem.overview}
                                    </p>
                                    <div class="flex flex-wrap items-center gap-4 pt-2">
                                        <Button
                                            size="lg"
                                            class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary rounded-full border bg-transparent font-bold shadow-xl backdrop-blur-md"
                                            href={`/details/media/${heroItem.id}/${heroItem.media_type}`}>
                                            <Info class="mr-2 h-5 w-5" />
                                            View Details
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onclick={handleFeelingLucky}
                                            class="border-border text-muted-foreground hover:bg-muted/10 hover:text-foreground hover:border-border/80 group rounded-full border bg-transparent font-bold backdrop-blur-md">
                                            <Sparkles
                                                class="text-primary group-hover:text-primary mr-2 h-5 w-5 transition-transform duration-500 group-hover:rotate-12" />
                                            Feeling Lucky
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        {/key}
                    {:else}
                        <!-- Fallback Hero (if no trending items) -->
                        <div class="flex flex-col gap-4">
                            <h2
                                class="text-foreground text-4xl font-bold tracking-tight drop-shadow-sm md:text-5xl lg:text-6xl">
                                What would you like to watch?
                            </h2>
                            <p class="text-muted-foreground text-lg md:text-xl">
                                Search our entire library
                            </p>
                        </div>
                    {/if}

                    <!-- Search suggestions -->
                    <div class="flex flex-col gap-6 pt-8">
                        <h3
                            class="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                            Trending now
                        </h3>
                        {#key currentExampleIndex}
                            <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {#each data.searchExamples.slice(currentExampleIndex, currentExampleIndex + 6) as example (example)}
                                    <button
                                        onclick={() => {
                                            const input = document.querySelector(
                                                'input[name="query"]'
                                            ) as HTMLInputElement;
                                            if (input) {
                                                input.value = example;
                                                input.dispatchEvent(
                                                    new Event("input", { bubbles: true })
                                                );
                                                input.focus();
                                            }
                                        }}
                                        class="bg-card/50 hover:bg-accent/50 group animate-in fade-in slide-in-from-bottom-2 hover:border-border/50 flex items-center gap-3 rounded-xl border border-transparent p-3 text-left backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] md:gap-4 md:p-5">
                                        <SearchIcon
                                            class="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 transition-colors duration-300 md:h-5 md:w-5" />
                                        <span
                                            class="text-foreground text-sm leading-tight font-medium capitalize md:text-lg"
                                            >{example}</span>
                                    </button>
                                {/each}
                            </div>
                        {/key}
                    </div>
                </div>
            {:else if hasResults}
                <div class="flex flex-wrap items-center gap-4">
                    {#each searchStore.results as item (`${item.media_type}-${item.id}`)}
                        <ListItem data={item} indexer={item.indexer} type={item.media_type} />
                    {/each}
                    {#if searchStore.loading}
                        {#each Array(6) as _}
                            <div class="w-36 md:w-44 lg:w-48">
                                <PortraitCardSkeleton />
                            </div>
                        {/each}
                    {/if}
                </div>
            {:else if searchStore.loading}
                <div class="flex flex-wrap gap-4">
                    {#each Array(12) as _}
                        <div class="w-36 md:w-44 lg:w-48">
                            <PortraitCardSkeleton />
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="flex flex-col items-center justify-center gap-2 py-16">
                    <p class="text-muted-foreground text-lg">No results found</p>
                    <p class="text-muted-foreground text-sm">
                        Try adjusting your search or filters
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={() => searchStore.clear()}
                        class="text-muted-foreground hover:text-foreground border-border/50 mt-2 bg-transparent">
                        Clear Search
                    </Button>
                </div>
            {/if}

            <div use:infiniteScroll></div>
        </div>
    </div>
</div>
