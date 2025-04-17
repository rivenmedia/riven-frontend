<script lang="ts">
    import '../../app.css';
    import { Toaster } from '$lib/components/ui/sonner/index.js';
    import { ModeWatcher } from 'mode-watcher';
    import { afterNavigate, beforeNavigate } from '$app/navigation';
    import CommandMenu from '$lib/components/command-menu.svelte';
    import NProgress from 'nprogress';
    import { setContext } from 'svelte';

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

    const commandState = $state({ open: false });
    setContext('commandState', commandState);
</script>

<svelte:head>
    <title>Riven</title>
</svelte:head>

<ModeWatcher defaultMode={'dark'} />
<Toaster richColors closeButton />

<CommandMenu />

<div class="bg-background font-primary font-medium">
    {@render children?.()}
</div>
