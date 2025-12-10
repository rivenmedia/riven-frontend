<script lang="ts">
    import Poster from "$lib/components/poster.svelte";
    import Calender from "@lucide/svelte/icons/calendar";
    import Tv from "@lucide/svelte/icons/tv";

    let {
        data = $bindable(),
        indexer = $bindable<string | undefined>(),
        type = $bindable<string | undefined>(),
        isSelectable = false,
        selectStore = undefined,
        useDynamicPoster = true
    } = $props();

    if (indexer === "anilist" && !type) {
        type = data.media_type;
    }

    if ((indexer === "tvdb" || indexer === "tmdb") && type === "show") {
        type = "tv";
    }

    let mediaURL = $derived.by(() => {
        if (!data.id) return "javascript:void(0)";

        if (indexer === "tmdb" && type === "movie") {
            return `/details/media/${data.id}/movie`;
        } else if (indexer === "tvdb" && type === "tv") {
            return `/details/media/${data.id}/tv`;
        } else {
            return `/details/${indexer}${type ? `/${type}` : ""}/${data.id}`;
        }
    });
</script>

<div class="flex w-36 flex-col md:w-40 lg:w-44">
    <Poster
        {isSelectable}
        id={data.id}
        {selectStore}
        {indexer}
        mediaType={type}
        src={data.poster_path}
        alt={data.title}
        title={data.title}
        riven_id={data.riven_id ?? undefined}
        {mediaURL}
        {useDynamicPoster} />
    <a href={mediaURL} class="mt-2 block h-10 text-sm font-semibold hover:underline">
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
