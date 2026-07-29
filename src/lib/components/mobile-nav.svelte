<script lang="ts">
    import Menu from "@lucide/svelte/icons/menu";
    import X from "@lucide/svelte/icons/x";
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import { Button } from "$lib/components/ui/button/index.js";
    import NotificationCenter from "$lib/components/notification-center.svelte";
    import SearchModal from "$lib/components/search-modal.svelte";
    import { getContext } from "svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import Search from "@lucide/svelte/icons/search";
    import { page } from "$app/state";
    import type { createSidebarStore } from "$lib/stores/global.svelte";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    const SidebarStore = getContext<createSidebarStore>("sidebarStore");

    const MAIN_PAGES = [
        "/",
        "/explore",
        "/dashboard",
        "/library",
        "/settings",
        "/calendar",
        "/logs",
        "/auth"
    ];

    const isMainPage = $derived(MAIN_PAGES.includes(page.url.pathname));

    let searchModalOpen = $state(false);
</script>

{#if !isMainPage}
    <button
        transition:fly={{ y: -20, duration: 400, easing: cubicOut }}
        onclick={() => {
            if (history.length > 1) {
                history.back();
            } else {
                goto(resolve("/"));
            }
        }}
        aria-label="Go back"
        class="fixed top-4 left-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-white/10 active:scale-95 md:hidden">
        <ChevronLeft class="size-5 text-white/70" />
    </button>
{/if}

<div
    transition:fly={{ y: 20, duration: 400, easing: cubicOut }}
    class="fixed right-0 bottom-6 left-0 z-[60] flex justify-center px-4 md:hidden">
    <!-- Unified Pill Container -->
    <div
        class="flex h-11 w-full max-w-md items-center gap-2 rounded-full border border-white/5 bg-white/5 p-1 pl-4 shadow-lg backdrop-blur-xl transition-all duration-300 focus-within:border-white/10 focus-within:bg-black/40 focus-within:ring-1 focus-within:ring-white/20 hover:bg-white/10">
        <!-- Search Icon -->
        <Search class="size-4 shrink-0 text-white/50" />

        <!-- Tap-to-search trigger -->
        <button
            onclick={() => (searchModalOpen = true)}
            aria-label="Open search"
            class="h-full flex-1 bg-transparent text-left text-sm font-medium text-white/40 outline-none">
            Search...
        </button>

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

<div class="md:hidden">
    <SearchModal
        open={searchModalOpen}
        onclose={() => (searchModalOpen = false)}
        onopen={() => (searchModalOpen = true)} />
</div>
