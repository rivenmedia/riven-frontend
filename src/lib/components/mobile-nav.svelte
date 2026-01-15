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
    class="fixed right-0 bottom-6 left-0 z-[60] flex justify-center px-4 md:hidden">
    <div
        class="flex w-full max-w-lg items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/80 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div class="flex-1">
            <InputGroup.Root
                class="text-foreground h-12 w-full rounded-xl bg-white/5 transition-all focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-white/20">
                <InputGroup.Addon align="inline-start" class="pl-3">
                    <Search class="text-muted-foreground size-5" />
                </InputGroup.Addon>
                <InputGroup.Input
                    bind:ref={inputRef}
                    name="query"
                    placeholder="Search movies, shows, people..."
                    aria-label="Search"
                    value={$page.url.searchParams.get("query") || ""}
                    oninput={handleInput}
                    onkeydown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            navigateToSearch();
                        }
                    }}
                    class="text-foreground placeholder:text-muted-foreground/60 h-full text-base font-medium"
                    autocomplete="off" />
            </InputGroup.Root>
        </div>

        <div class="flex h-12 items-center gap-1 border-l border-white/10 pl-2">
            <NotificationCenter
                variant="ghost"
                side="top"
                align="end"
                sideOffset={20}
                class="text-foreground/70 hover:text-foreground flex size-10 items-center justify-center rounded-xl transition-all hover:bg-white/10" />

            <Button
                variant="ghost"
                size="icon"
                class="text-foreground/70 hover:text-foreground flex size-10 items-center justify-center rounded-xl transition-all hover:bg-white/10"
                onclick={() => SidebarStore.toggle()}>
                <div class="relative flex size-6 items-center justify-center">
                    <div
                        class="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out"
                        class:opacity-0={SidebarStore.isOpen}
                        class:rotate-90={SidebarStore.isOpen}
                        class:scale-0={SidebarStore.isOpen}>
                        <Menu class="size-6" />
                    </div>
                    <div
                        class="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out"
                        class:opacity-0={!SidebarStore.isOpen}
                        class:-rotate-90={!SidebarStore.isOpen}
                        class:scale-0={!SidebarStore.isOpen}>
                        <X class="size-6" />
                    </div>
                </div>
            </Button>
        </div>
    </div>
</div>
