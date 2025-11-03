<script lang="ts">
    import { onMount } from "svelte";
    import { posterCache, type RatingScore } from "$lib/services/poster-cache";
    import Poster from "$lib/components/poster.svelte";

    type Placement = "top" | "bottom" | "left" | "right";
    type Indexer = "tmdb" | "anilist";

    interface Props {
        id: number;
        indexer: Indexer;
        mediaType?: "movie" | "tv";
        placement?: Placement;
        overlayOpacity?: number;
        [key: string]: any;
    }

    let {
        id,
        indexer,
        mediaType,
        placement = "bottom",
        overlayOpacity = 0.9,
        ...restProps
    }: Props = $props();

    let scores = $state<RatingScore[]>([]);
    let loading = $state(true);
    let error = $state(false);

    onMount(async () => {
        const cacheKey: "movie" | "tv" | "anime" =
            indexer === "anilist" ? "anime" : (mediaType as "movie" | "tv") || "movie";
        const cached = posterCache.get(id, cacheKey);
        if (cached) {
            scores = cached.scores;
            loading = false;
            return;
        }

        try {
            let response: Response;
            if (indexer === "anilist") {
                response = await fetch(`/api/ratings/anilist/${id}`);
            } else {
                response = await fetch(`/api/ratings/${id}?type=${mediaType}`);
            }

            if (response.ok) {
                const data = await response.json();
                scores = data.scores || [];
                posterCache.set(id, cacheKey, scores);
            } else {
                error = true;
            }
        } catch (e) {
            console.error("Failed to fetch ratings:", e);
            error = true;
        } finally {
            loading = false;
        }
    });

    const isHorizontal = $derived(placement === "top" || placement === "bottom");
    const justifyClass = $derived(
        placement === "top"
            ? "justify-start"
            : placement === "bottom"
              ? "justify-end"
              : placement === "left"
                ? "items-start"
                : "items-end"
    );
</script>

<Poster {...restProps} class="flex {isHorizontal ? 'flex-col' : 'flex-row'} {justifyClass}">
    {#snippet children()}
        {#if !loading && !error && scores.length > 0}
            <div
                class="flex {isHorizontal
                    ? 'h-[8%] w-full flex-row items-center justify-evenly'
                    : 'h-full w-[16%] flex-col items-center justify-start gap-2 pt-2'}"
                style="background-color: var(--secondary); opacity: {overlayOpacity};">
                {#each scores as score (score.name)}
                    <div
                        class="flex items-center gap-1 text-xs text-white {isHorizontal
                            ? 'flex-row'
                            : 'flex-col'}">
                        {#if score.image}
                            <img
                                src="/rating-logos/{score.image}"
                                alt={score.name}
                                class="w-auto object-contain {indexer === 'anilist'
                                    ? 'h-4'
                                    : 'h-[0.8rem]'}" />
                        {/if}
                        <span class="font-medium">{score.score}</span>
                    </div>
                {/each}
            </div>
        {/if}
    {/snippet}
</Poster>
