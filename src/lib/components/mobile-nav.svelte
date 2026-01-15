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

    const SidebarStore = getContext<createSidebarStore>("sidebarStore");

    let inputRef = $state<HTMLInputElement | null>(null);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function navigateToSearch() {
        if (debounceTimer) clearTimeout(debounceTimer);
        const query = inputRef?.value.trim() || "";
        const currentlyExplore = page.url.pathname === "/explore";
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
            value={page.url.searchParams.get("query") || ""}
            oninput={handleInput}
            onkeydown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    navigateToSearch();
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
