<script lang="ts">
    import { getContext, onDestroy } from "svelte";
    import ListItem from "$lib/components/list-item.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import PortraitCardSkeleton from "$lib/components/media/portrait-card-skeleton.svelte";
    import { SearchStore } from "$lib/services/search-store.svelte";
    import AnimatedToggle from "$lib/components/animated-toggle.svelte";
    import PageShell from "$lib/components/page-shell.svelte";
    import type { Action } from "svelte/action";

    let { data } = $props();

    const searchStore = getContext<SearchStore>("searchStore");

    // Sync query from URL when data changes (runs before DOM updates)
    $effect.pre(() => {
        if (data.parsed) {
            searchStore.syncQuery(data.parsed);
        }
    });

    onDestroy(() => {
        searchStore.clear();
    });

    // Intersection observer action for infinite scroll
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

    let showEmptyState = $derived(
        !searchStore.rawSearchString && Object.keys(searchStore.filterParams).length === 0
    );
    let hasResults = $derived(Array.isArray(searchStore.results) && searchStore.results.length > 0);
</script>

<svelte:head>
    <title>Explore - Riven</title>
</svelte:head>

<PageShell>
    <!-- Header -->
    <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-col gap-2">
                <h1 class="text-foreground text-2xl font-black tracking-tight md:text-3xl">
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
                        <span class="tabular-nums"
                            >{searchStore.totalResults.toLocaleString()} results</span>
                    {/if}
                </div>
            </div>

            <AnimatedToggle
                options={[
                    { label: "All", value: "both" },
                    { label: "Movies", value: "movie" },
                    { label: "TV Shows", value: "tv" }
                ]}
                value={searchStore.mediaType}
                onchange={(value) => searchStore.setMediaType(value as "both" | "movie" | "tv")} />
        </div>
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
        <div class="flex flex-col items-center justify-center gap-4 py-16">
            <p class="text-muted-foreground">Type to search for movies or TV shows</p>
            <div class="text-muted-foreground text-sm">
                <p class="mb-2 font-semibold">Search examples:</p>
                <ul class="list-disc space-y-1 pl-5 font-mono text-xs">
                    <li>inception</li>
                    <li>breaking bad</li>
                </ul>
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
            <p class="text-muted-foreground">No results found</p>
            <p class="text-muted-foreground text-sm">Try adjusting your search or filters</p>
            <Button variant="outline" size="sm" onclick={() => searchStore.clear()} class="mt-2">
                Clear Search
            </Button>
        </div>
    {/if}

    <div use:infiniteScroll></div>
</PageShell>
