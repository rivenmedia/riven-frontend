<script lang="ts">
    import Menu from "@lucide/svelte/icons/menu";
    import { Button } from "$lib/components/ui/button/index.js";
    import NotificationCenter from "$lib/components/notification-center.svelte";
    import { getContext, onMount } from "svelte";
    import Search from "@lucide/svelte/icons/search";
    import * as Kbd from "$lib/components/ui/kbd/index.js";
    import * as InputGroup from "$lib/components/ui/input-group/index.js";
    import { goto, afterNavigate } from "$app/navigation";
    import { page } from "$app/stores";
    import type { createSidebarStore } from "$lib/stores/global.svelte";
    import type { SearchStore } from "$lib/services/search-store.svelte";
    import { parseSearchQuery } from "$lib/search-parser";

    const SidebarStore = getContext<createSidebarStore>("sidebarStore");
    const searchStore = getContext<SearchStore>("searchStore");

    // Detect modifier key client-side only to avoid hydration mismatch
    let modifierKey = $state<string | null>(null);

    onMount(() => {
        const platform = (
            (navigator.userAgentData?.platform ?? navigator.platform) ||
            ""
        ).toUpperCase();
        modifierKey = platform.includes("MAC") ? "⌘" : "^";

        const handleSearch = (e: Event) => {
            const evt = e as CustomEvent<{ query: string }>;
            if (evt.detail.query) {
                inputValue = evt.detail.query;
                inputRef?.focus();
                navigateToSearch();
            }
        };

        window.addEventListener("riven:search", handleSearch);
        return () => window.removeEventListener("riven:search", handleSearch);
    });

    // Local input value state to decouple from URL updates while typing
    let inputValue = $state($page.url.searchParams.get("query") || "");
    let inputRef = $state<HTMLInputElement | null>(null);
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    // Sync external URL changes to input, but avoid overwriting while typing
    // We use afterNavigate instead of $effect to avoid state loops
    afterNavigate(() => {
        const urlQuery = $page.url.searchParams.get("query") || "";
        // Only update if the value is different and we aren't focused
        // Or if we just navigated to a completely different page/query via link
        if (urlQuery !== inputValue && inputRef !== document.activeElement) {
            inputValue = urlQuery;
        }
    });

    async function navigateToSearch() {
        clearTimeout(debounceTimer);
        // Read directly from local state
        const query = inputValue.trim();
        const currentlyExplore = $page.url.pathname === "/explore";

        // Client-first search: Immediately update store if we're on the explore page
        // This avoids waiting for the server round-trip (goto -> load -> data -> effect)
        // and fixes reactivity issues when typing quickly.
        if (currentlyExplore) {
            const parsed = parseSearchQuery(query);
            searchStore.syncQuery(parsed);
        }

        await goto(query ? `/explore?query=${encodeURIComponent(query)}` : "/explore", {
            keepFocus: true,
            noScroll: true,
            replaceState: currentlyExplore
        });
    }

    function handleInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(navigateToSearch, 300);
    }

    $effect(() => {
        return () => clearTimeout(debounceTimer);
    });

    function onKeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            inputRef?.focus();
        }
    }
</script>

<header
    class="pointer-events-none absolute top-0 left-0 z-50 hidden h-14 w-full items-center bg-transparent px-4 md:flex md:px-16">
    <div class="pointer-events-auto flex w-full items-center justify-between gap-4">
        <div class="mx-auto w-full max-w-sm">
            <InputGroup.Root
                class="bg-background/60 h-10 w-full rounded-xl backdrop-blur-md transition-all focus-within:w-full md:focus-within:max-w-md">
                <InputGroup.Addon align="inline-start">
                    <Search />
                </InputGroup.Addon>
                <InputGroup.Input
                    bind:ref={inputRef}
                    name="query"
                    placeholder="Search..."
                    aria-label="Search"
                    bind:value={inputValue}
                    oninput={handleInput}
                    onkeydown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            navigateToSearch();
                        }
                    }}
                    autocomplete="off" />
                {#if modifierKey}
                    <InputGroup.Addon align="inline-end">
                        <Kbd.Root>{modifierKey}K</Kbd.Root>
                    </InputGroup.Addon>
                {/if}
            </InputGroup.Root>
        </div>

        <div class="flex items-center gap-2">
            <div class="md:hidden">
                <NotificationCenter class="bg-background/60 rounded-xl backdrop-blur-md" />
            </div>

            <Button
                variant="ghost"
                class="bg-background/60 size-10 rounded-xl backdrop-blur-md md:hidden"
                onclick={() => SidebarStore.toggle()}>
                <Menu class="size-5" />
            </Button>
        </div>
    </div>
</header>
<svelte:document onkeydown={onKeydown} />
