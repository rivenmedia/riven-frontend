<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
    import { Window } from "$lib/components/ui/extras/window";
    import { cn } from "$lib/utils";
    import { useTerminalRoot } from "./terminal.svelte.js";
    import { onMount } from "svelte";
    import type { TerminalRootProps } from "./types.js";

    /**
     * @component Terminal
     *
     * Root component for the terminal typing animation effect.
     * Manages global animation state, playback lifecycle, and timing context.
     */

    let {
        delay = 0,
        speed = 1,
        onComplete = () => {},
        children,
        class: className
    }: TerminalRootProps = $props();

    const terminal = useTerminalRoot({
        get delay() {
            return delay;
        },
        get speed() {
            return speed;
        },
        get onComplete() {
            return onComplete;
        }
    });

    onMount(() => {
        // we play here so that we don't play before it is visible (on the server)
        terminal.play();

        return () => {
            terminal.dispose();
        };
    });
</script>

<Window class={cn("font-mono text-sm font-light", className)}>
    {@render children?.()}
</Window>
