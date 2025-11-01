<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import { Badge } from "$lib/components/ui/badge/index.js";

    interface MediaCardProps {
        href: string;
        title: string;
        posterPath: string | null;
        subtitle?: string | null;
        metadata?: string | null;
        rating?: number | null;
        overview?: string | null;
        layout?: "vertical" | "horizontal";
    }

    let {
        href,
        title,
        posterPath,
        subtitle = null,
        metadata = null,
        rating = null,
        overview = null,
        layout = "vertical"
    }: MediaCardProps = $props();
</script>

<a
    {href}
    class="border-border flex overflow-hidden rounded-lg border bg-white/10 shadow-lg transition-all duration-200 hover:scale-102 hover:bg-white/15 {layout ===
    'vertical'
        ? 'flex-col'
        : 'flex-col sm:flex-row'}">
    <div class="{layout === 'vertical' ? 'aspect-[2/3] w-full' : 'w-full sm:w-1/3'}">
        {#if posterPath}
            <img
                alt={title}
                class="h-full w-full object-cover object-center"
                src={posterPath}
                loading="lazy" />
        {:else}
            <div
                class="flex h-full w-full flex-col items-center justify-center bg-white/20 backdrop-blur-md {layout ===
                'vertical'
                    ? ''
                    : 'h-48 sm:h-full'}">
                <Mountain size={32} class="opacity-70" />
            </div>
        {/if}
    </div>
    <div
        class="flex flex-col p-{layout === 'vertical' ? '3' : '4'} {layout === 'vertical'
            ? ''
            : 'w-full sm:w-2/3'}">
        <h3 class="{layout === 'vertical' ? 'line-clamp-2 text-sm' : 'text-base'} font-bold">
            {title}
        </h3>
        {#if subtitle}
            <p class="text-primary-foreground/70 line-clamp-1 text-{layout === 'vertical' ? 'xs' : 'sm'}">
                {subtitle}
            </p>
        {/if}
        {#if metadata}
            <p
                class="text-primary-foreground/70 {layout === 'vertical' ? 'text-xs' : 'mb-2 text-sm'}">
                {metadata}
            </p>
        {/if}
        {#if rating}
            <div class="mb-2 flex items-center gap-2">
                <Badge variant="outline" class="text-xs">
                    ⭐ {rating.toFixed(1)}
                </Badge>
            </div>
        {/if}
        {#if overview && layout === "horizontal"}
            <p class="line-clamp-3 text-xs">{overview}</p>
        {/if}
    </div>
</a>