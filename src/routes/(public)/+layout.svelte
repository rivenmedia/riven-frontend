<script lang="ts">
    import { afterNavigate, beforeNavigate } from "$app/navigation";

    import { Toaster } from "$lib/components/ui/sonner/index.js";
    import { ModeWatcher } from "mode-watcher";
    import NProgress from "nprogress";
    import "../../app.css";
    import type { LayoutProps } from "./$types";

    let { children }: LayoutProps = $props();

    beforeNavigate(() => {
        NProgress.start();
    });
    afterNavigate(() => {
        NProgress.done();
    });
    NProgress.configure({
        showSpinner: false
    });
</script>

<svelte:head>
    <title>Riven</title>
</svelte:head>

<ModeWatcher defaultMode={"dark"} defaultTheme={"darkmatter"}/>
<Toaster richColors closeButton />

<div class="bg-background h-screen overflow-hidden">
    {@render children?.()}
</div>
