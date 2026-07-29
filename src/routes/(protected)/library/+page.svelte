<script lang="ts">
    /* eslint-disable svelte/no-navigation-without-resolve */
    import { tick, onDestroy } from "svelte";
    import { page } from "$app/state";
    import type { PageProps } from "./$types";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import * as Form from "$lib/components/ui/form/index.js";
    import type { Component } from "svelte";
    import { superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { Input } from "$lib/components/ui/input/index.js";

    import ListItem from "$lib/components/list-item.svelte";
    import { itemsSearchSchema } from "$lib/schemas/items";
    import Trash from "@lucide/svelte/icons/trash";
    import Search from "@lucide/svelte/icons/search";
    import X from "@lucide/svelte/icons/x";
    import { Button } from "$lib/components/ui/button/index.js";
    import ListChecks from "@lucide/svelte/icons/list-checks";
    import * as Select from "$lib/components/ui/select/index.js";
    import { ItemStore } from "$lib/stores/library-items.svelte";
    import { reset_items, retry_items, remove_items } from "./library.remote";
    import * as Pagination from "$lib/components/ui/pagination/index.js";
    import Loading2Circle from "@lucide/svelte/icons/loader-2";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import PageShell from "$lib/components/page-shell.svelte";
    import { cn } from "$lib/utils";
    import { subscribeToRivenMediaEvents } from "$lib/services/riven-live-updates";
    import { gqlClient } from "$lib/graphql-client";
    import * as dateUtils from "$lib/utils/date";

    type PageDataPayload = NonNullable<Awaited<PageProps["data"]["pageData"]>>;
    type LibraryItem = PageDataPayload["items"][number];
    type GqlMediaItem = {
        id: number;
        itemType: string;
        title: string;
        tmdbId?: string | null;
        tvdbId?: string | null;
        parentId?: number | null;
        posterPath?: string | null;
        airedAt?: string | null;
        seasonNumber?: number | null;
        episodeNumber?: number | null;
        showId?: number | null;
        showTitle?: string | null;
        showTmdbId?: string | null;
        showTvdbId?: string | null;
        showPosterPath?: string | null;
    };
    type GqlItemsPage = {
        items: GqlMediaItem[];
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };

    let { data }: PageProps = $props();
    let liveItems = $state<LibraryItem[]>([]);
    let liveLimit = $state(20);
    let liveTotalItems = $state(0);
    let typeOptions = $state<{ value: string; label: string }[]>([]);
    let stateOptions = $state<{ value: string; label: string }[]>([]);

    // svelte-ignore state_referenced_locally
    const form = superForm(data.itemsSearchForm, {
        validators: zod4Client(itemsSearchSchema),
        resetForm: false
    });

    const { form: formData } = form;

    const itemsStore = new ItemStore();

    let actionInProgress = $state(false);
    let formElement: HTMLFormElement;

    const ITEMS_QUERY = `
        query GetItems(
            $page: Int
            $limit: Int
            $sort: String
            $types: [MediaItemType!]
            $search: String
            $states: [MediaItemState!]
        ) {
            items(page: $page, limit: $limit, sort: $sort, types: $types, search: $search, states: $states) {
                items {
                    id
                    itemType
                    title
                    tmdbId
                    tvdbId
                    parentId
                    posterPath
                    airedAt
                    seasonNumber
                    episodeNumber
                    showId
                    showTitle
                    showTmdbId
                    showTvdbId
                    showPosterPath
                }
                page
                limit
                totalItems
                totalPages
            }
        }
    `;

    // Live Search Logic
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    function search() {
        const url = new URL(page.url);

        if ($formData.search) {
            url.searchParams.set("search", $formData.search);
        } else {
            url.searchParams.delete("search");
        }

        url.searchParams.delete("type");
        if ($formData.type?.length) {
            $formData.type.forEach((t) => url.searchParams.append("type", t));
        }

        url.searchParams.delete("states");
        if ($formData.states?.length) {
            $formData.states.forEach((s) => url.searchParams.append("states", s));
        }

        // Reset to page 1 on search/filter change
        url.searchParams.set("page", "1");
        $formData.page = 1;

        const libraryPath = resolve("/library");
        goto(url.search ? `${libraryPath}${url.search}` : libraryPath, {
            keepFocus: true,
            noScroll: true
        });
    }

    function handleSearchInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(search, 300);
    }

    onDestroy(() => {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    });

    function selectedOptionLabels(
        values: string[] | undefined,
        options: { value: string; label: string }[],
        fallback: string
    ) {
        if (!values?.length) {
            return fallback;
        }

        const labels = values
            .map((value) => options.find((option) => option.value === value)?.label)
            .filter((label): label is string => label !== undefined);

        return labels.length > 0 ? labels.join(", ") : fallback;
    }

    function extractYear(airedAt: string | null | undefined): number | string {
        if (!airedAt) return "N/A";
        return dateUtils.getYearFromISO(airedAt) ?? "N/A";
    }

    function transformItems(items: GqlMediaItem[]): LibraryItem[] {
        return items.map((item) => {
            const rawType = item.itemType.toLowerCase();
            let id: string | number | null = null;
            let indexer: "tmdb" | "tvdb" = "tmdb";
            let mediaPageType = rawType === "show" ? "tv" : rawType;
            let posterPath = item.posterPath;
            const detailParams: string[] = [];

            if (rawType === "movie") {
                id = item.tmdbId ?? null;
            } else if (rawType === "show") {
                id = item.tvdbId ?? null;
                indexer = "tvdb";
            } else if (rawType === "season" || rawType === "episode") {
                id = item.showTvdbId ?? item.showTmdbId ?? null;
                indexer = item.showTvdbId ? "tvdb" : "tmdb";
                mediaPageType = "tv";
                posterPath = item.showPosterPath ?? item.posterPath;
                if (item.seasonNumber != null) {
                    detailParams.push(`season=${encodeURIComponent(item.seasonNumber)}`);
                }
                if (item.episodeNumber != null) {
                    detailParams.push(`episode=${encodeURIComponent(item.episodeNumber)}`);
                }
            }

            return {
                id,
                title: item.title,
                poster_path: posterPath,
                media_type: mediaPageType,
                year: extractYear(item.airedAt),
                indexer,
                type: mediaPageType,
                details_query: detailParams.join("&"),
                badge:
                    rawType === "season"
                        ? { text: "Season", variant: "default" }
                        : rawType === "episode"
                          ? { text: "Episode", variant: "default" }
                          : undefined,
                riven_id: item.id
            } satisfies LibraryItem;
        });
    }

    async function refreshLiveLibrary() {
        const types = $formData.type?.length
            ? $formData.type.map((type) => type.toUpperCase())
            : undefined;
        const states = $formData.states?.filter((state) => state !== "All");
        const result = await gqlClient<{ items: GqlItemsPage }>(ITEMS_QUERY, {
            page: $formData.page ?? 1,
            limit: $formData.limit ?? liveLimit,
            sort:
                (Array.isArray($formData.sort) ? $formData.sort[0] : $formData.sort) ?? "date_desc",
            types,
            search: $formData.search || undefined,
            states: states && states.length > 0 ? states : undefined
        });

        liveItems = transformItems(result.items.items);
        liveLimit = result.items.limit;
        liveTotalItems = result.items.totalItems;
    }

    // Resolve the streamed Promise from the server load into local state.
    $effect(() => {
        let cancelled = false;

        data.pageData?.then((d) => {
            if (cancelled || !d) return;
            liveItems = d.items;
            liveLimit = d.limit;
            liveTotalItems = d.totalItems;
            typeOptions = d.typeOptions;
            stateOptions = d.stateOptions;
        });

        return () => {
            cancelled = true;
        };
    });

    $effect(() => {
        return subscribeToRivenMediaEvents(refreshLiveLibrary);
    });
