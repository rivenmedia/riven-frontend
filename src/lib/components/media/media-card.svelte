<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import Circle from "@lucide/svelte/icons/circle";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { cn } from "$lib/utils";

    interface Props {
        title: string;
        subtitle?: string | null;
        image: string | null;
        badge?: { text: string; variant: "success" | "warning" | "error" } | null;
        selected?: boolean;
        isSelectable?: boolean;
        isSelected?: boolean;
        onSelectToggle?: () => void;
    }

    let {
        title,
        subtitle = null,
        image,
        badge = null,
        selected = false,
        isSelectable = false,
        isSelected = false,
        onSelectToggle
    }: Props = $props();

    const badgeColors = {
        success: "bg-green-600/90 text-white",
        error: "bg-red-600/90 text-white",
        warning: "bg-yellow-600/90 text-white"
    };
</script>

<div class="relative overflow-hidden rounded-lg shadow-md">
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
            class={cn(
                "aspect-2/3 w-36 object-cover transition-transform duration-300 group-hover:scale-105 md:w-42 lg:w-48",
                selected && "ring-primary ring-2 ring-offset-2"
            )}
            src={image}
            loading="lazy" />
    {:else}
        <div
            class={cn(
                "flex aspect-2/3 w-36 items-center justify-center rounded-lg bg-white/10 transition-transform duration-300 group-hover:scale-105 md:w-42 lg:w-48",
                selected && "ring-primary ring-2 ring-offset-2"
            )}>
            <Mountain size={24} class="opacity-50" />
        </div>
    {/if}

    {#if badge}
        <Badge
            class={cn(
                "absolute top-2 right-2 z-10 px-2 py-0.5 text-[10px] backdrop-blur-sm",
                badgeColors[badge.variant]
            )}>
            {badge.text}
        </Badge>
    {/if}

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
</div>
