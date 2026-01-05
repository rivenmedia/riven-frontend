<script lang="ts">
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { type CarouselAPI } from "$lib/components/ui/carousel/context.js";
    import Autoplay from "embla-carousel-autoplay";
    import { TMDB_IMAGE_BASE_URL, TMDB_GENRES } from "$lib/providers";
    import { getSeasonAndYear } from "$lib/helpers";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";

    export interface TMDBNowPlayingItem {
        id: number;
        media_type?: "movie" | "tv";
        title?: string;
        name?: string;
        backdrop_path: string | null;
        release_date?: string;
        first_air_date?: string;
        vote_average?: number;
        original_language?: string;
        overview?: string;
        genre_ids?: number[];
    }

    interface Props {
        data?: TMDBNowPlayingItem[];
        showRequestButton?: boolean;
        alignment?: "left" | "center" | "right";
    }

    let { data = [], showRequestButton = true, alignment = "left" }: Props = $props();

    let api = $state<CarouselAPI>();
    const autoplayDelay = 5000;
    let autoplayPlugin = Autoplay({
        delay: autoplayDelay,
        stopOnInteraction: false
    });

    let currentIndex = $state(0);

    // Handle carousel API events with proper cleanup
    $effect(() => {
        if (!api) return;

        const onSelect = () => {
            currentIndex = api!.selectedScrollSnap();
        };

        // Initialize current index and register event handler
        currentIndex = api.selectedScrollSnap();
        api.on("select", onSelect);

        // Cleanup: remove event handler when api changes or component unmounts
        return () => {
            api?.off("select", onSelect);
        };
    });
</script>

