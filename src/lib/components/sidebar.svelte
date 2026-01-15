<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { authClient } from "$lib/auth-client";
    import NotificationCenter from "$lib/components/notification-center.svelte";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { getInitials } from "$lib/utils";
    import { resolve } from "$app/paths";
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
    import ThemeSwitcher from "./theme-switcher.svelte";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import type { createSidebarStore } from "$lib/stores/global.svelte";

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/library", icon: Library, label: "Library" },
        { href: "/explore", icon: Search, label: "Explore" },
        { href: "/calendar", icon: CalendarDays, label: "Calendar" },
        { href: "/auth", icon: User, label: "Profile" },
        { href: "/settings", icon: Settings, label: "Settings" },
        { href: "/logs", icon: FileClock, label: "Logs" }
    ] as const;

    let { user } = $props();

    const SidebarStore = getContext<ReturnType<typeof createSidebarStore>>("sidebarStore");
</script>

<aside
    class="bg-background/40 top-0 left-0 z-50 hidden h-screen w-14 flex-col items-center border-r border-white/5 backdrop-blur-md md:flex">
    <div class="flex h-18 w-full items-center justify-center">
        <div class="text-primary flex items-center justify-center">
            <Mountain class="size-5" />
        </div>
    </div>
    <nav class="mt-4 flex flex-col items-center gap-3.5" aria-label="Main Navigation">
        {#each navItems as item (item.href)}
            <Tooltip>
                {#snippet trigger()}
                    <a
                        data-sveltekit-preload-data={item.label === "Settings" ? "off" : "hover"}
                        href={resolve(item.href)}
                        class="hover:bg-accent/80 group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors"
                        class:bg-accent={page.url.pathname === resolve(item.href)}
                        aria-label={item.label}
                        aria-current={page.url.pathname === resolve(item.href)
                            ? "page"
                            : undefined}>
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
        <NotificationCenter
            variant="ghost"
            side="right"
            align="end"
            class="hover:bg-accent/80 group rounded-md transition-colors" />
        <ThemeSwitcher />
        {#if user}
            <Tooltip>
                {#snippet trigger()}
                    <a href={resolve("/auth")} class="cursor-pointer" aria-label="Profile">
                        <Avatar.Root>
                            {#if user.image}
                                <Avatar.Image src={user.image} alt={user.name} />
                            {/if}
                            <Avatar.Fallback class="bg-primary text-primary-foreground">
                                {getInitials(user.name)}
                            </Avatar.Fallback>
                        </Avatar.Root>
                    </a>
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
                                goto(resolve("/auth/login"));
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
            <a href={resolve("/auth/login")} class="cursor-pointer" aria-label="Login">
                <Avatar.Root>
                    <Avatar.Fallback class="bg-primary text-primary-foreground">
                        {getInitials("Guest")}
                    </Avatar.Fallback>
                </Avatar.Root>
            </a>
        {/if}
    </div>
</aside>

{#if SidebarStore.isOpen}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        onclick={() => SidebarStore.toggle()}
        role="button"
        tabindex="0"
        onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                SidebarStore.toggle();
            }
        }}
        class="fixed inset-0 z-40 cursor-default md:hidden">
    </div>

    <!-- Pop-out Menu -->
    <div
        transition:fly={{ y: 10, duration: 200, easing: cubicOut }}
        class="fixed right-4 bottom-24 z-50 flex w-72 origin-bottom-right flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden">
        <div class="p-3">
            {#if user}
                <div class="mb-4 flex items-center justify-between px-2">
                    <a
                        href={resolve("/auth")}
                        class="flex items-center gap-3"
                        onclick={() => SidebarStore.toggle()}>
                        <Avatar.Root class="size-8">
                            {#if user.image}
                                <Avatar.Image src={user.image} alt={user.name} />
                            {/if}
                            <Avatar.Fallback class="bg-primary text-primary-foreground text-xs">
                                {getInitials(user.name)}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <p class="text-foreground/90 text-sm font-medium">
                            {user.username}
                        </p>
                    </a>

                    <div class="flex items-center gap-1">
                        <ThemeSwitcher />
                        <Button
                            onclick={async () => {
                                await authClient.signOut({
                                    fetchOptions: {
                                        onSuccess: () => {
                                            goto(resolve("/auth/login"));
                                        }
                                    }
                                });
                            }}
                            variant="ghost"
                            size="icon"
                            class="text-muted-foreground hover:text-foreground size-8 rounded-full hover:bg-white/10"
                            aria-label="Logout">
                            <LogOut class="size-4" />
                        </Button>
                    </div>
                </div>
            {:else}
                <div class="mb-4 flex items-center gap-3 px-2">
                    <Avatar.Root class="size-8">
                        <Avatar.Fallback class="bg-primary text-primary-foreground">
                            {getInitials("Guest")}
                        </Avatar.Fallback>
                    </Avatar.Root>
                    <p class="text-sm font-medium">Guest</p>
                </div>
            {/if}

            <nav class="flex flex-col gap-1" aria-label="Mobile Navigation">
                {#each navItems as item (item.href)}
                    <a
                        href={resolve(item.href)}
                        onclick={() => SidebarStore.toggle()}
                        class="hover:text-foreground flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10
						{page.url.pathname === resolve(item.href) ? 'text-primary bg-white/10' : 'text-muted-foreground'}"
                        aria-current={page.url.pathname === resolve(item.href)
                            ? "page"
                            : undefined}>
                        <item.icon class="size-4" />
                        <span>{item.label}</span>
                    </a>
                {/each}
            </nav>
        </div>
    </div>
{/if}
