<script lang="ts">
    import { AspectRatio } from "$lib/components/ui/aspect-ratio/index.js";
    import type { Snippet } from "svelte";

    interface Props {
        src: string;
        alt: string;
        class?: string;
        children?: Snippet;
    }

    let { src, alt, class: className = "", children }: Props = $props();
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
    {@render children?.()}
</AspectRatio>
