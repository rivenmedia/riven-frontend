<script lang="ts">
    import { getContext } from "svelte";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import * as Select from "$lib/components/ui/select/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Slider } from "$lib/components/ui/slider/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Toggle } from "$lib/components/ui/toggle/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import {
        FilterStore,
        MOVIE_GENRES,
        TV_GENRES,
        CONTENT_RATINGS,
        LANGUAGE_OPTIONS,
        RUNTIME_CONFIG,
        VOTE_AVERAGE_CONFIG,
        VOTE_COUNT_CONFIG
    } from "$lib/services/filter-store.svelte";
    import { SearchStore } from "$lib/services/search-store.svelte";
    import FilterIcon from "@lucide/svelte/icons/filter";
    import DatePicker from "$lib/components/date-picker.svelte";

    interface Props {
        onApply: () => void;
    }

    let { onApply }: Props = $props();

    const filterStore = getContext<FilterStore>("filterStore");
    const searchStore = getContext<SearchStore>("searchStore");

    if (!filterStore) {
        throw new Error("FilterPopover must be used within a context that provides 'filterStore'.");
    }

    if (!searchStore) {
        throw new Error("FilterPopover must be used within a context that provides 'searchStore'.");
    }

    // Get genres based on media type
    let availableGenres = $derived(
        searchStore.mediaType === "tv"
            ? TV_GENRES
            : searchStore.mediaType === "movie"
              ? MOVIE_GENRES
              : Array.from(new Map([...MOVIE_GENRES, ...TV_GENRES].map((g) => [g.id, g])).values())
    );

    // Slider states - derived from store for two-way sync
    let runtimeRange = $derived([filterStore.runtimeMin, filterStore.runtimeMax]);
    let voteAverageRange = $derived([filterStore.voteAverageMin, filterStore.voteAverageMax]);
    let voteCountRange = $derived([filterStore.voteCountMin, filterStore.voteCountMax]);

    // Handlers to update store when sliders change
    function onRuntimeChange(value: number[]) {
        filterStore.runtimeMin = value[0];
        filterStore.runtimeMax = value[1];
    }
    function onVoteAverageChange(value: number[]) {
        filterStore.voteAverageMin = value[0];
        filterStore.voteAverageMax = value[1];
    }
    function onVoteCountChange(value: number[]) {
        filterStore.voteCountMin = value[0];
        filterStore.voteCountMax = value[1];
    }

    function handleApply() {
        filterStore.isOpen = false;
        onApply();
    }

    function handleClear() {
        filterStore.reset();
    }
</script>

<Popover.Root bind:open={filterStore.isOpen}>
    <Popover.Trigger>
        {#snippet child({ props })}
            <Button variant="outline" size="sm" class="gap-2" {...props}>
                <FilterIcon class="size-4" />
                Filters
                {#if filterStore.activeFilterCount > 0}
                    <Badge variant="secondary" class="px-1.5 py-0 text-xs">
                        {filterStore.activeFilterCount}
                    </Badge>
                {/if}
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content
        class="bg-popover max-h-[80vh] w-96 overflow-y-auto rounded-2xl border-none shadow-2xl shadow-black/50"
        align="end">
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <h4 class="font-semibold">Filters</h4>
                {#if filterStore.hasActiveFilters}
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={handleClear}
                        class="h-7 px-2 text-xs">
                        Clear all
                    </Button>
                {/if}
            </div>

            <Separator />

            <!-- Release Date -->
            <div class="space-y-2">
                <span class="text-sm font-medium">Release Date</span>
                <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1">
                        <span class="text-muted-foreground text-xs">From</span>
                        <DatePicker
                            bind:value={filterStore.releaseDateFrom}
                            placeholder="Pick a date" />
                    </div>
                    <div class="space-y-1">
                        <span class="text-muted-foreground text-xs">To</span>
                        <DatePicker
                            bind:value={filterStore.releaseDateTo}
                            placeholder="Pick a date" />
                    </div>
                </div>
            </div>

            <Separator />

            <!-- Genres -->
            <div class="space-y-2">
                <span class="text-sm font-medium">Genres</span>
                <div class="flex flex-wrap gap-1">
                    {#each availableGenres as genre}
                        <Toggle
                            size="sm"
                            variant="outline"
                            class="h-7 px-2 text-xs"
                            pressed={filterStore.withGenres.includes(genre.id)}
                            onPressedChange={() => filterStore.toggleGenre(genre.id)}>
                            {genre.name}
                        </Toggle>
                    {/each}
                </div>
            </div>

            <Separator />

            <!-- Language -->
            <div class="space-y-2">
                <span class="text-sm font-medium">Language</span>
                <Select.Root
                    type="single"
                    value={filterStore.withOriginalLanguage || undefined}
                    onValueChange={(v) => (filterStore.withOriginalLanguage = v || "")}>
                    <Select.Trigger class="h-8 text-xs">
                        {LANGUAGE_OPTIONS.find((l) => l.value === filterStore.withOriginalLanguage)
                            ?.label || "All Languages"}
                    </Select.Trigger>
                    <Select.Content
                        class="bg-popover rounded-2xl border-none shadow-2xl shadow-black/50">
                        {#each LANGUAGE_OPTIONS as lang}
                            <Select.Item value={lang.value} label={lang.label} class="text-xs">
                                {lang.label}
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>

            <!-- Content Rating (Movies only) -->
            {#if searchStore.mediaType === "movie"}
                <Separator />
                <div class="space-y-2">
                    <span class="text-sm font-medium">Content Rating</span>
                    <div class="flex flex-wrap gap-1">
                        {#each CONTENT_RATINGS as rating}
                            <Toggle
                                size="sm"
                                variant="outline"
                                class="h-7 px-2 text-xs"
                                pressed={filterStore.certifications.includes(rating)}
                                onPressedChange={() => filterStore.toggleCertification(rating)}>
                                {rating}
                            </Toggle>
                        {/each}
                    </div>
                </div>
            {/if}

            <Separator />

            <!-- Runtime -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">Runtime</span>
                    <span class="text-muted-foreground text-xs">
                        {runtimeRange[0]}-{runtimeRange[1]} min
                    </span>
                </div>
                <Slider
                    type="multiple"
                    value={runtimeRange}
                    onValueChange={onRuntimeChange}
                    {...RUNTIME_CONFIG} />
            </div>

            <Separator />

            <!-- User Score -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">User Score</span>
                    <span class="text-muted-foreground text-xs">
                        {voteAverageRange[0]}-{voteAverageRange[1]}
                    </span>
                </div>
                <Slider
                    type="multiple"
                    value={voteAverageRange}
                    onValueChange={onVoteAverageChange}
                    {...VOTE_AVERAGE_CONFIG} />
            </div>

            <Separator />

            <!-- Vote Count -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">Vote Count</span>
                    <span class="text-muted-foreground text-xs">
                        {voteCountRange[0]}-{voteCountRange[1]}
                    </span>
                </div>
                <Slider
                    type="multiple"
                    value={voteCountRange}
                    onValueChange={onVoteCountChange}
                    {...VOTE_COUNT_CONFIG} />
            </div>

            <Separator />

            <!-- Actions -->
            <div class="flex gap-2">
                <Button variant="outline" size="sm" class="flex-1" onclick={handleClear}>
                    Clear
                </Button>
                <Button size="sm" class="flex-1" onclick={handleApply}>Apply</Button>
            </div>
        </div>
    </Popover.Content>
</Popover.Root>
