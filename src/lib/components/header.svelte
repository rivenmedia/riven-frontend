<script lang="ts">
    import Menu from "@lucide/svelte/icons/menu";
    import { Button } from "$lib/components/ui/button/index.js";
    import NotificationCenter from "$lib/components/notification-center.svelte";
    import { Input } from "$lib/components/ui/input/index.js";
    import { getContext } from "svelte";

    const isMobileStore: any = getContext("ismobilestore");
    const SidebarStore: any = getContext("sidebarStore");
</script>

<header
    class="absolute z-10 flex h-18 w-full items-center bg-transparent px-2 md:left-14 md:w-[calc(100%-3.5rem)] md:px-4">
    <div class="flex w-full items-center justify-between gap-2">
        <Input type="text" placeholder="Search..." class="bg-opacity-75 h-9 backdrop-blur-sm" />

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
