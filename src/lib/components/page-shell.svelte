<script lang="ts">
    import { cn } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";

    let { class: className, children, ...restProps }: HTMLAttributes<HTMLElement> = $props();
</script>

<main
    class={cn(
        "animate-fade-in-up mt-4 flex flex-col gap-6 p-4 pb-24 md:mt-14 md:gap-8 md:p-8 md:px-16",
        className
    )}
    {...restProps}>
    {@render children?.()}
</main>
