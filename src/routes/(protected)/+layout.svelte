<script lang="ts">
    import { afterNavigate, beforeNavigate } from "$app/navigation";
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

    let { data, children }: LayoutProps = $props();

    beforeNavigate(() => {
        NProgress.start();
    });
    afterNavigate(() => {
        NProgress.done();
    });
    NProgress.configure({
        showSpinner: false
    });

    setContext("sidebarStore", SidebarStore);
    setContext("ismobilestore", isMobileStore);
</script>

<svelte:head>
    <title>Riven</title>
</svelte:head>

<ModeWatcher defaultMode={"dark"} />
<Toaster richColors closeButton />

<div
    class="bg-background relative grid h-screen w-screen grid-cols-1 overflow-hidden md:grid-cols-[auto_1fr]">
    <Sidebar user={data.user} />
    <main class="grid grid-rows-[auto_1fr] overflow-hidden">
        <Header />
        <div class="size-full overflow-x-hidden overflow-y-auto">
            {@render children?.()}
        </div>
    </main>
</div>
