<script lang="ts">
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { type CarouselAPI } from "$lib/components/ui/carousel/context.js";
    import Autoplay from "embla-carousel-autoplay";
    import { TMDB_IMAGE_BASE_URL, TMDB_GENRES } from "$lib/providers";
    import { getSeasonAndYear } from "$lib/helpers";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";

    export interface TMDBNowPlayingItem {
        id: number;
        media_type?: "movie" | "tv" | "person" | "company";
        title?: string;
        name?: string;
        backdrop_path?: string | null;
        release_date?: string;
        first_air_date?: string;
        vote_average?: number | null;
        original_language?: string;
        overview?: string;
        genre_ids?: number[];
    }

    interface Props {
        data?: TMDBNowPlayingItem[];
        showRequestButton?: boolean;
        alignment?: "left" | "center" | "right";
        heightClass?: string;
    }

    let {
        data = [],
        showRequestButton = true,
        alignment = "left",
        heightClass = "h-[350px] md:h-[420px]"
    }: Props = $props();

    let api = $state<CarouselAPI>();
    const autoplayDelay = 5000;
    let autoplayPlugin = Autoplay({
        delay: autoplayDelay,
        stopOnInteraction: false
    });

    let currentIndex = $state(0);

    // Handle carousel API events with proper cleanup using $effect.pre
    // This is the appropriate Svelte 5 pattern for subscribing to external events
    // when reacting to state changes (api becoming available)
    $effect.pre(() => {
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

    function getAlignmentClasses(
        align: "left" | "center" | "right",
        type: "container" | "flex"
    ): string {
        if (type === "container") {
            switch (align) {
                case "right":
                    return "items-end pr-8 text-right md:pr-24";
                case "center":
                    return "items-center text-center";
                default:
                    return "items-start text-left";
            }
        } else {
            switch (align) {
                case "right":
                    return "justify-end";
                case "center":
                    return "justify-center";
                default:
                    return "justify-start";
            }
        }
    }
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
                    <Carousel.Item class="relative w-full {heightClass}">
                        <!-- Backdrop Image -->
                        <img
                            src={item.backdrop_path?.startsWith("http")
                                ? item.backdrop_path
                                : `${TMDB_IMAGE_BASE_URL}/original${item.backdrop_path}`}
                            alt={displayTitle}
                            class="h-full w-full object-cover object-top select-none"
                            loading="lazy" />

                        <!-- Gradient Overlay with dramatic landscape-card style mask -->
                        <div
                            class="bg-background pointer-events-none absolute top-0 right-0 bottom-0 left-0"
                            style="-webkit-mask-image: radial-gradient(120% 160% at 0% 100%, black 0%, transparent 70%), linear-gradient(to bottom, transparent 10%, black 100%); mask-image: radial-gradient(120% 160% at 0% 100%, black 0%, transparent 70%), linear-gradient(to bottom, transparent 10%, black 100%);">
                        </div>

                        <!-- Text Content with Netflix-style reveal -->
                        {#key currentIndex === index ? currentIndex : -1}
                            <div
                                class="absolute top-0 right-0 bottom-0 left-0 z-10 flex flex-col justify-end px-8 pt-2 pb-24 md:px-32 md:pt-8 md:pb-16 lg:left-0 lg:right-0 {getAlignmentClasses(
                                    alignment,
                                    'container'
                                )}">
                                <div class="w-full max-w-2xl">
                                    <!-- Title -->
                                    <h1
                                        in:fly={{
                                            y: 20,
                                            duration: 1000,
                                            delay: 100,
                                            easing: cubicOut
                                        }}
                                        class="line-clamp-2 text-xl font-semibold tracking-tight drop-shadow-2xl md:text-4xl md:leading-tight">
                                        {displayTitle}
                                    </h1>

                                    <!-- Metadata Row -->
                                    <div
                                        in:fly={{
                                            y: 20,
                                            duration: 1000,
                                            delay: 200,
                                            easing: cubicOut
                                        }}
                                        class="text-foreground/90 mt-2 flex flex-wrap items-center gap-3 text-xs md:mt-4 md:text-sm {getAlignmentClasses(
                                            alignment,
                                            'flex'
                                        )}">
                                        <span
                                            class="bg-white/10 border-white/10 rounded-md border px-2.5 py-1 text-[10px] font-medium backdrop-blur-md md:text-xs">
                                            {isTV ? "TV Show" : "Movie"}
                                        </span>
                                        <span class="text-white/40">•</span>
                                        <span class="font-medium"
                                            >{getSeasonAndYear(
                                                item.release_date || item.first_air_date || ""
                                            )}</span>
                                        <span class="text-white/40">•</span>
                                        <span class="font-medium"
                                            >{item.vote_average
                                                ? item.vote_average.toFixed(1)
                                                : "N/A"}/10</span>
                                        {#if item.original_language}
                                            <span class="text-white/40">•</span>
                                            <span class="uppercase font-medium">{item.original_language}</span>
                                        {/if}
                                    </div>

                                    <!-- Overview -->
                                    {#if item.overview}
                                        <p
                                            in:fly|global={{
                                                y: 20,
                                                duration: 1000,
                                                delay: 300,
                                                easing: cubicOut
                                            }}
                                            class="text-muted-foreground/80 mt-3 line-clamp-2 max-w-xl text-xs leading-relaxed md:mt-4 md:text-base">
                                            {item.overview}
                                        </p>
                                    {/if}

                                    <!-- Genres -->
                                    {#if item.genre_ids?.length}
                                        <div
                                            in:fly|global={{
                                                y: 20,
                                                duration: 1000,
                                                delay: 400,
                                                easing: cubicOut
                                            }}
                                            class="mt-3 flex flex-wrap gap-2 md:mt-5 {getAlignmentClasses(
                                                alignment,
                                                'flex'
                                            )}">
                                            {#each item.genre_ids.slice(0, 4) as genreId (genreId)}
                                                {#if TMDB_GENRES[genreId]}
                                                    <Badge
                                                        variant="outline"
                                                        class="border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10 text-[10px] backdrop-blur-md transition-colors md:text-xs">
                                                        {TMDB_GENRES[genreId]}
                                                    </Badge>
                                                {/if}
                                            {/each}
                                        </div>
                                    {/if}

                                    <!-- Action Buttons -->
                                    <div
                                        in:fly={{
                                            y: 20,
                                            duration: 1000,
                                            delay: 500,
                                            easing: cubicOut
                                        }}
                                        class="mt-4 flex flex-wrap gap-3 md:mt-8 {getAlignmentClasses(
                                            alignment,
                                            'flex'
                                        )}">
                                        {#if showRequestButton}
                                            <Button
                                                href="/watch/{item.id}"
                                                variant="secondary"
                                                size="sm"
                                                class="border-primary/50 bg-primary/20 text-primary hover:bg-primary/30 backdrop-blur-md border px-6 transition-all hover:scale-105 md:h-11 md:px-8 md:text-base">
                                                Request
                                            </Button>
                                        {/if}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            href="/details/media/{item.id}/{mediaType}"
                                            class="border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/20 backdrop-blur-md border px-6 transition-all hover:scale-105 md:h-11 md:px-8 md:text-base">
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
                class="border-white/10 bg-black/20 text-white/70 hover:bg-black/40 hover:text-white pointer-events-auto hidden h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-110 md:flex"
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
                    class="h-6 w-6">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <button
                class="border-white/10 bg-black/20 text-white/70 hover:bg-black/40 hover:text-white pointer-events-auto hidden h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-110 md:flex"
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
                    class="h-6 w-6">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>

        <!-- Progress Indicator -->
        <div
            class="border-white/10 bg-black/30 absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-4 rounded-full border px-4 py-2 backdrop-blur-xl md:px-6 md:py-2.5">
            <span class="text-white/90 text-xs font-medium font-mono whitespace-nowrap"
                >{currentIndex + 1} / {data.length}</span>

            <!-- Desktop Segmented Progress (Hidden until Large screens) -->
            <div class="hidden gap-1.5 lg:flex">
                {#each data as _, i}
                    <button
                        class="h-1 w-6 cursor-pointer rounded-full transition-all duration-300 {i ===
                        currentIndex
                            ? 'bg-primary'
                            : 'bg-white/20 hover:bg-white/40'}"
                        onclick={() => api?.scrollTo(i)}
                        aria-label="Go to slide {i + 1}">
                    </button>
                {/each}
            </div>

            <!-- Mobile/Tablet Simple Progress Bar -->
            <div class="bg-white/20 h-1 w-32 overflow-hidden rounded-full lg:hidden">
                <div
                    class="bg-primary h-full transition-all duration-300 ease-out"
                    style="width: {((currentIndex + 1) / data.length) * 100}%">
                </div>
            </div>
        </div>
    </div>
{:else}
    <div class="relative w-full overflow-hidden rounded-2xl {heightClass}">
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
