<script lang="ts">
    import Menu from "@lucide/svelte/icons/menu";
    import X from "@lucide/svelte/icons/x";
    import { Button } from "$lib/components/ui/button/index.js";
    import NotificationCenter from "$lib/components/notification-center.svelte";
    import { getContext, onDestroy } from "svelte";
    import Search from "@lucide/svelte/icons/search";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import type { createSidebarStore } from "$lib/stores/global.svelte";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import type { SearchStore } from "$lib/services/search-store.svelte";
    import { parseSearchQuery } from "$lib/search-parser";
    import { perfCount } from "$lib/perf";
    import { afterNavigate } from "$app/navigation";

    const SidebarStore = getContext<createSidebarStore>("sidebarStore");
    const searchStore = getContext<SearchStore>("searchStore");

    let inputRef = $state<HTMLInputElement | null>(null);
    let inputValue = $state("");
    let localSearchDebounceTimer: ReturnType<typeof setTimeout> | undefined;
    let urlNavigationDebounceTimer: ReturnType<typeof setTimeout> | undefined;

    const LOCAL_SEARCH_DEBOUNCE_MS = 150;
    const URL_NAVIGATION_DEBOUNCE_MS = 600;

    // Sync URL changes to input
    afterNavigate(() => {
        const urlQuery = page.url.searchParams.get("query") || "";
        if (urlQuery !== inputValue && inputRef !== document.activeElement) {
            inputValue = urlQuery;
        }
    });

    function applyLocalSearch(query: string) {
        const currentlyExplore = page.url.pathname === "/explore";
        if (currentlyExplore) {
            const parsed = parseSearchQuery(query);
            searchStore.syncQuery(parsed);
            perfCount("explore.search.local_sync.mobile", 1, { queryLength: query.length });
        }
    }

    async function navigateToSearch(force = false) {
        clearTimeout(localSearchDebounceTimer);
        clearTimeout(urlNavigationDebounceTimer);

        const query = inputValue.trim();
        const currentlyExplore = page.url.pathname === "/explore";
        const currentQuery = page.url.searchParams.get("query") || "";

        applyLocalSearch(query);

        if (!force && currentlyExplore && query === currentQuery) {
            return;
        }

        /* eslint-disable svelte/no-navigation-without-resolve */
        await goto(query ? `/explore?query=${encodeURIComponent(query)}` : "/explore", {
            keepFocus: true,
            noScroll: true,
            replaceState: currentlyExplore
        });
        /* eslint-enable svelte/no-navigation-without-resolve */
    }

    function handleInput() {
        clearTimeout(localSearchDebounceTimer);
        clearTimeout(urlNavigationDebounceTimer);

        const query = inputValue.trim();

        localSearchDebounceTimer = setTimeout(() => {
            applyLocalSearch(query);
        }, LOCAL_SEARCH_DEBOUNCE_MS);

        urlNavigationDebounceTimer = setTimeout(() => {
            void navigateToSearch(false);
        }, URL_NAVIGATION_DEBOUNCE_MS);
    }

    onDestroy(() => {
        clearTimeout(localSearchDebounceTimer);
        clearTimeout(urlNavigationDebounceTimer);
    });
</script>

<div
    transition:fly={{ y: 20, duration: 400, easing: cubicOut }}
    class="fixed right-0 bottom-6 left-0 z-[60] flex justify-center px-4 md:hidden">
    <!-- Unified Pill Container -->
    <div
        class="flex h-11 w-full max-w-md items-center gap-2 rounded-full border border-white/5 bg-white/5 p-1 pl-4 shadow-lg backdrop-blur-xl transition-all duration-300 focus-within:border-white/10 focus-within:bg-black/40 focus-within:ring-1 focus-within:ring-white/20 hover:bg-white/10">
        <!-- Search Icon -->
        <Search class="size-4 shrink-0 text-white/50" />

        <!-- Input -->
        <input
            bind:this={inputRef}
            name="query"
            placeholder="Search..."
            aria-label="Search"
            bind:value={inputValue}
            oninput={handleInput}
            onkeydown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    void navigateToSearch(true);
                }
            }}
            class="text-foreground h-full flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-white/40"
            autocomplete="off" />

        <!-- Actions Divider -->
        <div class="h-5 w-px bg-white/10"></div>

        <!-- Actions -->
        <div class="flex items-center gap-0.5 pr-0.5">
            <NotificationCenter
                variant="ghost"
                side="top"
                align="end"
                sideOffset={20}
                class="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white" />

            <Button
                variant="ghost"
                size="icon"
                class="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white"
                onclick={() => SidebarStore.toggle()}>
                <div class="relative flex size-5 items-center justify-center">
                    <div
                        class="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out"
                        class:opacity-0={SidebarStore.isOpen}
                        class:rotate-90={SidebarStore.isOpen}
                        class:scale-0={SidebarStore.isOpen}>
                        <Menu class="size-5" />
                    </div>
                    <div
                        class="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out"
                        class:opacity-0={!SidebarStore.isOpen}
                        class:-rotate-90={!SidebarStore.isOpen}
                        class:scale-0={!SidebarStore.isOpen}>
                        <X class="size-5" />
                    </div>
                </div>
            </Button>
        </div>
    </div>
</div>
