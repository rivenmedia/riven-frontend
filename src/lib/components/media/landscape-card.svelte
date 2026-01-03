<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import Star from "@lucide/svelte/icons/star";
    import { browser } from "$app/environment";
    import { cn } from "$lib/utils";
    import type { Snippet } from "svelte";

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

    let ratingsData = $state<{
        scores: Array<{ name: string; image?: string; score: string; url: string }>;
    } | null>(null);
    let loading = $state(false);
    let error = $state(false);

    $effect(() => {
        if (!browser || !tmdbId) return;

        const controller = new AbortController();
        loading = true;

        fetch(`/api/ratings/${tmdbId}?type=${mediaType}`, { signal: controller.signal })
            .then((r) => {
                if (!r.ok) throw new Error("Failed to fetch ratings");
                return r.json();
            })
            .then((d) => {
                if (!controller.signal.aborted) {
                    ratingsData = d;
                    loading = false;
                }
            })
            .catch((e) => {
                if (!controller.signal.aborted) {
                    error = true;
                    loading = false;
                }
            });

        return () => controller.abort();
    });
</script>

<div
    class={cn(
        "group relative flex h-full w-full transform-gpu flex-col overflow-hidden rounded-xl bg-white/5 shadow-md transition-[transform,shadow] duration-500 contain-content [content-visibility:auto] hover:scale-105 hover:shadow-xl",
        className
    )}>
    <!-- Inner Border Overlay -->
    <div
        class="pointer-events-none absolute inset-0 z-50 rounded-xl border border-white/10 transition-colors duration-500 group-hover:border-white/20">
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
                class="absolute inset-0 bg-black/90 backdrop-blur-3xl"
                style="mask-image: linear-gradient(to bottom, transparent 20%, black 80%);">
            </div>

            <div class="relative z-10 flex flex-col gap-1.5 p-4">
                <h3
                    class="relative z-20 line-clamp-1 text-lg font-extrabold text-white drop-shadow-md">
                    {#if episodeNumber}
                        <span class="text-primary mr-2 drop-shadow-md">{episodeNumber}.</span>
                    {/if}
                    {title}
                </h3>

                {#if meta}
                    <div class="relative z-20 flex flex-wrap items-center gap-2">
                        {@render meta()}
                        {#if loading || (!ratingsData && !error && initialRating)}
                            {#if initialRating}
                                <div
                                    class="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/80">
                                    <Star size={12} class="fill-yellow-500 text-yellow-500" />
                                    {initialRating.toFixed(1)}
                                </div>
                            {:else}
                                <div class="h-5 w-12 animate-pulse rounded bg-white/10"></div>
                            {/if}
                        {:else if ratingsData?.scores?.length}
                            {#each ratingsData.scores as score (score.name)}
                                <a
                                    href={score.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onclick={(e) => e.stopPropagation()}
                                    class="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/80 transition-colors hover:bg-white/20">
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
                                class="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/80">
                                <Star size={12} class="fill-yellow-500 text-yellow-500" />
                                {initialRating.toFixed(1)}
                            </div>
                        {/if}
                    </div>
                {/if}

                {#if overview}
                    <div
                        class="grid grid-rows-[0fr] text-sm text-white/80 opacity-0 transition-[grid-template-rows,opacity] duration-500 will-change-[grid-template-rows] group-hover:grid-rows-[1fr] group-hover:opacity-100">
                        <p class="line-clamp-3 overflow-hidden">
                            {overview}
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