{#if Array.isArray(data) && data.length > 0}
    <div class="border-border/50 relative overflow-hidden rounded-2xl border shadow-2xl">
        <Carousel.Root
            setApi={(emblaApi) => (api = emblaApi)}
            plugins={[autoplayPlugin]}
            opts={{ loop: true }}
            class="relative"
            role="region"
            aria-label="Now playing movies carousel">
            <Carousel.Content>
                {#each data as item, index (item.id)}
                    {@const isTV = item.media_type === "tv"}
                    {@const mediaType = isTV ? "tv" : "movie"}
                    {@const displayTitle = item.title ?? item.name ?? "Untitled"}
                    <Carousel.Item class="relative h-[420px] w-full">
                        <!-- Backdrop Image -->
                        <img
                            src="{TMDB_IMAGE_BASE_URL}/original{item.backdrop_path}"
                            alt={displayTitle}
                            class="h-full w-full object-cover object-top select-none"
                            loading="lazy" />

                        <!-- Gradient Overlay -->
                        <div
                            class="from-background via-background/90 pointer-events-none absolute top-0 -right-4 bottom-0 left-4 bg-gradient-to-t to-transparent">
                        </div>

                        <!-- Text Content with Netflix-style reveal -->
                        {#key currentIndex === index ? currentIndex : -1}
                            <div
                                class="slide-content absolute top-0 -right-4 bottom-0 left-4 z-10 flex flex-col justify-end px-6 pt-8 pb-16 md:px-16 {alignment ===
                                'right'
                                    ? 'items-end pr-12 text-right md:pr-24'
                                    : alignment === 'center'
                                      ? 'items-center text-center'
                                      : 'items-start text-left'}">
                                <div class="w-full max-w-2xl">
                                    <!-- Title -->
                                    <h1
                                        class="reveal-1 line-clamp-2 text-2xl leading-tight font-semibold tracking-tight drop-shadow-2xl md:text-4xl">
                                        {displayTitle}
                                    </h1>

                                    <!-- Metadata Row -->
                                    <div
                                        class="reveal-2 text-foreground/80 mt-3 flex flex-wrap items-center gap-2 text-sm {alignment ===
                                        'right'
                                            ? 'justify-end'
                                            : alignment === 'center'
                                              ? 'justify-center'
                                              : 'justify-start'}">
                                        <span
                                            class="bg-muted/50 rounded-md px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                                            {isTV ? "TV Show" : "Movie"}
                                        </span>
                                        <span class="text-muted-foreground">•</span>
                                        <span
                                            >{getSeasonAndYear(
                                                item.release_date || item.first_air_date
                                            )}</span>
                                        <span class="text-muted-foreground">•</span>
                                        <span
                                            >{item.vote_average
                                                ? item.vote_average.toFixed(1)
                                                : "N/A"}/10</span>
                                        {#if item.original_language}
                                            <span class="text-muted-foreground">•</span>
                                            <span class="uppercase">{item.original_language}</span>
                                        {/if}
                                    </div>

                                    <!-- Overview -->
                                    {#if item.overview}
                                        <p
                                            class="reveal-3 text-muted-foreground mt-3 line-clamp-2 text-sm md:text-base">
                                            {item.overview}
                                        </p>
                                    {/if}

                                    <!-- Genres -->
                                    {#if item.genre_ids?.length}
                                        <div
                                            class="reveal-4 mt-4 flex flex-wrap gap-2 {alignment ===
                                            'right'
                                                ? 'justify-end'
                                                : alignment === 'center'
                                                  ? 'justify-center'
                                                  : 'justify-start'}">
                                            {#each item.genre_ids.slice(0, 4) as genreId (genreId)}
                                                {#if TMDB_GENRES[genreId]}
                                                    <Badge
                                                        variant="outline"
                                                        class="border-border bg-background/50 text-foreground/90 hover:bg-background/70 backdrop-blur-sm">
                                                        {TMDB_GENRES[genreId]}
                                                    </Badge>
                                                {/if}
                                            {/each}
                                        </div>
                                    {/if}

                                    <!-- Action Buttons -->
                                    <div
                                        class="reveal-5 mt-6 flex flex-wrap gap-3 {alignment ===
                                        'right'
                                            ? 'justify-end'
                                            : alignment === 'center'
                                              ? 'justify-center'
                                              : 'justify-start'}">
                                        {#if showRequestButton}
                                            <Button
                                                href="/watch/{item.id}"
                                                variant="secondary"
                                                size="lg"
                                                class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary border bg-transparent px-6">
                                                Request
                                            </Button>
                                        {/if}
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            href="/details/media/{item.id}/{mediaType}"
                                            class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-6">
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        {/key}
                    </Carousel.Item>
                {/each}
            </Carousel.Content>
        </Carousel.Root>

        <!-- Navigation Arrows (only align left/right correctly) -->
        <div
            class="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-4">
            <button
                class="border-border bg-background/60 text-foreground/80 hover:bg-background/80 hover:text-foreground pointer-events-auto hidden h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-110 md:flex"
                onclick={() => api?.scrollPrev()}
                aria-label="Previous slide">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-5 w-5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <button
                class="border-border bg-background/60 text-foreground/80 hover:bg-background/80 hover:text-foreground pointer-events-auto hidden h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-110 md:flex"
                onclick={() => api?.scrollNext()}
                aria-label="Next slide">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-5 w-5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>

        <!-- Progress Indicator -->
        <div
            class="border-border bg-background/60 absolute bottom-2 left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-md">
            <span class="text-foreground/80 text-xs font-medium"
                >{currentIndex + 1}/{data.length}</span>

            <div class="flex gap-1.5">
                {#each data as _, i}
                    <button
                        class="h-2 w-2 cursor-pointer rounded-full transition-all duration-300 {i ===
                        currentIndex
                            ? 'bg-primary scale-110'
                            : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'}"
                        onclick={() => api?.scrollTo(i)}
                        aria-label="Go to slide {i + 1}">
                    </button>
                {/each}
            </div>

            <div class="bg-muted h-1.5 w-16 overflow-hidden rounded-full md:w-20">
                {#key currentIndex}
                    <div class="progress-bar-fill bg-primary h-full"></div>
                {/key}
            </div>
        </div>
    </div>
{:else}
    <div class="relative h-[420px] w-full overflow-hidden rounded-2xl">
        <div class="from-background to-muted absolute inset-0 animate-pulse bg-gradient-to-t"></div>

        <div class="absolute inset-0 z-2 flex flex-col justify-end p-8 md:p-12">
            <div class="w-full max-w-xl">
                <Skeleton class="mb-3 h-12 w-3/4" />
                <div class="flex items-center gap-3">
                    <Skeleton class="h-5 w-16" />
                    <Skeleton class="h-5 w-24" />
                    <Skeleton class="h-5 w-12" />
                </div>
                <Skeleton class="mt-4 h-4 w-full" />
                <Skeleton class="mt-2 h-4 w-4/5" />
                <div class="mt-4 flex gap-2">
                    <Skeleton class="h-7 w-20 rounded-full" />
                    <Skeleton class="h-7 w-24 rounded-full" />
                </div>
                <div class="mt-6 flex gap-3">
                    <Skeleton class="h-11 w-28" />
                    <Skeleton class="h-11 w-32" />
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Netflix-style staggered reveal animation */
    @keyframes slide-reveal {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Progress bar animation - synced to autoplay delay */
    @keyframes progress-fill {
        from {
            width: 0%;
        }
        to {
            width: 100%;
        }
    }

    .slide-content .reveal-1 {
        animation: slide-reveal 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        animation-delay: 0.1s;
        opacity: 0;
    }

    .slide-content .reveal-2 {
        animation: slide-reveal 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        animation-delay: 0.2s;
        opacity: 0;
    }

    .slide-content .reveal-3 {
        animation: slide-reveal 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        animation-delay: 0.3s;
        opacity: 0;
    }

    .slide-content .reveal-4 {
        animation: slide-reveal 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        animation-delay: 0.4s;
        opacity: 0;
    }

    .slide-content .reveal-5 {
        animation: slide-reveal 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        animation-delay: 0.5s;
        opacity: 0;
    }

    .progress-bar-fill {
        animation: progress-fill 5s linear forwards;
    }
</style>
