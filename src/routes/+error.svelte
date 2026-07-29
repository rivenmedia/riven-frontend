<script lang="ts">
    import { browser } from "$app/environment";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import ArrowLeft from "@lucide/svelte/icons/arrow-left";
    import Home from "@lucide/svelte/icons/home";
    import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
    import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
    import { fade, fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    const status = $derived(page.status);
    const message = $derived(page.error?.message || "Something went wrong");

    const title = $derived.by(() => {
        if (status === 404) return "Page not found";
        if (status === 400) return "Bad request";
        if (status === 401 || status === 403) return "Access denied";
        if (status >= 500) return "The backend hit turbulence";
        return "Unable to load page";
    });

    const detail = $derived.by(() => {
        if (status === 404) {
            return "The page or metadata record could not be found.";
        }
        if (status === 400) {
            return "The URL contains a value Riven cannot use.";
        }
        if (status === 401 || status === 403) {
            return "Your account does not have permission to view this page.";
        }
        if (status >= 500) {
            return "Riven could not finish this request. Try again, or check the backend logs if it keeps happening.";
        }
        return "Riven could not finish this request.";
    });

    function goBack() {
        if (browser && history.length > 1) {
            history.back();
        }
    }

    function reload() {
        if (browser) {
            location.reload();
        }
    }
</script>

<svelte:head>
    <title>{status} - Riven</title>
</svelte:head>

<div
    class="relative isolate flex min-h-[calc(100vh-4rem)] items-center overflow-hidden px-4 py-16 md:px-10">
    <div class="absolute inset-0 -z-10" in:fade|global={{ duration: 500, easing: cubicOut }}>
        <div class="bg-background absolute inset-0"></div>
        <div
            class="via-primary/50 absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent">
        </div>
        <div
            class="bg-primary/10 absolute top-1/4 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-[110px]">
        </div>
        <div class="bg-accent/10 absolute right-0 bottom-0 h-72 w-72 rounded-full blur-[120px]">
        </div>
    </div>

    <section
        class="mx-auto flex w-full max-w-4xl flex-col gap-8"
        in:fly|global={{ y: 18, duration: 450, easing: cubicOut }}>
        <div class="flex flex-col gap-5">
            <Badge
                variant="outline"
                class="border-primary/30 bg-primary/10 text-primary w-fit px-3 py-1 font-mono text-xs">
                <TriangleAlert class="size-3" />
                Error
            </Badge>

            <div
                class="font-heading text-foreground/90 font-mono text-[8rem] leading-none font-bold sm:text-[10rem]">
                {status}
            </div>

            <div>
                <h1
                    class="font-heading text-foreground text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                    {title}
                </h1>
                <div class="bg-primary mt-3 h-1 w-16 rounded-full"></div>
            </div>

            <div class="max-w-2xl space-y-3">
                <p class="text-muted-foreground text-base leading-7 md:text-lg">
                    {detail}
                </p>
                {#if message && message !== detail}
                    <p
                        class="border-border/50 bg-muted/20 text-muted-foreground rounded-lg border px-4 py-3 font-mono text-xs leading-5">
                        {message}
                    </p>
                {/if}
            </div>
        </div>

        <div class="flex flex-wrap gap-2">
            <Button variant="outline" onclick={goBack} disabled={!browser}>
                <ArrowLeft />
                Back
            </Button>
            <Button variant="outline" href={resolve("/")}>
                <Home />
                Home
            </Button>
            <Button variant="ghost" onclick={reload} disabled={!browser}>
                <RotateCcw />
                Retry
            </Button>
        </div>
    </section>
</div>