</script>

<!-- Immersive Background -->
<div class="pointer-events-none fixed inset-0 z-0">
    <div class="absolute inset-0 bg-linear-to-b from-zinc-900 via-zinc-950 to-black"></div>
    <div class="bg-primary/5 absolute top-[-20%] left-[-10%] h-150 w-150 rounded-full blur-[120px]">
    </div>
    <div
        class="absolute right-[-5%] bottom-[-10%] h-125 w-125 rounded-full bg-blue-500/5 blur-[100px]">
    </div>
</div>

<PageShell class="relative z-10 flex min-h-screen flex-col overflow-x-hidden bg-transparent">
    <div class="relative z-10 mx-auto flex w-full max-w-600 flex-col gap-8">
        <!-- Header Section -->
        <header class="flex flex-col justify-between gap-6 pt-32 md:flex-row md:items-end md:pt-0">
            <div class="space-y-2">
                <h1
                    class="font-serif text-5xl font-medium tracking-tight text-white/90 md:text-7xl">
                    Library
                </h1>
                <div class="flex items-center gap-2 text-zinc-400">
                    <span class="font-mono text-xs tracking-widest uppercase">Index</span>
                    <span class="h-px w-8 bg-zinc-800"></span>
                    <span class="text-primary font-mono text-sm"
                        >{liveTotalItems.toLocaleString()} items</span>
                </div>
            </div>

            <!-- Compact Filter Bar -->
            <form
                method="GET"
                bind:this={formElement}
                class="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-2 shadow-2xl backdrop-blur-md md:gap-3">
                <!-- Search Input -->
                <div class="group relative">
                    <Search
                        class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-white" />
                    <Form.Field {form} name="search" class="w-full space-y-0 md:w-64">
                        <Form.Control>
                            {#snippet children({ props })}
                                <Input
                                    {...props}
                                    bind:value={$formData.search}
                                    placeholder="Search..."
                                    oninput={handleSearchInput}
                                    class="h-10 rounded-xl border-transparent bg-transparent pl-9 transition-all placeholder:text-zinc-600 hover:bg-white/5 focus:bg-white/10" />
                            {/snippet}
                        </Form.Control>
                    </Form.Field>
                </div>

                <div class="mx-1 hidden h-6 w-px bg-white/10 md:block"></div>

                <!-- Filters -->
                <Form.Field {form} name="type" class="min-w-25 space-y-0">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Select.Root
                                type="multiple"
                                bind:value={$formData.type}
                                onValueChange={async () => {
                                    await tick();
                                    search();
                                }}
                                name={props.name}>
                                <Select.Trigger
                                    {...props}
                                    class="h-9 border-0 bg-transparent text-zinc-400 hover:bg-white/5 data-value:text-white data-[state=open]:bg-white/10">
                                    {selectedOptionLabels($formData.type, typeOptions, "Type")}
                                </Select.Trigger>
                                <Select.Content class="border-zinc-800 bg-zinc-900">
                                    {#each typeOptions as option (option.value)}
                                        <Select.Item value={option.value} label={option.label} />
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {/snippet}
                    </Form.Control>
                </Form.Field>

                <Form.Field {form} name="states" class="min-w-25 space-y-0">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Select.Root
                                type="multiple"
                                bind:value={$formData.states}
                                onValueChange={async () => {
                                    await tick();
                                    search();
                                }}
                                name={props.name}>
                                <Select.Trigger
                                    {...props}
                                    class="h-9 border-0 bg-transparent text-zinc-400 hover:bg-white/5 data-value:text-white data-[state=open]:bg-white/10">
                                    {selectedOptionLabels($formData.states, stateOptions, "State")}
                                </Select.Trigger>
                                <Select.Content class="border-zinc-800 bg-zinc-900">
                                    {#each stateOptions as option (option.value)}
                                        <Select.Item value={option.value} label={option.label} />
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {/snippet}
                    </Form.Control>
                </Form.Field>
                <!-- Hidden inputs for pagination -->
                <input type="hidden" name="page" value={$formData.page} />
                <input type="hidden" name="limit" value={$formData.limit} />
            </form>
        </header>

        <!-- Content Grid -->
        {#if liveTotalItems > 0}
            <div
                class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {#each liveItems as item, i (item.riven_id)}
                    <div
                        class="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-700"
                        style="animation-delay: {i * 30}ms">
                        <ListItem
                            data={item}
                            indexer={item.indexer}
                            type={item.type}
                            isSelectable
                            selectStore={itemsStore}
                            class="aspect-2/3 w-full" />
                    </div>
                {/each}
            </div>

            <!-- Pagination -->
            <div class="flex justify-center pt-12 pb-24">
                <Pagination.Root
                    count={liveTotalItems}
                    perPage={liveLimit}
                    bind:page={$formData.page}>
                    {#snippet children({ pages, currentPage })}
                        <Pagination.Content>
                            <Pagination.Item>
                                <Pagination.PrevButton
                                    onclick={async () => {
                                        await tick();
                                        formElement.requestSubmit();
                                    }}
                                    class="border-white/10 hover:bg-white/10" />
                            </Pagination.Item>
                            {#each pages as page (page.key)}
                                {#if page.type === "ellipsis"}
                                    <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
                                {:else}
                                    <Pagination.Item>
                                        <Pagination.Link
                                            {page}
                                            isActive={currentPage === page.value}
                                            onclick={async () => {
                                                await tick();
                                                formElement.requestSubmit();
                                            }}
                                            class="data-selected:bg-primary data-selected:text-primary-foreground border-transparent hover:bg-white/10">
                                            {page.value}
                                        </Pagination.Link>
                                    </Pagination.Item>
                                {/if}
                            {/each}
                            <Pagination.Item>
                                <Pagination.NextButton
                                    onclick={async () => {
                                        await tick();
                                        formElement.requestSubmit();
                                    }}
                                    class="border-white/10 hover:bg-white/10" />
                            </Pagination.Item>
                        </Pagination.Content>
                    {/snippet}
                </Pagination.Root>
            </div>
        {:else}
            <div
                class="flex min-h-[50vh] flex-1 flex-col items-center justify-center space-y-4 text-center">
                <div
                    class="flex h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-zinc-900/50">
                    <Search class="h-10 w-10 text-zinc-600" />
                </div>
                <div>
                    <h3 class="text-xl font-medium text-white">No items found</h3>
                    <p class="mx-auto mt-2 max-w-sm text-zinc-500">
                        We couldn't find anything matching your search. Try adjusting the filters or
                        search term.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onclick={() => goto(resolve("/library"))}
                    class="border-white/10 hover:bg-white/5">
                    Clear all filters
                </Button>
            </div>
        {/if}

        <!-- Floating Selection Bar -->
        {#if itemsStore.count > 0}
            <div
                transition:fly={{ y: 100, duration: 400, easing: cubicOut }}
                class="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-3xl border border-white/10 bg-zinc-900/80 p-2 pl-4 shadow-2xl backdrop-blur-xl">
                <div class="mr-4 flex items-center gap-3">
                    <div
                        class="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold">
                        {itemsStore.count}
                    </div>
                    <span class="text-sm font-medium text-zinc-300">Selected</span>
                </div>

                <div class="mx-1 h-8 w-px bg-white/10"></div>

                <div class="flex items-center gap-1">
                    {#snippet actionButton(
                        label: string,
                        icon: { component: Component },
                        onClick: () => Promise<void>,
                        variant: "default" | "destructive" = "default"
                    )}
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionInProgress}
                            onclick={onClick}
                            class={cn(
                                "h-9 gap-2 rounded-xl px-3 transition-all",
                                variant === "destructive"
                                    ? "hover:bg-red-500/20 hover:text-red-400"
                                    : "hover:bg-white/10"
                            )}>
                            {#if actionInProgress}
                                <Loading2Circle class="h-3.5 w-3.5 animate-spin" />
                            {:else}
                                <icon.component class="h-3.5 w-3.5" />
                            {/if}
                            {label}
                        </Button>
                    {/snippet}

                    <!-- Actions -->
                    {@render actionButton("Reset", { component: ListChecks }, async () => {
                        actionInProgress = true;
                        try {
                            const result = await reset_items({
                                ids: itemsStore.items.map((id) => id.toString())
                            });
                            if (result.count > 0) {
                                toast.success(`Reset ${result.count} items`);
                            } else {
                                toast.info("No matching items were reset");
                            }
                            itemsStore.clear();
                            await refreshLiveLibrary();
                        } catch (e) {
                            if (e instanceof Error) toast.error(`Error: ${e.message}`);
                            else toast.error("An unknown error occurred");
                        } finally {
                            actionInProgress = false;
                        }
                    })}

                    {@render actionButton("Retry", { component: Loading2Circle }, async () => {
                        actionInProgress = true;
                        try {
                            const result = await retry_items({
                                ids: itemsStore.items.map((id) => id.toString())
                            });
                            if (result.count > 0) {
                                toast.success(`Marked ${result.count} items for retry`);
                            } else {
                                toast.info("No matching items were marked for retry");
                            }
                            itemsStore.clear();
                            await refreshLiveLibrary();
                        } catch (e) {
                            if (e instanceof Error) toast.error(`Error: ${e.message}`);
                            else toast.error("An unknown error occurred");
                        } finally {
                            actionInProgress = false;
                        }
                    })}

                    {@render actionButton(
                        "Remove",
                        { component: Trash },
                        async () => {
                            actionInProgress = true;
                            try {
                                await remove_items({
                                    ids: itemsStore.items.map((id) => id.toString())
                                });
                                toast.success(`Removed ${itemsStore.count} items`);
                                itemsStore.clear();
                                await refreshLiveLibrary();
                            } catch (e) {
                                if (e instanceof Error) toast.error(`Error: ${e.message}`);
                                else toast.error("An unknown error occurred");
                            } finally {
                                actionInProgress = false;
                            }
                        },
                        "destructive"
                    )}

                    <div class="mx-1 h-8 w-px bg-white/10"></div>

                    <Button
                        variant="ghost"
                        size="icon"
                        class="h-9 w-9 rounded-xl hover:bg-white/10"
                        onclick={() => itemsStore.clear()}>
                        <X class="h-4 w-4" />
                    </Button>
                </div>
            </div>
        {/if}
    </div>
</PageShell>

<style>
    .fill-mode-backwards {
        animation-fill-mode: backwards;
    }
</style>
