<script lang="ts">
    import "../app.css";
    import "@fontsource/oxanium/400.css";
    import "@fontsource/oxanium/700.css";
    import "@fontsource/jetbrains-mono/latin.css";
    import "@fontsource/merriweather/latin.css";
    import { ModeWatcher } from "mode-watcher";
    import type { Snippet } from "svelte";

    let { children }: { children: Snippet } = $props();
</script>

<ModeWatcher defaultMode="dark" defaultTheme="darkmatter" />
{@render children()}
