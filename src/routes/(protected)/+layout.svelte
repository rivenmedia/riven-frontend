<script lang="ts">
    import "@fontsource/oxanium/300.css";
    import "@fontsource/oxanium/400.css";
    import "@fontsource/oxanium/500.css";
    import "@fontsource/oxanium/600.css";
    import "@fontsource/oxanium/700.css";
    import "@fontsource/jetbrains-mono/latin.css";
    import "@fontsource/merriweather/latin.css";
    import oxanium400Woff2 from "@fontsource/oxanium/files/oxanium-latin-400-normal.woff2?url";

    import { afterNavigate, onNavigate, beforeNavigate } from "$app/navigation";
    import Sidebar from "$lib/components/sidebar.svelte";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { Toaster } from "$lib/components/ui/sonner/index.js";
    import { ModeWatcher } from "mode-watcher";
    import NProgress from "nprogress";
    import "../../app.css";
    import type { LayoutProps } from "./$types";
    import { SidebarStore, isMobileStore } from "$lib/stores/global.svelte";
    import { setContext } from "svelte";
    import Header from "$lib/components/header.svelte";
    import { SearchStore } from "$lib/services/search-store.svelte";
    import { FilterStore } from "$lib/services/filter-store.svelte";

    let { data, children }: LayoutProps = $props();

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
    });

    setContext("sidebarStore", SidebarStore);
    setContext("ismobilestore", isMobileStore);
    setContext("searchStore", searchStore);
    setContext("filterStore", filterStore);
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

<ModeWatcher defaultMode={"dark"} defaultTheme={"darkmatter"} />
<Toaster richColors closeButton />

<div
    class="bg-background relative grid h-screen w-screen grid-cols-1 overflow-hidden md:grid-cols-[auto_1fr]">
    <Sidebar user={data.user} />
    <main class="relative overflow-hidden">
        <div
            class="size-full overflow-x-hidden overflow-y-scroll"
            style="scrollbar-gutter: stable;">
            <Header />
            {@render children?.()}
        </div>
    </main>
</div>
