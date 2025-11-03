<script lang="ts">
    import { AspectRatio } from "$lib/components/ui/aspect-ratio/index.js";
    import { cn } from "$lib/utils";
    import Circle from "@lucide/svelte/icons/circle";
    import type { Snippet } from "svelte";

    interface Props {
        id?: number;
        riven_id?: number;
        src?: string;
        alt?: string;
        class?: string;
        isSelectable?: boolean;
        selectStore?: any;
        rating?: Snippet;
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
        rating,
        children
    }: Props = $props();

    let showDetail = $state(false);
</script>

<div
    style="background-image: url('{src
        ? src
        : 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg'}');"
    class={cn(
        "flex aspect-2/3 w-36 flex-col justify-between overflow-hidden rounded-sm bg-cover bg-center transition-transform duration-300 hover:scale-105 md:w-40 lg:w-44",
        className
    )}>
    {#if isSelectable}
        <button
            onclick={() => {
                if (selectStore) {
                    selectStore.toggle(riven_id!);
                }
            }}
            class="focus-visible:ring-ring/50 z-1 m-2 flex size-3 shrink-0 items-center justify-center rounded-full border-2 border-white bg-black/50 shadow-xs transition-[color,box-shadow] outline-none hover:bg-black/70 focus-visible:ring-[3px]"
            aria-label="Select poster">
            {#if selectStore.has(riven_id!)}
                <Circle class="size-1.5 fill-white text-white" />
            {/if}
        </button>
    {/if}

    <div
        class="flex flex-1 flex-col items-start justify-end"
        role="link"
        tabindex="0"
        onmouseenter={() => {
            if (window.matchMedia("(hover: hover)").matches) {
                showDetail = true;
            }
        }}
        onmouseleave={() => {
            if (window.matchMedia("(hover: hover)").matches) {
                showDetail = false;
            }
        }}
        onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                showDetail = !showDetail;
            }
        }}
        onblur={() => {
            showDetail = false;
        }}
        onclick={() => {
            showDetail = !showDetail;
        }}>
        <!-- {#if showDetail}
            
        {/if} -->
    </div>

    <div class="flex max-h-4 w-full items-end">
        {@render rating?.()}
    </div>
</div>
