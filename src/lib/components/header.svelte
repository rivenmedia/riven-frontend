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
    import type { createSidebarStore } from "$lib/stores/global.svelte";

    const SidebarStore = getContext<createSidebarStore>("sidebarStore");

    // Detect modifier key client-side only to avoid hydration mismatch
    let modifierKey = $state<string | null>(null);

    onMount(() => {
        const platform = (
            (navigator.userAgentData?.platform ?? navigator.platform) ||
            ""
        ).toUpperCase();
        modifierKey = platform.includes("MAC") ? "⌘" : "^";
    });

    // Removed local searchQuery state and its effect sync
    let inputRef = $state<HTMLInputElement | null>(null);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function navigateToSearch() {
        if (debounceTimer) clearTimeout(debounceTimer);
        // Read directly from the input element via ref
        const query = inputRef?.value.trim() || "";
        const currentlyExplore = $page.url.pathname === "/explore";
        goto(query ? `/explore?query=${encodeURIComponent(query)}` : "/explore", {
            keepFocus: true,
            noScroll: true,
            replaceState: currentlyExplore
        });
    }

    function handleInput() {
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
    class="pointer-events-none absolute top-0 left-0 z-50 flex h-14 w-full items-center bg-transparent px-2 md:px-4">
    <div class="pointer-events-auto flex w-full items-center justify-between gap-2">
        <div class="w-full">
            <ButtonGroup.Root class="bg-background/60 h-9 w-full rounded-lg backdrop-blur-md">
                <InputGroup.Root>
                    <InputGroup.Input
                        bind:ref={inputRef}
                        name="query"
                        placeholder="Search..."
                        value={$page.url.searchParams.get("query") || ""}
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

        <div class="flex items-center gap-1">
            <NotificationCenter />

            <Button
                variant="ghost"
                class="text-foreground hover:bg-muted size-10 rounded-md md:hidden"
                onclick={() => SidebarStore.toggle()}>
                <Menu class="size-5" />
            </Button>
        </div>
    </div>
</header>
<svelte:document onkeydown={onKeydown} />
