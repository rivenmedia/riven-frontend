<script lang="ts">
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { type CarouselAPI } from "$lib/components/ui/carousel/context.js";
    import Autoplay from "embla-carousel-autoplay";
    import { TMDB_IMAGE_BASE_URL, TMDB_GENRES } from "$lib/providers";
    import { getSeasonAndYear } from "$lib/helpers";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
    import { getRatings } from "$lib/stores/ratings";
    import { Play, Info, Star } from "@lucide/svelte";

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
        certification?: string;
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
    let logos = $state<Record<number, string | null>>({});
    let ratings = $state<Record<number, any>>({});
    let certifications = $state<Record<number, string | null>>({});

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

    async function loadItemData(item: TMDBNowPlayingItem) {
        // Fetch Ratings (independent of logo)
        if (ratings[item.id] === undefined) {
            const mediaType = item.media_type === "tv" ? "tv" : "movie";
            getRatings(item.id, mediaType)
                .then((data) => {
                    ratings[item.id] = data;
                })
                .catch(() => {
                    ratings[item.id] = null;
                });
        }

        // Fetch Logo & Certification
        if (logos[item.id] !== undefined) return;

        const mediaType = item.media_type === "tv" ? "tv" : "movie";
        try {
            const res = await fetch(`/api/tmdb/${mediaType}/${item.id}/logo`);
            const data = await res.json();

            // Set certification if available
            if (data.certification) {
                certifications[item.id] = data.certification;
            } else {
                certifications[item.id] = null;
            }

            if (data.logo) {
                const img = new Image();
                img.src = data.logo;
                img.onload = () => {
                    logos[item.id] = data.logo;
                };
                img.onerror = () => {
                    logos[item.id] = null;
                };
            } else {
                logos[item.id] = null;
            }
        } catch (e) {
            console.error("Failed to fetch logo/cert", e);
            logos[item.id] = null;
        }
    }

    $effect(() => {
        if (!data || data.length === 0) return;

        // 1. Load current item immediately
        const currentItem = data[currentIndex];
        if (currentItem) loadItemData(currentItem);

        // 2. Load next/prev items (priority)
        const nextIndex = (currentIndex + 1) % data.length;
        const prevIndex = (currentIndex - 1 + data.length) % data.length;
        if (data[nextIndex]) loadItemData(data[nextIndex]);
        if (data[prevIndex]) loadItemData(data[prevIndex]);

        // 3. Load the rest in background with a slight delay/idle check
        // Using a simple timeout to defer non-critical fetches
        const timer = setTimeout(() => {
            data.forEach((item, index) => {
                if (
                    index !== currentIndex &&
                    index !== nextIndex &&
                    index !== prevIndex &&
                    logos[item.id] === undefined
                ) {
                    loadItemData(item);
                }
            });
        }, 1000);

        return () => clearTimeout(timer);
    });

    function getAlignmentClasses(
        align: "left" | "center" | "right",
        type: "container" | "flex"
    ): string {
        if (type === "container") {
            switch (align) {
                case "right":
                    return "items-end text-right";
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
                                class="absolute top-0 right-0 bottom-0 left-0 z-10 flex flex-col justify-end px-8 pt-2 pb-24 md:px-32 md:pt-8 md:pb-16 lg:right-0 lg:left-0 {getAlignmentClasses(
                                    alignment,
                                    'container'
                                )}">
                                <div
                                    class="flex w-full max-w-3xl flex-col {alignment === 'right'
                                        ? 'items-end'
                                        : alignment === 'center'
                                          ? 'items-center'
                                          : 'items-start'}">
                                    <!-- Title / Logo -->
                                    <div
                                        class="mb-4 flex h-24 items-end {getAlignmentClasses(
                                            alignment,
                                            'flex'
                                        )}">
                                        {#if logos[item.id]}
                                            <img
                                                src={logos[item.id]}
                                                alt={displayTitle}
                                                in:fly={{
                                                    y: 20,
                                                    duration: 1000,
                                                    delay: 100,
                                                    easing: cubicOut
                                                }}
                                                class="max-h-full max-w-[80%] object-contain drop-shadow-2xl {alignment ===
                                                'right'
                                                    ? 'object-right-bottom'
                                                    : alignment === 'center'
                                                      ? 'object-bottom'
                                                      : 'object-left-bottom'}" />
                                        {:else}
                                            <h1
                                                in:fly={{
                                                    y: 20,
                                                    duration: 1000,
                                                    delay: 100,
                                                    easing: cubicOut
                                                }}
                                                class="line-clamp-2 text-3xl font-black tracking-tighter drop-shadow-2xl md:text-5xl md:leading-[1.1] lg:text-6xl">
                                                {displayTitle}
                                            </h1>
                                        {/if}
                                    </div>

                                    <!-- Metadata Row -->
                                    <div
                                        in:fly={{
                                            y: 20,
                                            duration: 1000,
                                            delay: 200,
                                            easing: cubicOut
                                        }}
                                        class="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-white md:mt-4 md:text-sm {getAlignmentClasses(
                                            alignment,
                                            'flex'
                                        )}">
                                        <span
                                            class="flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[10px] leading-none font-bold tracking-wider uppercase backdrop-blur-md md:text-xs">
                                            {isTV ? "Series" : "Movie"}
                                        </span>
                                        {#if certifications[item.id] || (item.certification && item.certification !== "N/A")}
                                            <span class="text-white/40">|</span>
                                            <span
                                                class="flex items-center justify-center rounded-sm border border-white/40 px-1.5 py-1 text-[10px] leading-none font-bold tracking-wider uppercase md:text-xs">
                                                {certifications[item.id] || item.certification}
                                            </span>
                                        {/if}
                                        <span class="text-white/40">|</span>
                                        <span class="text-white drop-shadow-md"
                                            >{getSeasonAndYear(
                                                item.release_date || item.first_air_date || ""
                                            )}</span>
                                        {#if item.original_language}
                                            <span class="text-white/40">|</span>
                                            <span class="text-white uppercase drop-shadow-md"
                                                >{item.original_language}</span>
                                        {/if}
                                        {#if ratings[item.id]?.scores?.length}
                                            <div class="ml-2 flex items-center gap-4">
                                                {#each ratings[item.id].scores as score}
                                                    <a
                                                        href={score.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="flex items-center gap-1.5 transition-opacity hover:opacity-80"
                                                        title={score.name}>
                                                        {#if score.image}
                                                            <img
                                                                src="/rating-logos/{score.image}"
                                                                alt={score.name}
                                                                class="h-4 w-auto object-contain" />
                                                        {/if}
                                                        <span
                                                            class="text-xs font-bold text-white drop-shadow-md"
                                                            >{score.score}</span>
                                                    </a>
                                                {/each}
                                            </div>
                                        {:else if item.vote_average}
                                            <span class="text-white/40">|</span>
                                            <span
                                                class="flex items-center font-bold text-white drop-shadow-md">
                                                <Star
                                                    class="mr-1 h-3.5 w-3.5 fill-current text-yellow-500" />
                                                {item.vote_average.toFixed(1)}
                                            </span>
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
                                            class="mt-3 line-clamp-2 max-w-xl text-xs leading-relaxed text-white/90 drop-shadow-md md:mt-4 md:text-base">
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
                                            class="mt-4 flex flex-wrap gap-2 md:mt-6 {getAlignmentClasses(
                                                alignment,
                                                'flex'
                                            )}">
                                            {#each item.genre_ids.slice(0, 4) as genreId (genreId)}
                                                {#if TMDB_GENRES[genreId]}
                                                    <div
                                                        class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20">
                                                        {TMDB_GENRES[genreId]}
                                                    </div>
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
                                        class="mt-6 flex flex-wrap gap-4 md:mt-8 {getAlignmentClasses(
                                            alignment,
                                            'flex'
                                        )}">
                                        {#if showRequestButton}
                                            <Button
                                                href="/watch/{item.id}"
                                                variant="default"
                                                size="lg"
                                                class="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center justify-center rounded-md px-8 text-sm font-bold shadow-sm transition-all hover:scale-[1.02] md:h-12 md:text-base">
                                                Play Now
                                            </Button>
                                        {/if}
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            href="/details/media/{item.id}/{mediaType}"
                                            class="flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 text-sm font-bold text-white shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/20 md:h-12 md:text-base">
                                            More Info
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
                class="pointer-events-auto hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70 backdrop-blur-md transition-all hover:scale-110 hover:bg-black/40 hover:text-white md:flex"
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
                class="pointer-events-auto hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70 backdrop-blur-md transition-all hover:scale-110 hover:bg-black/40 hover:text-white md:flex"
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
            class="absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-xl md:px-6 md:py-2.5">
            <span class="font-mono text-xs font-medium whitespace-nowrap text-white/90"
                >{currentIndex + 1} / {data.length}</span>

            <!-- Desktop Segmented Progress (Hidden until Large screens) -->
            <div class="hidden gap-1.5 lg:flex">
                {#each data as _, i}
                    <button
                        class="relative h-1 w-6 cursor-pointer overflow-hidden rounded-full transition-all duration-300 {i ===
                        currentIndex
                            ? 'bg-white/20'
                            : 'bg-white/20 hover:bg-white/40'}"
                        onclick={() => api?.scrollTo(i)}
                        aria-label="Go to slide {i + 1}">
                        {#if i === currentIndex}
                            <div class="animate-progress bg-primary absolute top-0 bottom-0 left-0">
                            </div>
                        {/if}
                    </button>
                {/each}
            </div>

            <!-- Mobile/Tablet Simple Progress Bar -->
            <div class="h-1 w-32 overflow-hidden rounded-full bg-white/20 lg:hidden">
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

<style>
    @keyframes progress {
        from {
            width: 0%;
        }
        to {
            width: 100%;
        }
    }
    .animate-progress {
        animation: progress 5s linear;
    }
</style>
