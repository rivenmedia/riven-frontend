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
    import type { TMDBTransformedListItem } from "$lib/providers/parser";

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
    let query = $state("");
    let results = $state<TMDBTransformedListItem[]>([]);
    let loading = $state(false);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let abortController: AbortController | null = null;

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
        debounceTimer = setTimeout(search, 300);
    }

    async function search() {
        const q = query.trim();
        if (!q) {
            results = [];
            loading = false;
            return;
        }

        if (abortController) abortController.abort();
        abortController = new AbortController();
        const signal = abortController.signal;

        loading = true;
        try {
            const params = new URLSearchParams({ query: q, searchMode: "search", page: "1" });
            const [movieRes, tvRes] = await Promise.all([
                fetch(`/api/tmdb/search/movie?${params}`, { signal }),
                fetch(`/api/tmdb/search/tv?${params}`, { signal })
            ]);

            if (signal.aborted) return;

            const [movies, tv] = await Promise.all([
                movieRes.ok ? movieRes.json() : { results: [] },
                tvRes.ok ? tvRes.json() : { results: [] }
            ]);

            if (signal.aborted) return;

            const merged: TMDBTransformedListItem[] = [
                ...(movies.results ?? []),
                ...(tv.results ?? [])
            ].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

            results = merged;
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            results = [];
        } finally {
            if (!signal.aborted) loading = false;
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
            requestAnimationFrame(() => { skipTransition = false; });
            return;
        }
        if (navigation.type === 'popstate' && navigatedFromModal && savedQuery) {
            navigatedFromModal = false;
            skipTransition = true;
            reopenFromNav();
            requestAnimationFrame(() => { skipTransition = false; });
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
        class="fixed inset-0 z-[70] bg-zinc-950/98 backdrop-blur-xl"
        role="presentation">
    </div>

    <!-- Modal Content -->
    <div
        transition:fly={{ y: skipTransition ? 0 : 20, duration: skipTransition ? 0 : 300, easing: cubicOut }}
        class="fixed inset-0 z-[71] flex flex-col overflow-hidden"
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
                onclick={clearAndClose}
                aria-label="Close search"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95">
                <X class="size-5" />
            </button>
        </div>

        <!-- Results -->
        <div class="flex-1 overflow-y-auto">
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
                            onclick={() => handleResultClick(item)}
                            class="block w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-[0.97] transition-transform duration-150">
                            <PortraitCard
                                title={item.title}
                                subtitle={getSubtitle(item)}
                                image={item.poster_path} />
                        </button>
                    {/each}
                </div>
            {:else if query.trim() && !loading}
                <div class="flex flex-col items-center justify-center gap-2 py-24 text-center">
                    <p class="text-white/60 text-base font-medium">No results found</p>
                    <p class="text-white/30 text-sm">Try a different search term</p>
                </div>
            {:else}
                <div class="flex flex-col items-center justify-center gap-2 py-24 text-center">
                    <Search class="size-8 text-white/20" />
                    <p class="text-white/40 text-sm">Start typing to search</p>
                </div>
            {/if}
        </div>
    </div>
{/if}
