<script lang="ts">
    import '../../app.css';
    import { Toaster } from '$lib/components/ui/sonner/index.js';
    import { ModeWatcher } from 'mode-watcher';
    import { afterNavigate, beforeNavigate } from '$app/navigation';
    import NProgress from 'nprogress';

    let { children } = $props();

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

<ModeWatcher defaultMode={"dark"} />
<Toaster richColors closeButton />

<div class="bg-background font-primary font-medium">
    {@render children?.()}
</div>
