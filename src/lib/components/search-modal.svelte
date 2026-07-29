<script lang="ts">
    import { goto, afterNavigate } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { onDestroy } from "svelte";
    import X from "@lucide/svelte/icons/x";
    import Search from "@lucide/svelte/icons/search";
    import PortraitCard from "$lib/components/media/portrait-card.svelte";
    import PortraitCardSkeleton from "$lib/components/media/portrait-card-skeleton.svelte";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import type { TMDBTransformedListItem } from "$lib/metadata/parser";
    import { gqlClient } from "$lib/graphql-client";
    import {
        mapGqlTmdbList,
        SEARCH_TMDB_PAGE_QUERY,
        type GqlTmdbListItem
    } from "$lib/services/backend-metadata";

    interface Props {
        open: boolean;
        onclose: () => void;
        onopen: () => void;
    }

    let { open, onclose, onopen }: Props = $props();

    function reopenFromNav() {
        onopen();
    }

    let inputRef = $state<HTMLInputElement | null>(null);
    let scrollContainer = $state<HTMLElement | null>(null);
    let query = $state("");
    let results = $state<TMDBTransformedListItem[]>([]);
    let loading = $state(false);
    let loadingMore = $state(false);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let abortController: AbortController | null = null;
    let currentPage = 1;
    let hasMorePages = true;
    let currentQuery = "";

    type SearchTmdbResponse = {
        searchTmdb: {
            results: GqlTmdbListItem[];
            page: number;
            totalPages: number;
            totalResults: number;
        };
    };

    onDestroy(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        abortController?.abort();
    });

    // Persist search state across navigation
    let savedQuery = "";
    let savedResults: TMDBTransformedListItem[] = [];
    let navigatedFromModal = false;
    // When true, skip transitions (instant hide/show for navigation)
    let skipTransition = $state(false);

    $effect(() => {
        if (open && inputRef) {
            // Restore previous search if available
            if (savedQuery && !query) {
                query = savedQuery;
                results = savedResults;
            }
            inputRef.focus();
        }
    });

    function handleInput() {
        if (debounceTimer) clearTimeout(debounceTimer);
        abortController?.abort();
        abortController = null;
        currentPage = 1;
        hasMorePages = true;
        debounceTimer = setTimeout(() => search(true), 300);
    }

    async function search(reset: boolean) {
        const q = query.trim();
        if (!q) {
            abortController?.abort();
            abortController = null;
            results = [];
            currentPage = 1;
            hasMorePages = true;
            currentQuery = "";
            loading = false;
            loadingMore = false;
            return;
        }

        if (reset) {
            currentPage = 1;
            hasMorePages = true;
            currentQuery = q;
        }

        if (!hasMorePages) return;

        if (abortController) abortController.abort();
        abortController = new AbortController();
        const signal = abortController.signal;

        if (reset) {
            loading = true;
        } else {
            loadingMore = true;
        }

        try {
            const searchParams = { query: q, page: String(currentPage) };
            const [movieData, tvData] = await Promise.all([
                gqlClient<SearchTmdbResponse>(
                    SEARCH_TMDB_PAGE_QUERY,
                    { type: "movie", params: searchParams, searchMode: "search" },
                    signal
                ).catch(() => null),
                gqlClient<SearchTmdbResponse>(
                    SEARCH_TMDB_PAGE_QUERY,
                    { type: "tv", params: searchParams, searchMode: "search" },
                    signal
                ).catch(() => null)
            ]);

            if (signal.aborted) return;

            const mapResults = (data: SearchTmdbResponse | null) =>
                mapGqlTmdbList(data?.searchTmdb.results ?? []);

            const maxTotalPages = Math.max(
                movieData?.searchTmdb.totalPages ?? 0,
                tvData?.searchTmdb.totalPages ?? 0
            );
            hasMorePages = currentPage < maxTotalPages;

            const merged: TMDBTransformedListItem[] = [
                ...mapResults(movieData),
                ...mapResults(tvData)
            ].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

            if (reset) {
                results = merged;
            } else {
                // Deduplicate by id+media_type
                const seen = new Set(results.map((r) => `${r.media_type}-${r.id}`));
                results = [
                    ...results,
                    ...merged.filter((r) => !seen.has(`${r.media_type}-${r.id}`))
                ];
            }
            currentPage++;
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            if (reset) results = [];
        } finally {
            if (!signal.aborted) {
                loading = false;
                loadingMore = false;
            }
        }
    }

    function handleScroll(e: Event) {
        const el = e.target as HTMLElement;
        if (loadingMore || loading || !hasMorePages || !currentQuery) return;
        // Load more when within 300px of bottom
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
            void search(false);
        }
    }

    let pendingNavigation = false;

    function handleResultClick(item: TMDBTransformedListItem) {
        savedQuery = query;
        savedResults = results;
        navigatedFromModal = true;
        pendingNavigation = true;
        // Keep modal open — it will be hidden after the new page loads
        goto(resolve(`/details/media/${item.id}/${item.media_type}`));
    }

    afterNavigate((navigation) => {
        if (pendingNavigation) {
            // New page loaded — now hide the modal instantly
            pendingNavigation = false;
            skipTransition = true;
            onclose();
            requestAnimationFrame(() => {
                skipTransition = false;
            });
            return;
        }
        if (navigation.type === "popstate" && navigatedFromModal && savedQuery) {
            navigatedFromModal = false;
            skipTransition = true;
            reopenFromNav();
            requestAnimationFrame(() => {
                skipTransition = false;
            });
        }
    });

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") clearAndClose();
    }

    function clearAndClose() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        abortController?.abort();
        abortController = null;
        savedQuery = "";
        savedResults = [];
        query = "";
        results = [];
        loading = false;
        loadingMore = false;
        currentPage = 1;
        hasMorePages = true;
        currentQuery = "";
        onclose();
    }

    function getSubtitle(item: TMDBTransformedListItem): string {
        const parts: string[] = [];
        if (item.media_type === "movie") parts.push("Movie");
        else if (item.media_type === "tv") parts.push("TV");
        if (item.year && item.year !== "N/A") parts.push(String(item.year));
        return parts.join(" • ");
    }
