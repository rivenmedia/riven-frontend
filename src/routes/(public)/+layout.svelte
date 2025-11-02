<script lang="ts">
    import "@fontsource/oxanium/300.css";
    import "@fontsource/oxanium/400.css";
    import "@fontsource/oxanium/500.css";
    import "@fontsource/oxanium/600.css";
    import "@fontsource/oxanium/700.css";
    import "@fontsource/jetbrains-mono";
    import "@fontsource/merriweather";
    import oxanium400Woff2 from "@fontsource/oxanium/files/oxanium-latin-400-normal.woff2?url";

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
    <link
        rel="preload"
        as="font"
        type="font/woff2"
        href={oxanium400Woff2}
        crossorigin="anonymous" />
</svelte:head>

<ModeWatcher defaultMode={"dark"} defaultTheme={"darkmatter"} />
<Toaster richColors closeButton />

<div class="bg-background h-screen overflow-hidden">
    {@render children?.()}
</div>
