<script lang="ts">
    import Menu from "@lucide/svelte/icons/menu";
    import { Button } from "$lib/components/ui/button/index.js";
    import NotificationCenter from "$lib/components/notification-center.svelte";
    import { getContext } from "svelte";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import Search from "@lucide/svelte/icons/search";
    import * as Kbd from "$lib/components/ui/kbd/index.js";
    import * as InputGroup from "$lib/components/ui/input-group/index.js";
    import { parseSearchQuery } from "$lib/search-parser";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";

    const SidebarStore: any = getContext("sidebarStore");
    const searchStore: any = getContext("searchStore");

    let searchValue = $state("");

    async function handleSearchSubmit(event: KeyboardEvent) {
        if (event.key === "Enter") {
            await handleSearch();
        }
    }

    async function handleSearch() {
        if (searchValue.trim()) {
            const parsed = parseSearchQuery(searchValue);

            // Store search state
            if (searchStore) {
                searchStore.setSearch(searchValue, parsed);
            }

            if (page.url.pathname === "/search") {
                    await searchStore.search();
            } else {
                // Navigate to search page with query parameter
                const searchParams = new URLSearchParams({ q: searchValue });
                await goto(`/search?${searchParams.toString()}`, { invalidateAll: true });
            }
        }
    }
</script>

<header
    class="absolute z-10 flex h-18 w-full items-center bg-transparent px-2 md:left-14 md:w-[calc(100%-3.5rem)] md:px-4">
    <div class="flex w-full items-center justify-between gap-2">
        <form method="GET" action="/explore" class="w-full">
            <ButtonGroup.Root class="bg-opacity-75 h-9 w-full backdrop-blur-sm">
                <InputGroup.Root>
                    <InputGroup.Input name="query" placeholder="Search..." />
                    <InputGroup.Addon align="inline-end">
                        <Kbd.Root>^K</Kbd.Root>
                    </InputGroup.Addon>
                </InputGroup.Root>

                <Button type="submit" variant="outline" size="icon" aria-label="Search">
                    <Search />
                </Button>
            </ButtonGroup.Root>
        </form>

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
