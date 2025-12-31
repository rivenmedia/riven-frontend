<script lang="ts">
    import { getContext } from "svelte";
    import ListItem from "$lib/components/list-item.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
    import { SearchStore } from "$lib/services/search-store.svelte";

    let { data } = $props();

    const searchStore = getContext<SearchStore>("searchStore");
    let loadMoreTrigger = $state<HTMLDivElement | null>(null);
    let lastQuery = $state("");

    // Derived values from data
    const currentQuery = $derived(data.form?.data?.query || "");
    const currentType = $derived(data.form?.data?.type || "both");

    // Handle query changes
    $effect(() => {
        if (currentQuery !== lastQuery) {
            lastQuery = currentQuery;

            if (currentQuery) {
                searchStore.setSearch(currentQuery, data.parsed);
                searchStore.setMediaType(currentType);
                searchStore.searchDebounced();
            } else {
                searchStore.clear();
            }
        }
    });

    // Setup intersection observer for infinite scroll
    $effect(() => {
        if (!loadMoreTrigger) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && searchStore.hasMore && !searchStore.loading) {
                    searchStore.loadMore();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(loadMoreTrigger);

        return () => {
            observer.disconnect();
            searchStore.cancelPendingRequests();
        };
    });
</script>

<svelte:head>
    <title>Search Results - Riven</title>
</svelte:head>

<div class="mt-14 flex flex-col gap-6 p-6 md:p-8 md:px-16">
    <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
            <div class="flex flex-col gap-1">
                <h1 class="text-2xl font-bold md:text-3xl lg:text-4xl">Search Results</h1>
                {#if searchStore.rawSearchString}
                    <p class="text-muted-foreground text-sm">
                        Searching for: <span class="font-mono">{searchStore.rawSearchString}</span>
                    </p>
                {/if}
                {#if searchStore.totalResults > 0 && !searchStore.loading}
                    <p class="text-muted-foreground text-sm">
                        Found {searchStore.totalResults} results
                    </p>
                {/if}
            </div>
            <div class="flex gap-2">
                <Button
                    variant={searchStore.mediaType === "both" ? "default" : "outline"}
                    size="sm"
                    onclick={() => searchStore.setMediaType("both")}>
                    All
                </Button>
                <Button
                    variant={searchStore.mediaType === "movie" ? "default" : "outline"}
                    size="sm"
                    onclick={() => searchStore.setMediaType("movie")}>
                    Movies
                </Button>
                <Button
                    variant={searchStore.mediaType === "tv" ? "default" : "outline"}
                    size="sm"
                    onclick={() => searchStore.setMediaType("tv")}>
                    TV Shows
                </Button>
            </div>
        </div>
    </div>

    {#if searchStore.warnings && searchStore.warnings.length > 0}
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

    {#if searchStore.error}
        <div class="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-500">
            <p class="font-semibold">Error</p>
            <p class="text-sm">{searchStore.error}</p>
        </div>
    {/if}

    {#if !searchStore.rawSearchString}
        <div class="flex flex-col items-center justify-center gap-4 py-16">
            <p class="text-muted-foreground">
                Use the search bar above to discover movies and TV shows
            </p>
            <div class="text-muted-foreground text-sm">
                <p class="mb-2 font-semibold">Examples:</p>
                <ul class="list-disc space-y-1 pl-5 font-mono text-xs">
                    <li>inception - text search only</li>
                    <li>inception y:2024 g:sci-fi - hybrid search with filters</li>
                    <li>y:2024 g:action va:7 - pure filtering (no text)</li>
                    <li>test year:2025 eg:fantasy va:7</li>
                </ul>
            </div>
        </div>
    {:else if Array.isArray(searchStore.results) && searchStore.results.length > 0}
        <div class="flex flex-wrap items-center gap-4">
            {#each searchStore.results as item (item.id)}
                <ListItem data={item} indexer={item.indexer} type={item.media_type} />
            {/each}
            {#if searchStore.loading}
                {#each Array(6) as _}
                    <div class="w-full">
                        <Skeleton class="aspect-2/3 w-full rounded-sm" />
                        <Skeleton class="mt-2 h-4 w-full" />
                        <div class="mt-1 flex items-center justify-between">
                            <Skeleton class="h-4 w-12 rounded-full" />
                            <Skeleton class="h-4 w-12 rounded-full" />
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {:else if searchStore.loading}
        <div
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {#each Array(12) as _}
                <div>
                    <Skeleton class="aspect-2/3 w-full rounded-sm" />
                    <Skeleton class="mt-2 h-4 w-full" />
                    <div class="mt-1 flex items-center justify-between">
                        <Skeleton class="h-4 w-12 rounded-full" />
                        <Skeleton class="h-4 w-12 rounded-full" />
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="flex flex-col items-center justify-center gap-2 py-16">
            <p class="text-muted-foreground">No results found</p>
            <p class="text-muted-foreground text-sm">Try adjusting your search query</p>
        </div>
    {/if}

    <div bind:this={loadMoreTrigger}></div>
</div>
