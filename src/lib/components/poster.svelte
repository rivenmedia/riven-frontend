<script lang="ts">
    import { AspectRatio } from "$lib/components/ui/aspect-ratio/index.js";
    import Circle from "@lucide/svelte/icons/circle";
    import type { Snippet } from "svelte";

    interface Props {
        id?: number;
        riven_id?: number;
        src: string;
        alt: string;
        class?: string;
        isSelectable?: boolean;
        selectStore?: any;
        children?: Snippet;
    }

    let {
        id = undefined,
        riven_id = undefined,
        src,
        alt,
        class: className = "",
        isSelectable = false,
        selectStore = undefined,
        children
    }: Props = $props();
</script>

<AspectRatio
    ratio={2 / 3}
    class="w-36 overflow-hidden rounded-sm md:w-40 lg:w-44 {className} transition-transform duration-300 hover:scale-105">
    <img
        src={src
            ? src
            : "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg"}
        {alt}
        class="h-full w-full object-cover" />

    {#if isSelectable}
        <button
            onclick={() => {
                console.log("selecting poster");
                if (selectStore) {
                    selectStore.toggle(riven_id!);
                }
            }}
            class="focus-visible:ring-ring/50 absolute top-2 left-2 flex size-3 shrink-0 items-center justify-center rounded-full border-2 border-white bg-black/50 shadow-xs transition-[color,box-shadow] outline-none hover:bg-black/70 focus-visible:ring-[3px]"
            aria-label="Select poster">
            {#if selectStore.has(riven_id!)}
                <Circle
                    class="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 fill-white text-white" />
            {/if}
        </button>
    {/if}

    {@render children?.()}
</AspectRatio>
