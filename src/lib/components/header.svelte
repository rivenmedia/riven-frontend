<script lang="ts">
    import Menu from "@lucide/svelte/icons/menu";
    import { Button } from "$lib/components/ui/button/index.js";
    import NotificationCenter from "$lib/components/notification-center.svelte";
    import { getContext, onDestroy, onMount } from "svelte";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import Search from "@lucide/svelte/icons/search";
    import * as Kbd from "$lib/components/ui/kbd/index.js";
    import * as InputGroup from "$lib/components/ui/input-group/index.js";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";

    const SidebarStore: any = getContext("sidebarStore");

    // Detect modifier key client-side only to avoid hydration mismatch
    let modifierKey = $state<string | null>(null);

    onMount(() => {
        const platform = (
            (navigator.userAgentData?.platform ?? navigator.platform) ||
            ""
        ).toUpperCase();
        modifierKey = platform.includes("MAC") ? "⌘" : "^";
    });

    let searchQuery = $state("");
    let inputFocused = $state(false);
    let inputRef = $state<HTMLInputElement | null>(null);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const isExplorePage = $derived($page.url.pathname === "/explore");
    const urlQuery = $derived($page.url.searchParams.get("query") || "");

    // Sync search query with URL when not typing
    $effect(() => {
        if (isExplorePage && !inputFocused) {
            searchQuery = urlQuery;
        }
    });

    function navigateToSearch() {
        if (debounceTimer) clearTimeout(debounceTimer);
        const query = searchQuery.trim();
        const currentlyExplore = $page.url.pathname === "/explore";
        goto(query ? `/explore?query=${encodeURIComponent(query)}` : "/explore", {
            keepFocus: true,
            noScroll: true,
            replaceState: currentlyExplore
        });
    }

    function handleInput(e: Event) {
        searchQuery = (e.target as HTMLInputElement).value;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(navigateToSearch, 300);
    }

    onDestroy(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
    });

    function onKeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            inputRef?.focus();
        }
    }
</script>

<header
    class="absolute z-10 flex h-18 w-full items-center bg-transparent px-2 md:left-14 md:w-[calc(100%-3.5rem)] md:px-4">
    <div class="flex w-full items-center justify-between gap-2">
        <div class="w-full">
            <ButtonGroup.Root class="bg-opacity-75 h-9 w-full backdrop-blur-sm">
                <InputGroup.Root>
                    <InputGroup.Input
                        bind:ref={inputRef}
                        name="query"
                        placeholder="Search..."
                        value={searchQuery}
                        oninput={handleInput}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                navigateToSearch();
                            }
                        }}
                        onfocus={() => (inputFocused = true)}
                        onblur={() => (inputFocused = false)}
                        autocomplete="off" />
                    {#if modifierKey}
                        <InputGroup.Addon align="inline-end">
                            <Kbd.Root>{modifierKey}K</Kbd.Root>
                        </InputGroup.Addon>
                    {/if}
                </InputGroup.Root>

                <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    aria-label="Search"
                    onclick={() => {
                        navigateToSearch();
                        inputRef?.focus();
                    }}>
                    <Search />
                </Button>
            </ButtonGroup.Root>
        </div>

        <div class="flex items-center">
            <NotificationCenter />

            <Button
                variant="ghost"
                class="size-10 rounded-md text-white hover:bg-white/10 md:hidden"
                onclick={() => SidebarStore.toggle()}>
                <Menu class="size-5" />
            </Button>
        </div>
    </div>
</header>
<svelte:document onkeydown={onKeydown} />
