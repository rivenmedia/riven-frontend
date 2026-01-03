<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import Circle from "@lucide/svelte/icons/circle";
    import { cn } from "$lib/utils";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        subtitle?: string | null;
        image: string | null;
        selected?: boolean;
        isSelectable?: boolean;
        isSelected?: boolean;
        onSelectToggle?: () => void;
        class?: string;
        topRight?: Snippet;
        showContent?: boolean;
    }

    let {
        title,
        subtitle = null,
        image,
        selected = false,
        isSelectable = false,
        isSelected = false,
        onSelectToggle,
        class: className,
        topRight,
        showContent = true
    }: Props = $props();
</script>

<div
    class={cn("relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900 shadow-md", className)}>
    <!-- Inner Border Overlay -->
    <div class="pointer-events-none absolute inset-0 z-50 rounded-[inherit] border border-white/10">
    </div>
    {#if isSelectable}
        <button
            onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectToggle?.();
            }}
            class="absolute top-2 left-2 z-20 flex size-4 items-center justify-center rounded-full border-2 border-white bg-black/50 hover:bg-black/70"
            aria-label="Select item">
            {#if isSelected}<Circle class="size-2 fill-white text-white" />{/if}
        </button>
    {/if}

    {#if image}
        <img
            alt={title}
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={image}
            loading="lazy" />
    {:else}
        <div class="absolute inset-0 flex h-full w-full items-center justify-center bg-white/5">
            <Mountain size={24} class="opacity-50" />
        </div>
    {/if}

    {#if topRight}
        <div class="absolute top-2 right-2 z-10">
            {@render topRight()}
        </div>
    {/if}

    {#if showContent}
        <div class="absolute inset-0 flex flex-col justify-end">
            <div
                class="absolute inset-0 bg-black/90 backdrop-blur-md"
                style="mask-image: linear-gradient(to bottom, transparent 40%, black 90%);">
            </div>
            <div class="relative z-10 p-3 text-center">
                <p class="line-clamp-2 text-sm font-extrabold text-white drop-shadow-md">{title}</p>
                {#if subtitle}<p class="text-muted-foreground mt-1 text-xs">{subtitle}</p>{/if}
            </div>
        </div>
    {/if}
</div>
