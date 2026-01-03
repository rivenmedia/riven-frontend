<script lang="ts">
    import MediaCard from "$lib/components/media/media-card.svelte";

    let {
        data = $bindable(),
        indexer = $bindable<string | undefined>(),
        type = $bindable<string | undefined>(),
        isSelectable = false,
        selectStore = undefined
    } = $props();

    if (indexer === "anilist" && !type) {
        type = data.media_type;
    }

    if ((indexer === "tvdb" || indexer === "tmdb") && type === "show") {
        type = "tv";
    }

    let mediaURL = $derived.by(() => {
        if (!data.id) return "javascript:void(0)";

        if (indexer === "tmdb" && (type === "movie" || type === "tv")) {
            return `/details/media/${data.id}/${type}`;
        } else if (indexer === "tvdb" && type === "tv") {
            return `/details/media/${data.id}/tv`;
        } else {
            return `/details/${indexer}${type ? `/${type}` : ""}/${data.id}`;
        }
    });

    let mediaTypeLabel = $derived.by(() => {
        if (data.media_type === "tv") return "TV";
        if (data.media_type === "movie") return "Movie";
        return data.media_type || "";
    });

    let subtitle = $derived.by(() => {
        const parts = [];
        if (mediaTypeLabel) parts.push(mediaTypeLabel);
        if (data.year) parts.push(data.year);
        return parts.join(" \u2022 ") || null;
    });
</script>

<a
    href={mediaURL}
    class="group relative block opacity-80 transition-all duration-200 hover:opacity-100">
    <MediaCard
        title={data.title}
        {subtitle}
        image={data.poster_path}
        {isSelectable}
        isSelected={isSelectable && selectStore?.has(data.riven_id)}
        onSelectToggle={() => selectStore?.toggle(data.riven_id)} />
</a>