</script>

{#if open}
    <!-- Backdrop -->
    <div
        transition:fade={{ duration: skipTransition ? 0 : 200 }}
        class="fixed inset-0 z-70 bg-zinc-950/98 backdrop-blur-xl"
        role="presentation">
    </div>

    <!-- Modal Content -->
    <div
        transition:fly={{
            y: skipTransition ? 0 : 20,
            duration: skipTransition ? 0 : 300,
            easing: cubicOut
        }}
        class="fixed inset-0 z-71 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Search">
        <!-- Header -->
        <div class="flex shrink-0 items-center gap-3 border-b border-white/5 px-4 py-3">
            <Search class="size-4 shrink-0 text-white/50" />
            <!-- svelte-ignore a11y_autofocus -->
            <input
                bind:this={inputRef}
                bind:value={query}
                oninput={handleInput}
                onkeydown={handleKeydown}
                placeholder="Search movies & shows..."
                aria-label="Search"
                autocomplete="off"
                autofocus
                enterkeyhint="search"
                class="h-full flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/40" />
            <button
                type="button"
                onclick={clearAndClose}
                aria-label="Close search"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95">
                <X class="size-5" />
            </button>
        </div>

        <!-- Results -->
        <div bind:this={scrollContainer} onscroll={handleScroll} class="flex-1 overflow-y-auto">
            {#if loading}
                <div class="grid grid-cols-2 gap-3 px-4 pt-4 pb-24">
                    {#each Array.from({ length: 8 }, (_, i) => i) as i (i)}
                        <PortraitCardSkeleton />
                    {/each}
                </div>
            {:else if results.length > 0}
                <div class="grid grid-cols-2 gap-3 px-4 pt-4 pb-24">
                    {#each results as item (`${item.media_type}-${item.id}`)}
                        <button
                            type="button"
                            onclick={() => handleResultClick(item)}
                            class="block w-full rounded-xl text-left transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-[0.97]">
                            <PortraitCard
                                title={item.title}
                                subtitle={getSubtitle(item)}
                                image={item.poster_path} />
                        </button>
                    {/each}
                    {#if loadingMore}
                        {#each Array.from({ length: 4 }, (_, i) => i) as i (i)}
                            <PortraitCardSkeleton />
                        {/each}
                    {/if}
                </div>
            {:else if query.trim() && !loading}
                <div class="flex flex-col items-center justify-center gap-2 py-24 text-center">
                    <p class="text-base font-medium text-white/60">No results found</p>
                    <p class="text-sm text-white/30">Try a different search term</p>
                </div>
            {:else}
                <div class="flex flex-col items-center justify-center gap-2 py-24 text-center">
                    <Search class="size-8 text-white/20" />
                    <p class="text-sm text-white/40">Start typing to search</p>
                </div>
            {/if}
        </div>
    </div>
{/if}
