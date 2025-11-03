<script lang="ts">
    import { AspectRatio } from "$lib/components/ui/aspect-ratio/index.js";
    import Check from "@lucide/svelte/icons/check";
    import type { Snippet } from "svelte";

    interface Props {
        id?: number;
        riven_id?: number;
        src: string;
        alt: string;
        class?: string;
        isSelectable?: boolean;
        selectStore?: any;
        href?: string;
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
        href = undefined,
        children
    }: Props = $props();

    const isSelected = $derived(
        isSelectable && selectStore && riven_id !== undefined ? selectStore.has(riven_id) : false
    );

    function handlePosterClick(e: MouseEvent) {
        if (isSelectable && riven_id !== undefined && selectStore) {
            e.preventDefault();
            e.stopPropagation();
            selectStore.toggle(riven_id);
        }
    }
</script>

{#if href && !isSelectable}
    <a {href} class="block">
        <AspectRatio
            ratio={2 / 3}
            class="w-36 overflow-hidden rounded-sm md:w-40 lg:w-44 {className} cursor-pointer">
            <img
                src={src
                    ? src
                    : "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg"}
                {alt}
                class="h-full w-full object-cover" />

            {@render children?.()}
        </AspectRatio>
    </a>
{:else}
    <AspectRatio
        ratio={2 / 3}
        onclick={handlePosterClick}
        class="w-36 overflow-hidden rounded-sm md:w-40 lg:w-44 {className} {isSelectable
            ? 'cursor-pointer'
            : ''}">
        <img
            src={src
                ? src
                : "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg"}
            {alt}
            class="h-full w-full object-cover" />

        {#if isSelectable && isSelected}
            <div
                class="absolute inset-0 flex items-center justify-center bg-primary/20 transition-opacity pointer-events-none">
                <div
                    class="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Check class="size-5" />
                </div>
            </div>
        {/if}

        {@render children?.()}
    </AspectRatio>
{/if}
