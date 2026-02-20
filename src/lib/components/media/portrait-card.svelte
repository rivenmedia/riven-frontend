<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import Check from "@lucide/svelte/icons/check";
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
    class={cn(
        "group bg-card ring-border hover:ring-primary/30 relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-sm ring-1 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50",
        isSelected && "ring-primary shadow-[0_0_30px_rgba(var(--primary),0.3)] ring-2",
        className
    )}>
    <!-- Background / Image -->
    {#if image}
        <img
            alt={title}
            src={image}
            loading="lazy"
            class={cn(
                "h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-110",
                isSelected ? "scale-105 opacity-40 grayscale-[0.5]" : "opacity-100"
            )} />
        <!-- Gradient Overlay - Stronger fade for text legibility using theme colors where possible but ensuring contrast -->
        <div
            class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100">
        </div>
        <!-- Subtle Theme Tint at the bottom -->
        <div
            class="from-primary/20 absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        </div>
    {:else}
        <div class="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
            <Mountain size={32} strokeWidth={1} />
        </div>
    {/if}

    <!-- Selection Overlay -->
    {#if isSelectable}
        <button
            onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectToggle?.();
            }}
            class={cn(
                "absolute top-3 left-3 z-30 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200",
                isSelected
                    ? "border-primary bg-primary text-primary-foreground scale-110"
                    : "border-white/30 bg-black/20 opacity-0 group-hover:opacity-100 hover:border-white/50 hover:bg-black/40"
            )}
            aria-label="Select item">
            {#if isSelected}
                <Check class="h-3 w-3" strokeWidth={3} />
            {/if}
        </button>
    {/if}

    <!-- Top Right Slot -->
    {#if topRight}
        <div
            class="absolute top-3 right-3 z-20 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
            {@render topRight()}
        </div>
    {/if}

    <!-- Content -->
    {#if showContent}
        <div
            class="absolute inset-x-0 bottom-0 z-20 p-4 transition-transform duration-300 group-hover:-translate-y-1">
            <h3 class="line-clamp-2 leading-tight font-bold text-balance text-white drop-shadow-md">
                {title}
            </h3>
            {#if subtitle}
                <p class="mt-1 line-clamp-1 text-xs font-medium text-zinc-300/90">
                    {subtitle}
                </p>
            {/if}
        </div>
    {/if}
</div>
