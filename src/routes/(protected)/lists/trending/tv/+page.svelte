<script lang="ts">
    import { setContext } from "svelte";
    import ListItem from "$lib/components/list-item.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
    import { onMount } from "svelte";
    import { SearchStore } from "$lib/services/search-store.svelte";
    import { FilterStore, SORT_OPTIONS } from "$lib/services/filter-store.svelte";
    import FilterPopover from "$lib/components/filter-popover.svelte";
    import * as Select from "$lib/components/ui/select/index.js";
    import XIcon from "@lucide/svelte/icons/x";
    import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";

    let searchStore = new SearchStore();
    let filterStore = new FilterStore();
    let loadMoreTrigger = $state<HTMLDivElement | null>(null);

    // Provide stores to children (like FilterPopover)
    setContext("searchStore", searchStore);
    setContext("filterStore", filterStore);

    let isTriggerVisible = $state(false);

    onMount(() => {
        // Initialize as a discovery page for TV shows
        searchStore.mediaType = "tv";
        searchStore.allowEmptySearch = true; // Enable discovery mode
        searchStore.search(); // Initial fetch

        const observer = new IntersectionObserver(
            (entries) => {
                isTriggerVisible = entries[0].isIntersecting;
            },
            { threshold: 0.1 }
        );

        if (loadMoreTrigger) {
            observer.observe(loadMoreTrigger);
        }

        return () => {
            observer.disconnect();
            searchStore.cancelPendingRequests();
        };
    });

    $effect(() => {
        if (isTriggerVisible && !searchStore.loading && searchStore.hasMore) {
            searchStore.loadMore();
        }
    });

    function applyFilters() {
        const params = filterStore.buildParams("tv");
        searchStore.setFilters(params, true);
    }

    function clearFilters() {
        filterStore.reset();
        searchStore.clearFilters();
        searchStore.search();
    }

    function handleSortChange(value: string) {
        if (!value) return;
        filterStore.sortBy = value;
        applyFilters();
    }
</script>

<svelte:head>
    <title>Trending TV Shows - Riven</title>
</svelte:head>

<div class="mt-14 flex flex-col gap-6 p-6 md:p-8 md:px-16">
    <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h1 class="text-2xl font-bold md:text-3xl lg:text-4xl">Trending TV Shows</h1>

            <div class="flex items-center gap-2">
                <!-- Sort Dropdown -->
                <Select.Root
                    type="single"
                    value={filterStore.sortBy}
                    onValueChange={handleSortChange}>
                    <Select.Trigger class="h-9 w-[180px] gap-2">
                        <ArrowUpDownIcon class="text-muted-foreground size-4" />
                        <span class="truncate">
                            {SORT_OPTIONS.find((s) => s.value === filterStore.sortBy)?.label ||
                                "Most Popular"}
                        </span>
                    </Select.Trigger>
                    <Select.Content>
                        {#each SORT_OPTIONS.filter((o) => !o.value.includes("revenue")) as option}
                            <Select.Item value={option.value} label={option.label}>
                                {option.label}
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>

                <div class="bg-border mx-2 h-6 w-px"></div>

                <FilterPopover onApply={applyFilters} />
                {#if filterStore.hasActiveFilters}
                    <Button variant="ghost" size="sm" onclick={clearFilters} class="gap-1">
                        <XIcon class="size-4" />
                        Clear
                    </Button>
                {/if}
            </div>
        </div>
    </div>

    {#if Array.isArray(searchStore.results) && searchStore.results.length > 0}
        <div class="flex flex-wrap gap-4">
            {#each searchStore.results as item (item.id)}
                <div>
                    <ListItem data={item} indexer={item.indexer} type="tv" />
                </div>
            {/each}
            {#if searchStore.loading}
                {#each Array(6) as _, i (i)}
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
        <div class="flex flex-wrap gap-4">
            {#each Array(12) as _, i (i)}
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
            <p class="text-muted-foreground">No shows found</p>
            <Button variant="outline" size="sm" onclick={clearFilters}>Clear Filters</Button>
        </div>
    {/if}
    <div bind:this={loadMoreTrigger}></div>
</div>
