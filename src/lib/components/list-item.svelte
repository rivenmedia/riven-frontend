<script lang="ts">
    import PortraitCard from "$lib/components/media/portrait-card.svelte";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { cn } from "$lib/utils";

    const badgeVariantClasses: Record<string, string> = {
        success: "bg-green-600/90 text-white",
        error: "bg-red-600/90 text-white",
        default: "bg-yellow-600/90 text-white"
    };

    let {
        data = $bindable(),
        indexer = $bindable<string | undefined>(),
        type = $bindable<string | undefined>(),
        isSelectable = false,
        selectStore = undefined
    } = $props();

    // Normalize type for different indexers
    if (indexer === "anilist" && !type) type = data.media_type;
    if ((indexer === "tvdb" || indexer === "tmdb") && type === "show") type = "tv";

    // Ensure type is set if only in data
    if (!type && data.media_type) type = data.media_type;

    let mediaURL = $derived.by(() => {
        if (!data.id) return null;

        if (type === "person" || type === "company") {
            return `/details/entity/${data.id}/${type}`;
        }

        if (
            (indexer === "tmdb" || indexer === "tvdb" || indexer === undefined) &&
            (type === "movie" || type === "tv")
        ) {
            // Include indexer as query param when it's tvdb so details page knows to skip resolution
            const queryParam = indexer === "tvdb" ? "?indexer=tvdb" : "";
            // If indexer is undefined, assume tmdb behavior for now as default
            return `/details/media/${data.id}/${type}${queryParam}`;
        }
        return `/details/${indexer}${type ? `/${type}` : ""}/${data.id}`;
    });

    let subtitle = $derived.by(() => {
        const parts = [];
        if (data.media_type === "tv" || type === "tv") parts.push("TV");
        else if (data.media_type === "movie" || type === "movie") parts.push("Movie");
        else if (data.media_type === "person" || type === "person") parts.push("Person");
        else if (data.media_type === "company" || type === "company") parts.push("Studio");

        if (data.year && data.year !== "N/A") parts.push(data.year);
        return parts.join(" • ") || null;
    });

    const CONTAINER_CLASSES =
        "group relative block w-36 opacity-80 transition-all duration-200 hover:opacity-100 md:w-44 lg:w-48";
</script>

{#snippet cardContent()}
    <PortraitCard
        title={data.title}
        {subtitle}
        image={data.poster_path}
        {isSelectable}
        isSelected={isSelectable && selectStore?.has(data.riven_id)}
        onSelectToggle={() => selectStore?.toggle(data.riven_id)}>
        {#snippet topRight()}
            {#if data.badge}
                <Badge
                    class={cn(
                        "px-2 py-0.5 text-[10px] backdrop-blur-sm",
                        badgeVariantClasses[data.badge.variant] || badgeVariantClasses.default
                    )}>{data.badge.text}</Badge>
            {/if}
        {/snippet}
    </PortraitCard>
{/snippet}

{#if mediaURL}
    <a href={mediaURL} class={CONTAINER_CLASSES}>
        {@render cardContent()}
    </a>
{:else}
    <div role="button" aria-disabled="true" tabindex="-1" class={CONTAINER_CLASSES}>
        {@render cardContent()}
    </div>
{/if}
