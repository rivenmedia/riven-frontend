<script lang="ts">
    import Menu from "@lucide/svelte/icons/menu";
    import { Button } from "$lib/components/ui/button/index.js";
    import NotificationCenter from "$lib/components/notification-center.svelte";
    import { Input } from "$lib/components/ui/input/index.js";
    import { getContext } from "svelte";
    import { parseSearchQuery } from "$lib/tmdb-search-parser";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";

    const isMobileStore: any = getContext("ismobilestore");
    const SidebarStore: any = getContext("sidebarStore");
    const searchStore: any = getContext("searchStore");

    let searchValue = $state("");

    function handleSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        searchValue = target.value;
    }

    async function handleSearchSubmit(event: KeyboardEvent) {
        if (event.key === "Enter" && searchValue.trim()) {
            const parsed = parseSearchQuery(searchValue);

            // Store search state and trigger search
            if (searchStore) {
                searchStore.setSearch(searchValue, parsed);

                // If we're already on the search page, trigger search directly
                if ($page.url.pathname === "/search") {
                    await searchStore.search();
                } else {
                    // Navigate to search results page
                    await goto("/search");
                }
            }
        }
    }
</script>

<header
    class="absolute z-10 flex h-18 w-full items-center bg-transparent px-2 md:left-14 md:w-[calc(100%-3.5rem)] md:px-4">
    <div class="flex w-full items-center justify-between gap-2">
        <Input
            type="text"
            placeholder="Search... (e.g., hello y:2025 g:sci-fi)"
            class="bg-opacity-75 h-9 backdrop-blur-sm"
            bind:value={searchValue}
            oninput={handleSearchInput}
            onkeydown={handleSearchSubmit}
        />

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
