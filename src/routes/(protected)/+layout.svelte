<script lang="ts">
    import "@fontsource/oxanium/300.css";
    import "@fontsource/oxanium/500.css";
    import "@fontsource/oxanium/600.css";
    import oxanium400Woff2 from "@fontsource/oxanium/files/oxanium-latin-400-normal.woff2?url";
    import { afterNavigate, beforeNavigate } from "$app/navigation";
    import Sidebar from "$lib/components/sidebar.svelte";
    import { Toaster } from "$lib/components/ui/sonner/index.js";
    import NProgress from "nprogress";
    import type { LayoutProps } from "./$types";
    import { SidebarStore, isMobileStore } from "$lib/stores/global.svelte";
    import { setContext } from "svelte";
    import Header from "$lib/components/header.svelte";
    import MobileNav from "$lib/components/mobile-nav.svelte";
    import { SearchStore } from "$lib/services/search-store.svelte";
    import { FilterStore } from "$lib/services/filter-store.svelte";
    import { page } from "$app/state";

    let { data, children }: LayoutProps = $props();

    let mainContent = $state<HTMLElement | null>(null);

    const searchStore = new SearchStore();
    const filterStore = new FilterStore();

    NProgress.configure({
        showSpinner: false
    });
    beforeNavigate(() => {
        NProgress.start();
    });
    afterNavigate(() => {
        NProgress.done();
        if (mainContent) mainContent.scrollTop = 0;
    });

    setContext("sidebarStore", SidebarStore);
    setContext("ismobilestore", isMobileStore);
    setContext("searchStore", searchStore);
    setContext("filterStore", filterStore);

    const isSetupRoute = $derived(page.url.pathname === "/setup");
</script>

<svelte:head>
    <title>Riven</title>
    <link
        rel="preload"
        as="font"
        type="font/woff2"
        href={oxanium400Woff2}
        crossorigin="anonymous" />
</svelte:head>

<Toaster richColors closeButton />

{#if isSetupRoute}
    <main class="bg-background h-screen w-screen overflow-hidden">
        <div
            bind:this={mainContent}
            class="size-full overflow-x-hidden overflow-y-auto"
            style="scrollbar-gutter: stable;">
            {@render children?.()}
        </div>
    </main>
{:else}
    <div
        class="bg-background relative grid h-screen w-screen grid-cols-1 overflow-hidden md:grid-cols-[auto_1fr]">
        <Sidebar user={data.user} />
        <main class="relative overflow-hidden">
            <div
                bind:this={mainContent}
                class="size-full overflow-x-hidden overflow-y-scroll"
                style="scrollbar-gutter: stable;">
                <Header />
                {@render children?.()}
            </div>
        </main>
        <MobileNav />
    </div>
{/if}
