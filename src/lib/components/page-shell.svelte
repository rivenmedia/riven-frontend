<script lang="ts">
    import { cn } from "$lib/utils";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import type { HTMLAttributes } from "svelte/elements";

    let { class: className, children, ...restProps }: HTMLAttributes<HTMLElement> = $props();
</script>

<main
    in:fly|global={{ y: 20, duration: 600, easing: cubicOut }}
    class={cn("mt-4 flex flex-col gap-6 p-4 pb-24 md:mt-14 md:gap-8 md:p-8 md:px-16", className)}
    {...restProps}>
    {@render children?.()}
</main>
