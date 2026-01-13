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

<!-- Outer Container: Handles Layout, Shadow, Ring (No Scale on Container to prevent clipping issues) -->
<div
    class={cn(
        "bg-card group relative aspect-[2/3] rounded-xl shadow-lg transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
        selected && "ring-primary shadow-[0_0_20px_rgba(var(--primary),0.5)] ring-2 ring-inset",
        className
    )}>
    <!-- Inner Content Clipper -->
    <div class="absolute inset-0 overflow-hidden rounded-xl">
        <!-- Inner Border Overlay with glass effect -->
        <div
            class="group-hover:border-primary/50 pointer-events-none absolute inset-0 z-50 rounded-[inherit] border-2 border-white/10 transition-colors duration-300">
        </div>

        {#if isSelectable}
            <button
                onclick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectToggle?.();
                }}
                class="border-primary bg-background/60 hover:bg-background/80 absolute top-2 left-2 z-20 flex size-4 items-center justify-center rounded-full border-2"
                aria-label="Select item">
                {#if isSelected}<Circle class="fill-primary text-primary size-2" />{/if}
            </button>
        {/if}

        {#if image}
            <img
                alt={title}
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                src={image}
                loading="lazy" />
        {:else}
            <div class="bg-muted absolute inset-0 flex h-full w-full items-center justify-center">
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
                    class="bg-card/90 absolute -inset-px backdrop-blur-md"
                    style="-webkit-mask-image: linear-gradient(to bottom, transparent 0%, transparent 10%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.9) 70%, black 100%); mask-image: linear-gradient(to bottom, transparent 0%, transparent 10%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.9) 70%, black 100%);">
                </div>
                <div class="relative z-10 p-3 text-center">
                    <p class="text-foreground line-clamp-2 text-sm font-extrabold drop-shadow-md">
                        {title}
                    </p>
                    {#if subtitle}<p class="text-muted-foreground mt-1 text-xs">{subtitle}</p>{/if}
                </div>
            </div>
        {/if}
    </div>
</div>
