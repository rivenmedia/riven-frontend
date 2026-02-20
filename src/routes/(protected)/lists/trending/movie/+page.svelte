<script lang="ts">
    import { getContext } from "svelte";
    import ListItem from "$lib/components/list-item.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import PortraitCardSkeleton from "$lib/components/media/portrait-card-skeleton.svelte";
    import { onMount } from "svelte";
    import { SearchStore } from "$lib/services/search-store.svelte";
    import { FilterStore, SORT_OPTIONS } from "$lib/services/filter-store.svelte";
    import FilterPopover from "$lib/components/filter-popover.svelte";
    import * as Select from "$lib/components/ui/select/index.js";
    import XIcon from "@lucide/svelte/icons/x";
    import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
    import PageShell from "$lib/components/page-shell.svelte";

    let searchStore = getContext<SearchStore>("searchStore");
    let filterStore = getContext<FilterStore>("filterStore");
    let loadMoreTrigger = $state<HTMLDivElement | null>(null);

    let isTriggerVisible = $state(false);

    onMount(() => {
        // Initialize as a discovery page for movies
        searchStore.mediaType = "movie";
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
            const timer = setTimeout(() => {
                searchStore.loadMore();
            }, 500);
            return () => clearTimeout(timer);
        }
    });

    function applyFilters() {
        const params = filterStore.buildParams("movie");
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
    <title>Trending Movies - Riven</title>
</svelte:head>

<PageShell class="bg-background relative flex min-h-screen flex-col overflow-x-hidden">
    <!-- Immersive Background -->
    <div class="pointer-events-none fixed inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black"></div>
        <div
            class="bg-primary/5 absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full blur-[120px]">
        </div>
        <div
            class="absolute right-[-5%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px]">
        </div>
    </div>

    <div
        class="relative z-10 mx-auto flex w-full max-w-[2400px] flex-col gap-6 px-6 pt-6 pb-24 md:px-12 md:pt-16 md:pb-12 lg:px-16">
        <div class="flex flex-col gap-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <h1
                    class="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
                    Trending Movies
                </h1>

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
                        <Select.Content
                            class="bg-popover rounded-2xl border-none shadow-2xl shadow-black/50">
                            {#each SORT_OPTIONS.filter( (o) => (o.allowedFor as unknown as string[]).includes("movie") ) as option (option.value)}
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
            <div
                class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
                {#each searchStore.results as item (item.id)}
                    <div class="aspect-[2/3] w-full">
                        <ListItem data={item} indexer={item.indexer} type="movie" />
                    </div>
                {/each}
                {#if searchStore.loading}
                    {#each [...Array(6).keys()] as i (i)}
                        <div class="aspect-[2/3] w-full">
                            <PortraitCardSkeleton />
                        </div>
                    {/each}
                {/if}
            </div>
        {:else if searchStore.loading}
            <div
                class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
                {#each [...Array(12).keys()] as i (i)}
                    <div class="aspect-[2/3] w-full">
                        <PortraitCardSkeleton />
                    </div>
                {/each}
            </div>
        {:else}
            <div class="flex flex-col items-center justify-center gap-2 py-16">
                <p class="text-muted-foreground">No movies found</p>
                {#if filterStore.hasActiveFilters}
                    <Button variant="outline" size="sm" onclick={clearFilters}
                        >Clear Filters</Button>
                {/if}
            </div>
        {/if}
        <div bind:this={loadMoreTrigger}></div>
    </div>
</PageShell>
