<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { authClient } from "$lib/auth-client";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Drawer from "$lib/components/ui/drawer/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { cn } from "$lib/utils";
    import CalendarDays from "@lucide/svelte/icons/calendar-days";
    import FileClock from "@lucide/svelte/icons/file-clock";
    import Home from "@lucide/svelte/icons/home";
    import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
    import LogOut from "@lucide/svelte/icons/log-out";
    import Mountain from "@lucide/svelte/icons/mountain";
    import Settings from "@lucide/svelte/icons/settings";
    import Search from "@lucide/svelte/icons/search";
    import Library from "@lucide/svelte/icons/library";
    import User from "@lucide/svelte/icons/user";
    import { getContext } from "svelte";
    import Tooltip from "./tooltip.svelte";

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/library", icon: Library, label: "Library" },
        { href: "/explore", icon: Search, label: "Explore" },
        { href: "/calendar", icon: CalendarDays, label: "Calendar" },
        { href: "/auth", icon: User, label: "Profile" },
        { href: "/settings", icon: Settings, label: "Settings" },
        { href: "/logs", icon: FileClock, label: "Logs" }
    ];

    let { user } = $props();

    const SidebarStore: any = getContext("sidebarStore");
    const isMobileStore: any = getContext("ismobilestore");
</script>

<aside
    class="bg-opacity-75 top-0 left-0 z-5 hidden h-screen w-14 flex-col items-center bg-transparent backdrop-blur-sm md:flex">
    <div class="flex h-18 w-full items-center justify-center">
        <div class="text-primary flex items-center justify-center">
            <Mountain class="size-5" />
        </div>
    </div>
    <nav class="mt-4 flex flex-col items-center gap-3.5">
        {#each navItems as item (item.href)}
            <Tooltip>
                {#snippet trigger()}
                    <a
                        href={item.href}
                        class="hover:bg-accent/80 group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors"
                        class:bg-accent={page.url.pathname === item.href}
                        aria-label={item.label}>
                        <item.icon class="size-5" />
                    </a>
                {/snippet}
                {#snippet content()}
                    <p>
                        {item.label}
                    </p>
                {/snippet}
            </Tooltip>
        {/each}
    </nav>

    <div class="mt-auto flex flex-col items-center gap-3.5 pb-4">
        {#if user}
            <Tooltip>
                {#snippet trigger()}
                    <Avatar.Root class="cursor-pointer">
                        <Avatar.Image
                            src={user.image || "https://avatar.iran.liara.run/public"}
                            alt={user.name} />
                        <Avatar.Fallback>CN</Avatar.Fallback>
                    </Avatar.Root>
                {/snippet}
                {#snippet content()}
                    <p class="font-medium">
                        {user.name}
                    </p>
                {/snippet}
            </Tooltip>

            <Button
                onclick={async () => {
                    await authClient.signOut({
                        fetchOptions: {
                            onSuccess: () => {
                                goto("/auth/login");
                            }
                        }
                    });
                }}
                variant="ghost"
                size="icon"
                class="size-10 cursor-pointer rounded-md"
                aria-label="Logout">
                <LogOut class="size-5" />
            </Button>
        {:else}
            <Avatar.Root class="cursor-pointer">
                <Avatar.Image src="https://avatar.iran.liara.run/public" alt="@guest" />
                <Avatar.Fallback>G</Avatar.Fallback>
            </Avatar.Root>
        {/if}
    </div>
</aside>

<Drawer.Root bind:open={SidebarStore.isOpen}>
    <Drawer.Trigger class="hidden"></Drawer.Trigger>
    <Drawer.Content>
        <Drawer.Header class="flex flex-row items-center justify-between">
            {#if user}
                <div class="flex items-center gap-2">
                    <Avatar.Root class="cursor-poiter">
                        <Avatar.Image
                            src={user.image || "https://avatar.iran.liara.run/public"}
                            alt={user.username} />
                        <Avatar.Fallback>CN</Avatar.Fallback>
                    </Avatar.Root>
                    <p class="font-medium">
                        {user.username}
                    </p>
                </div>

                <Button
                    onclick={async () => {
                        await authClient.signOut({
                            fetchOptions: {
                                onSuccess: () => {
                                    goto("/auth/login");
                                }
                            }
                        });
                    }}
                    variant="ghost"
                    size="icon"
                    class="size-10 rounded-md"
                    aria-label="Logout">
                    <Drawer.Close class="text-muted-foreground">
                        <LogOut class="h-5 w-5" />
                    </Drawer.Close>
                </Button>
            {:else}
                <div class="flex items-center gap-2">
                    <Avatar.Root class="cursor-pointer">
                        <Avatar.Image src="https://avatar.iran.liara.run/public" alt="@guest" />
                        <Avatar.Fallback>G</Avatar.Fallback>
                    </Avatar.Root>
                    <p class="font-medium">Guest</p>
                </div>
            {/if}
        </Drawer.Header>

        <Separator class="my-2" />
        <nav class="mb-8 flex flex-col items-start gap-2">
            {#each navItems as item}
                <Drawer.Close
                    onclick={() => {
                        goto(item.href);
                    }}
                    class="w-full">
                    <span
                        class="flex w-full items-center gap-2 px-4 py-2 text-sm
						{cn('hover:bg-accent/80 transition-colors', page.url.pathname === item.href && 'bg-accent')}"
                        aria-label={item.label}>
                        <item.icon class="size-5" />
                        <span>{item.label}</span>
                    </span>
                </Drawer.Close>
            {/each}
        </nav>
    </Drawer.Content>
</Drawer.Root>
