<script lang="ts">
    import Menu from "@lucide/svelte/icons/menu";
    import X from "@lucide/svelte/icons/x";
    import { Button } from "$lib/components/ui/button/index.js";
    import NotificationCenter from "$lib/components/notification-center.svelte";
    import { getContext, onDestroy } from "svelte";
    import Search from "@lucide/svelte/icons/search";
    import * as InputGroup from "$lib/components/ui/input-group/index.js";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { createSidebarStore } from "$lib/stores/global.svelte";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    const SidebarStore = getContext<createSidebarStore>("sidebarStore");

    let inputRef = $state<HTMLInputElement | null>(null);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function navigateToSearch() {
        if (debounceTimer) clearTimeout(debounceTimer);
        const query = inputRef?.value.trim() || "";
        const currentlyExplore = $page.url.pathname === "/explore";
        goto(query ? `/explore?query=${encodeURIComponent(query)}` : "/explore", {
            keepFocus: currentlyExplore,
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
</script>

<div
    transition:fly={{ y: 20, duration: 400, easing: cubicOut }}
    class="from-background via-background/80 fixed right-0 bottom-0 left-0 z-[60] flex h-24 items-end justify-between gap-3 bg-gradient-to-t to-transparent px-6 pb-6 md:hidden">
    <div class="flex-1">
        <InputGroup.Root
            class="text-foreground placeholder:text-muted-foreground h-10 w-full rounded-full bg-neutral-800/80 transition-all focus-within:bg-neutral-700/80 focus-within:ring-2 focus-within:ring-white/20">
            <InputGroup.Addon align="inline-start">
                <Search class="text-muted-foreground ml-1 size-4" />
            </InputGroup.Addon>
            <InputGroup.Input
                bind:ref={inputRef}
                name="query"
                placeholder="Search..."
                aria-label="Search"
                value={$page.url.searchParams.get("query") || ""}
                oninput={handleInput}
                onkeydown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        navigateToSearch();
                    }
                }}
                class="text-foreground placeholder:text-muted-foreground/70 text-sm font-medium"
                autocomplete="off" />
        </InputGroup.Root>
    </div>

    <div class="flex items-center gap-1">
        <NotificationCenter
            variant="ghost"
            side="top"
            align="end"
            class="text-foreground/80 hover:text-foreground size-10 rounded-full transition-all hover:bg-white/10" />

        <Button
            variant="ghost"
            class="text-foreground/80 hover:text-foreground size-10 rounded-full transition-all hover:bg-white/10"
            onclick={() => SidebarStore.toggle()}>
            {#if SidebarStore.isOpen}
                <X class="size-5" />
            {:else}
                <Menu class="size-5" />
            {/if}
        </Button>
    </div>
</div>
