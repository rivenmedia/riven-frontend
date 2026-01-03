<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import Circle from "@lucide/svelte/icons/circle";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { cn } from "$lib/utils";

    interface PosterCardProps {
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
    }: PosterCardProps = $props();
</script>

<div class="relative overflow-hidden rounded-lg shadow-md">
    {#if isSelectable}
        <button
            onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectToggle?.();
            }}
            class="focus-visible:ring-ring/50 absolute top-2 left-2 z-20 flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-white bg-black/50 shadow-xs transition-[color,box-shadow] outline-none hover:bg-black/70 focus-visible:ring-[3px]"
            aria-label="Select item">
            {#if isSelected}
                <Circle class="size-2 fill-white text-white" />
            {/if}
        </button>
    {/if}

    {#if image}
        <img
            alt={title}
            class={cn(
                "aspect-2/3 w-36 object-cover object-center transition-transform duration-300 will-change-transform group-hover:scale-105 md:w-42 lg:w-48",
                selected && "ring-primary ring-offset-background ring-2 ring-offset-2"
            )}
            src={image}
            loading="lazy" />
    {:else}
        <div
            class={cn(
                "flex aspect-2/3 w-36 flex-col items-center justify-center rounded-lg bg-white/10 transition-transform duration-300 will-change-transform group-hover:scale-105 md:w-42 lg:w-48",
                selected && "ring-primary ring-offset-background ring-2 ring-offset-2"
            )}>
            <Mountain size={24} class="opacity-50" />
        </div>
    {/if}

    {#if badge}
        <Badge
            class={cn(
                "absolute top-2 right-2 z-10 flex items-center justify-center px-2 py-0.5 text-[10px] leading-none font-medium tracking-wide shadow-sm backdrop-blur-sm",
                badge.variant === "success" && "bg-green-600/90 text-white",
                badge.variant === "error" && "bg-red-600/90 text-white",
                badge.variant === "warning" && "bg-yellow-600/90 text-white"
            )}>
            {badge.text}
        </Badge>
    {/if}

    <div class="absolute inset-0 flex flex-col justify-end">
        <div
            class="absolute inset-0 z-0 bg-black/90 backdrop-blur-md"
            style="mask-image: linear-gradient(to bottom, transparent 40%, black 90%); -webkit-mask-image: linear-gradient(to bottom, transparent 40%, black 90%);">
        </div>
        <div class="relative z-10 p-3 text-center">
            <p class="line-clamp-2 text-sm font-extrabold text-white drop-shadow-md">
                {title}
            </p>
            {#if subtitle}
                <p class="text-muted-foreground mt-1 text-xs">
                    {subtitle}
                </p>
            {/if}
        </div>
    </div>
</div>
