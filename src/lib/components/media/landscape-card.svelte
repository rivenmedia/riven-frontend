<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import Star from "@lucide/svelte/icons/star";
    import { browser } from "$app/environment";
    import { cn } from "$lib/utils";
    import type { Snippet } from "svelte";

    import { getRatings, type RatingsData } from "$lib/stores/ratings";

    interface Props {
        title: string;
        image: string | null;
        overview?: string | null;
        topRight?: Snippet; // For badges like "Completed" or "Year"
        meta?: Snippet; // For secondary info line (ratings, runtime, etc)
        class?: string;
        tmdbId?: number;
        mediaType?: "movie" | "tv";
        initialRating?: number;
        episodeNumber?: number;
    }

    let {
        title,
        image,
        overview = null,
        topRight,
        meta,
        class: className,
        tmdbId,
        mediaType = "movie",
        initialRating,
        episodeNumber
    }: Props = $props();

    let ratingsPromise = $state<Promise<RatingsData> | null>(null);

    $effect(() => {
        if (!browser || !tmdbId) {
            ratingsPromise = null;
            return;
        }

        const controller = new AbortController();
        ratingsPromise = getRatings(tmdbId, mediaType, controller.signal);

        return () => {
            controller.abort();
        };
    });
</script>

{#snippet ratingBadge(rating: number)}
    <div
        class="text-foreground/90 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs backdrop-blur-md">
        <Star size={12} class="fill-yellow-500 text-yellow-500" />
        {rating.toFixed(1)}
    </div>
{/snippet}

<div
    class={cn(
        "group bg-card relative flex h-full w-full transform-gpu flex-col overflow-hidden rounded-xl shadow-lg transition-all duration-500 ease-in-out hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
        className
    )}>
    <!-- Inner Border Overlay with glass effect -->
    <div
        class="group-hover:border-primary/30 pointer-events-none absolute inset-0 z-50 rounded-xl border border-white/10 transition-colors duration-500">
    </div>

    <div class="relative aspect-video w-full flex-grow overflow-hidden">
        {#if image}
            <img
                alt={title}
                class="h-full w-full transform-gpu object-cover transition-transform duration-500 group-hover:scale-105"
                src={image}
                loading="lazy" />
        {:else}
            <div class="bg-muted/20 flex h-full w-full items-center justify-center">
                <Mountain size={32} class="opacity-50" />
            </div>
        {/if}

        <div
            class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80">
        </div>

        {#if topRight}
            <div class="absolute top-2 z-10 flex w-full justify-end px-2">
                {@render topRight()}
            </div>
        {/if}

        <div class="absolute inset-0 flex flex-col justify-end">
            <div class="relative z-10 flex flex-col gap-1.5 p-3 md:p-4">
                <h3
                    class="text-foreground relative z-20 line-clamp-1 text-base font-extrabold drop-shadow-md md:text-lg">
                    {#if episodeNumber}
                        <span class="text-primary mr-2 drop-shadow-md">{episodeNumber}.</span>
                    {/if}
                    {title}
                </h3>

                {#if meta}
                    <div class="relative z-20 flex flex-wrap items-center gap-2">
                        {@render meta()}
                        {#if ratingsPromise}
                            {#await ratingsPromise}
                                {#if initialRating}
                                    {@render ratingBadge(initialRating)}
                                {:else}
                                    <div
                                        class="h-5 w-12 animate-pulse rounded-full bg-white/10 backdrop-blur-md">
                                    </div>
                                {/if}
                            {:then ratingsData}
                                {#if ratingsData?.scores?.length}
                                    {#each ratingsData.scores as score (score.name)}
                                        <!-- svelte-ignore svelte/no-navigation-without-resolve -->
                                        <a
                                            href={score.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onclick={(e) => e.stopPropagation()}
                                            class="text-foreground/90 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs backdrop-blur-md transition-colors hover:bg-white/20">
                                            {#if score.image}
                                                <img
                                                    src="/rating-logos/{score.image}"
                                                    alt={score.name}
                                                    class="h-3 w-3 object-contain" />
                                            {/if}
                                            <span class="font-medium">{score.score}</span>
                                        </a>
                                    {/each}
                                {:else if initialRating}
                                    {@render ratingBadge(initialRating)}
                                {/if}
                            {:catch}
                                {#if initialRating}
                                    {@render ratingBadge(initialRating)}
                                {/if}
                            {/await}
                        {:else if initialRating}
                            {@render ratingBadge(initialRating)}
                        {/if}
                    </div>
                {/if}

                {#if overview}
                    <div
                        class="text-muted-foreground grid grid-rows-[0fr] text-sm opacity-0 transition-all duration-500 ease-in-out group-hover:grid-rows-[1fr] group-hover:opacity-100">
                        <p class="line-clamp-3 overflow-hidden">
                            {overview}
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
