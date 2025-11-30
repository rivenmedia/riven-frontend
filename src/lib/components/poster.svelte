<script lang="ts">
    import { cn } from "$lib/utils";
    import Circle from "@lucide/svelte/icons/circle";
    import type { Snippet } from "svelte";
    import RatingPoster from "./rating-poster.svelte";

    interface Props {
        id: number;
        title?: string;
        riven_id?: number;
        mediaType: string;
        indexer: string;
        src?: string;
        alt?: string;
        class?: string;
        isSelectable?: boolean;
        selectStore?: any;
        useDynamicPoster?: boolean;
        mediaURL: string;
        children?: Snippet;
    }

    let {
        id,
        title = undefined,
        riven_id = undefined,
        indexer,
        mediaType,
        src,
        alt,
        class: className = "",
        isSelectable = false,
        selectStore = undefined,
        useDynamicPoster = true,
        mediaURL,
        children
    }: Props = $props();
</script>

<div
    style="background-image: url('{src
        ? src
        : 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg'}');"
    class={cn(
        "group relative flex aspect-2/3 w-36 flex-col justify-between overflow-hidden rounded-sm bg-cover bg-center transition-transform duration-300 hover:scale-105 md:w-40 lg:w-44",
        className
    )}>
    {#if isSelectable}
        <button
            onclick={() => {
                if (selectStore) {
                    selectStore.toggle(riven_id!);
                }
            }}
            class="focus-visible:ring-ring/50 absolute top-2 left-2 z-20 flex size-3 shrink-0 items-center justify-center rounded-full border-2 border-white bg-black/50 shadow-xs transition-[color,box-shadow] outline-none hover:bg-black/70 focus-visible:ring-[3px]"
            aria-label="Select poster">
            {#if selectStore.has(riven_id!)}
                <Circle class="size-1.5 fill-white text-white" />
            {/if}
        </button>
    {/if}

    <a href={mediaURL} class="absolute inset-0 z-10" aria-label={title || "View details"}></a>

    <div class="relative flex flex-1 p-2 transition-all">
        <div class="hidden h-full w-full flex-col items-start justify-end group-hover:flex">
            <div class="bg-background/70 absolute top-0 right-0 bottom-0 left-0 h-full w-full">
            </div>
            <div
                class="to-background absolute top-0 right-0 bottom-0 left-0 h-full w-full bg-linear-to-b from-transparent to-100%">
            </div>
            {#if title}
                <p
                    class="relative z-1 line-clamp-2 w-full text-left text-sm font-semibold text-white">
                    {title}
                </p>
            {/if}

            <!-- <ItemRequest
                class="text-background relative z-1 mt-2 w-full bg-white/90 hover:bg-white/60"
                variant="default"
                ids={[id ? id.toString() : null]}
                {title}
                {mediaType} /> -->
        </div>
        {@render children?.()}
    </div>

    <div class="flex max-h-4 w-full items-end">
        {#if useDynamicPoster}
            <RatingPoster {id} {mediaType} {indexer} overlayOpacity={0.8} />
        {/if}
    </div>
</div>
