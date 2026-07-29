<script lang="ts">
    import type { Snippet } from "svelte";
    import { cn } from "$lib/utils";

    interface Props {
        title: string;
        description?: string;
        class?: string;
        content: Snippet;
        footer?: Snippet;
    }

    let {
        title,
        description = undefined,
        class: className = "",
        content,
        footer
    }: Props = $props();
</script>

<section
    class={cn(
        "border-border/60 grid gap-4 border-b py-6 md:grid-cols-[12rem_minmax(0,1fr)]",
        className
    )}>
    <div>
        <h2 class="text-base font-semibold">{title}</h2>
        {#if description}
            <p class="text-muted-foreground mt-1 text-sm">{description}</p>
        {/if}
    </div>

    <div class="min-w-0">
        {@render content?.()}

        {#if footer}
            <div class="mt-4">
                {@render footer?.()}
            </div>
        {/if}
    </div>
</section>
