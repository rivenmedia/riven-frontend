<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import Star from "@lucide/svelte/icons/star";
    import { browser } from "$app/environment";
    import { cn } from "$lib/utils";
    import type { Snippet } from "svelte";

    interface RatingsData {
        scores: Array<{ name: string; image?: string; score: string; url: string }>;
    }

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

    async function fetchRatings(id: number, type: string): Promise<RatingsData> {
        const response = await fetch(`/api/ratings/${id}?type=${type}`);
        if (!response.ok) throw new Error("Failed to fetch ratings");
        return response.json();
    }

    // Use $derived to create a reactive promise that updates when tmdbId or mediaType changes
    const ratingsPromise = $derived(browser && tmdbId ? fetchRatings(tmdbId, mediaType) : null);
</script>

<div
    class={cn(
        "group bg-card relative flex h-full w-full transform-gpu flex-col overflow-hidden rounded-xl shadow-md transition-[transform,shadow] duration-500 contain-content [content-visibility:auto] hover:scale-105 hover:shadow-xl",
        className
    )}>
    <!-- Inner Border Overlay -->
    <div
        class="border-border/50 group-hover:border-border pointer-events-none absolute inset-0 z-50 rounded-xl border transition-colors duration-500">
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

        {#if topRight}
            <div class="absolute top-2 right-2 z-10 flex w-full justify-end px-2">
                {@render topRight()}
            </div>
        {/if}

        <div class="absolute inset-0 flex flex-col justify-end">
            <div
                class="bg-background/90 absolute inset-0 backdrop-blur-3xl"
                style="mask-image: linear-gradient(to bottom, transparent 20%, black 80%);">
            </div>

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
                                    <div
                                        class="border-border bg-muted/50 text-foreground/80 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                                        <Star size={12} class="fill-yellow-500 text-yellow-500" />
                                        {initialRating.toFixed(1)}
                                    </div>
                                {:else}
                                    <div class="bg-muted h-5 w-12 animate-pulse rounded"></div>
                                {/if}
                            {:then ratingsData}
                                {#if ratingsData?.scores?.length}
                                    {#each ratingsData.scores as score (score.name)}
                                        <a
                                            href={score.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onclick={(e) => e.stopPropagation()}
                                            class="border-border bg-muted/50 text-foreground/80 hover:bg-muted flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors">
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
                                    <div
                                        class="border-border bg-muted/50 text-foreground/80 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                                        <Star size={12} class="fill-yellow-500 text-yellow-500" />
                                        {initialRating.toFixed(1)}
                                    </div>
                                {/if}
                            {:catch}
                                {#if initialRating}
                                    <div
                                        class="border-border bg-muted/50 text-foreground/80 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                                        <Star size={12} class="fill-yellow-500 text-yellow-500" />
                                        {initialRating.toFixed(1)}
                                    </div>
                                {/if}
                            {/await}
                        {:else if initialRating}
                            <div
                                class="border-border bg-muted/50 text-foreground/80 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                                <Star size={12} class="fill-yellow-500 text-yellow-500" />
                                {initialRating.toFixed(1)}
                            </div>
                        {/if}
                    </div>
                {/if}

                {#if overview}
                    <div
                        class="text-muted-foreground grid grid-rows-[0fr] text-sm opacity-0 transition-[grid-template-rows,opacity] duration-500 will-change-[grid-template-rows] group-hover:grid-rows-[1fr] group-hover:opacity-100">
                        <p class="line-clamp-3 overflow-hidden">
                            {overview}
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
