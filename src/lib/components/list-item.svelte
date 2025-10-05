<script lang="ts">
    import { AspectRatio } from "$lib/components/ui/aspect-ratio/index.js";
    import RatingPoster from "$lib/components/rating-poster.svelte";
    import Calender from "@lucide/svelte/icons/calendar";
    import Tv from "@lucide/svelte/icons/tv";

    let { data, indexer, type } = $props();

    if (indexer === "anilist" && !type) {
        type = data.media_type;
    }

    const mediaURL = `/details/${indexer}${type ? `/${type}` : ""}/${data.id}`;
    const useDynamicPoster = $derived(
        (indexer === "tmdb" && (type === "movie" || type === "tv")) || indexer === "anilist"
    );
</script>

{#if useDynamicPoster}
    <RatingPoster
        id={data.id}
        {indexer}
        mediaType={type}
        posterUrl={data.poster_path}
        alt={data.title}
        placement="bottom" />
{:else}
    <AspectRatio ratio={2 / 3} class="overflow-hidden rounded-sm">
        <img
            src={data.poster_path}
            alt={data.title}
            class="h-full object-cover object-center transition-transform duration-300 select-none hover:scale-105"
            loading="lazy" />
    </AspectRatio>
{/if}
<a href={mediaURL} class="mt-1 block h-10 text-sm font-semibold hover:underline">
    <p class="line-clamp-2">
        {data.title}
    </p>
</a>
<div class="mt-1.5 flex flex-wrap items-center justify-between">
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
