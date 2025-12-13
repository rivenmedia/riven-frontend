<script lang="ts">
    import { onMount } from "svelte";
    import { posterCache, type RatingScore } from "$lib/services/poster-cache.svelte";

    interface Props {
        id: number;
        indexer: string; //"tmdb" | "anilist"
        mediaType?: string; //movie" | "tv"
        overlayOpacity?: number;
    }

    let { id, indexer, mediaType, overlayOpacity = 0.9 }: Props = $props();

    let scores = $state<RatingScore[]>([]);
    let loading = $state(true);
    let error = $state(false);

    onMount(async () => {
        // Guard: Don't fetch if id is invalid or mediaType is missing/unknown
        if (!id || id === null || (indexer !== "anilist" && (!mediaType || mediaType === "unknown"))) {
            loading = false;
            return;
        }

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
</script>

{#if !loading && !error && scores.length > 0}
    <div
        class="bg-secondary flex w-full flex-row items-center justify-evenly"
        style="opacity: {overlayOpacity};">
        {#each scores as score (score.name)}
            <div class="flex flex-row items-center gap-1 text-xs text-white">
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
