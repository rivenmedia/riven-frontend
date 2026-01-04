<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { cn } from "$lib/utils.js";
    import { Spring } from "svelte/motion";
    import { onMount } from "svelte";

    type Option = {
        label: string;
        value: string;
    };

    let { options, value, onchange } = $props<{
        options: Option[];
        value: string | undefined;
        onchange: (value: string) => void;
    }>();

    let elements: HTMLElement[] = $state([]);
    let container: HTMLElement;

    // Spring for position (x) and width (w)
    const springConfig = { stiffness: 0.15, damping: 0.6 };
    const styles = new Spring({ x: 0, w: 0 }, springConfig);

    function updatePosition(val: string | undefined, immediate = false) {
        requestAnimationFrame(() => {
            if (!val || elements.length === 0 || !container) return;
            const index = options.findIndex((o: Option) => o.value === val);
            if (index === -1) return;

            const el = elements[index];
            if (el) {
                const containerRect = container.getBoundingClientRect();
                const itemRect = el.getBoundingClientRect();
                const leftOffset = itemRect.left - containerRect.left;

                styles.set({ x: leftOffset, w: itemRect.width }, { hard: immediate });
            }
        });
    }

    onMount(() => {
        // Initialize position instantly
        updatePosition(value, true);

        // Add resize listener for responsiveness
        const handleResize = () => updatePosition(value);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    });
</script>

<div
    bind:this={container}
    class="border-border/50 bg-background/50 relative flex w-fit items-center gap-1 rounded-full border p-1 backdrop-blur-md">
    <!-- Layer 1: Inactive State (Base Layer) & Layout Driver -->
    {#each options as option, i}
        <div bind:this={elements[i]} class="relative z-0 flex flex-1 items-center justify-center">
            <Button
                variant="ghost"
                size="sm"
                class="text-muted-foreground hover:text-foreground h-7 w-full rounded-full px-4 text-xs font-bold transition-colors hover:bg-transparent"
                onclick={() => {
                    onchange(option.value);
                    updatePosition(option.value);
                }}>
                {option.label}
            </Button>
        </div>
    {/each}

    <!-- Layer 2: Active State (Masked Overlay) -->
    <!-- The pill acts as a window into the "Active" world -->
    <div
        class="bg-primary pointer-events-none absolute top-1 bottom-1 left-0 z-10 overflow-hidden rounded-full shadow-lg"
        style="transform: translateX({styles.current.x}px); width: {styles.current.w}px">
        <!-- Inner Container: Inverse translation to keep text static relative to parent -->
        <div
            class="absolute top-0 left-0 flex h-full items-center gap-1"
            aria-hidden="true"
            style="transform: translateX({-styles.current
                .x}px); width: {container?.getBoundingClientRect().width ?? 0}px; padding: 4px;">
            <!-- padding-1 = 4px -->
            {#each options as option}
                <div class="flex flex-1 items-center justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        tabindex="-1"
                        class="text-primary-foreground hover:text-primary-foreground h-7 w-full rounded-full px-4 text-xs font-bold hover:bg-transparent">
                        {option.label}
                    </Button>
                </div>
            {/each}
        </div>
    </div>
</div>
