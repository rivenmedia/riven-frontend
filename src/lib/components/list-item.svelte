<script lang="ts">
    import Poster from "$lib/components/poster.svelte";
    import RatingPoster from "$lib/components/rating-poster.svelte";
    import Calender from "@lucide/svelte/icons/calendar";
    import Tv from "@lucide/svelte/icons/tv";

    let { data, indexer, type, isSelectable = false, selectStore = undefined } = $props();

    if (indexer === "anilist" && !type) {
        type = data.media_type;
    }

    if (indexer === "tvdb" && type === "show") {
        type = "tv";
    }

    const mediaURL = `/details/${indexer}${type ? `/${type}` : ""}/${data.id}`;
    const useDynamicPoster = $derived(
        (indexer === "tmdb" && (type === "movie" || type === "tv")) || indexer === "anilist"
    );
</script>

<div class="flex w-36 flex-col md:w-40 lg:w-44">
    {#if useDynamicPoster}
        <RatingPoster
            {isSelectable}
            {selectStore}
            id={data.id}
            {indexer}
            mediaType={type}
            posterUrl={data.poster_path}
            alt={data.title}
            riven_id={data.riven_id ?? undefined}
            href={mediaURL}
            placement="bottom" />
    {:else}
        <Poster
            id={data.id}
            riven_id={data.riven_id ?? undefined}
            src={data.poster_path}
            alt={data.title}
            {isSelectable}
            {selectStore}
            href={mediaURL} />
    {/if}
    <a href={mediaURL} class="mt-1 block h-10 text-sm font-semibold hover:underline">
        <p class="line-clamp-2">
            {data.title}
        </p>
    </a>
    <div class="mt-1.5 flex h-4 flex-wrap items-center justify-between">
        <div class="flex items-center gap-0.5">
            <Calender class="text-muted-foreground size-3" />
            <p class="text-muted-foreground text-xs">
                {data.year}
            </p>
        </div>

        <div class="flex items-center gap-0.5">
            <Tv class="text-muted-foreground size-3" />
            <p class="text-muted-foreground text-xs">
                {data.media_type}
            </p>
        </div>
    </div>
</div>
