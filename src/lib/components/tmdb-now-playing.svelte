<script lang="ts">
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { type CarouselAPI } from "$lib/components/ui/carousel/context.js";
    import Autoplay from "embla-carousel-autoplay";
    import { TMDB_IMAGE_BASE_URL, TMDB_GENRES } from "$lib/providers";
    import { getSeasonAndYear } from "$lib/helpers";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
    import { onMount, onDestroy } from "svelte";

    let api = $state<CarouselAPI>();
    let currentProgress = $state(0);
    let currentIndex = $state(0);
    let autoplayDelay = 5000;
    let progressInterval: number;
    let slideStartTime = $state(Date.now());

    let { data } = $props();

    function setupProgressTracking() {
        if (api) {
            api.on("select", () => {
                currentProgress = 0;
                slideStartTime = Date.now();
                currentIndex = api!.selectedScrollSnap();
            });

            if (progressInterval) clearInterval(progressInterval);

            progressInterval = window.setInterval(() => {
                const elapsed = Date.now() - slideStartTime;
                currentProgress = Math.min((elapsed / autoplayDelay) * 100, 100);
            }, 16);
        }
    }

    onMount(() => {
        if (api) {
            setupProgressTracking();
        }
    });

    onDestroy(() => {
        if (progressInterval) clearInterval(progressInterval);
    });

    $effect(() => {
        if (api) {
            setupProgressTracking();
        }
    });
</script>

{#if Array.isArray(data) && data.length > 0}
    <Carousel.Root
        setApi={(emblaApi) => (api = emblaApi)}
        plugins={[
            Autoplay({
                delay: autoplayDelay
            })
        ]}
        class="relative">
        <Carousel.Content>
            {#each data as item}
                <Carousel.Item class="relative h-[27.5rem] w-full">
                    <img
                        src="{TMDB_IMAGE_BASE_URL}/original{item.backdrop_path}"
                        alt={item.title || item.original_title}
                        class="w-full object-cover object-center select-none max-md:h-full"
                        loading="lazy" />
                    <div
                        class="absolute inset-0 z-[1] flex bg-gradient-to-t from-neutral-950 select-none">
                    </div>

                    <div class="absolute inset-0 z-[2] mt-14 flex flex-col gap-4">
                        <div class="flex h-full w-full flex-col justify-end gap-2 p-9 md:px-20">
                            <div class="w-full max-w-2xl select-none">
                                <h1
                                    class="text-3xl leading-tight font-medium break-words md:text-4xl">
                                    {item.title || item.original_title}
                                </h1>
                                <div class="mt-2 flex items-center gap-1.5 select-none">
                                    <p class="text-sm">Movie</p>

                                    <span class="text-muted-foreground text-sm">•</span>

                                    <span class="text-sm">
                                        {getSeasonAndYear(item.release_date || item.first_air_date)}
                                    </span>

                                    <span class="text-muted-foreground text-sm">•</span>

                                    <p class="text-sm">
                                        {item.vote_average ? item.vote_average.toFixed(1) : "N/A"} /
                                        10
                                    </p>

                                    <span class="text-muted-foreground text-sm">•</span>

                                    <p class="text-sm">
                                        {item.original_language.toUpperCase()}
                                    </p>
                                </div>
                                <p class="text-muted-foreground mt-1 line-clamp-2 text-sm">
                                    {item.overview || "No overview available."}
                                </p>
                                <div class="mt-1.5 flex items-center">
                                    {#each item.genre_ids as genreId}
                                        {#if TMDB_GENRES[genreId]}
                                            <Badge variant="outline" class="mt-2 mr-1">
                                                {TMDB_GENRES[genreId]}
                                            </Badge>
                                        {/if}
                                    {/each}
                                </div>
                            </div>
                            <div class="mt-4 flex flex-col items-center gap-2 md:flex-row">
                                <Button
                                    href="/watch/{item.id}"
                                    class="bg-foreground text-background hover:bg-foreground/90 w-full px-8 md:w-auto"
                                    >Request</Button>
                                <Button variant="link" href="/details/{item.id}"
                                    >View Details</Button>
                            </div>
                        </div>
                    </div>
                </Carousel.Item>
            {/each}
        </Carousel.Content>

        <div class="absolute inset-y-0 left-2 z-10 flex items-center">
            <Carousel.Previous
                class="h-8 w-8 rounded-full bg-black/50 p-1.5 opacity-75 hover:opacity-100" />
        </div>
        <div class="absolute inset-y-0 right-2 z-10 flex items-center">
            <Carousel.Next
                class="h-8 w-8 rounded-full bg-black/50 p-1.5 opacity-75 hover:opacity-100" />
        </div>

        <div
            class="absolute left-1/2 z-10 flex w-full max-w-xs -translate-x-1/2 items-center justify-center gap-3 md:bottom-10">
            <div class="text-xs font-medium whitespace-nowrap text-white/80">
                {currentIndex + 1}/{data.length}
            </div>

            <div class="flex gap-1">
                {#each data as _, i}
                    <button
                        class="h-1.5 w-1.5 cursor-pointer rounded-full {i === currentIndex
                            ? 'bg-white'
                            : 'bg-white/50'}"
                        onclick={() => api?.scrollTo(i)}
                        aria-label="Go to slide {i + 1}">
                    </button>
                {/each}
            </div>

            <div class="h-1 w-24 overflow-hidden rounded-full bg-black/30">
                <div
                    class="h-full bg-white transition-all duration-100"
                    style="width: {currentProgress}%">
                </div>
            </div>
        </div>
    </Carousel.Root>
{:else}
    <div class="relative h-96 w-full">
        <div
            class="absolute inset-0 animate-pulse bg-gradient-to-t from-neutral-950 to-neutral-800">
        </div>

        <div class="absolute inset-0 z-[2] flex flex-col gap-4">
            <div class="flex h-full w-full flex-col justify-end gap-2 p-8 md:px-16">
                <div class="w-full max-w-2xl">
                    <Skeleton class="mb-2 h-9 w-3/4" />

                    <div class="mt-2 flex items-center gap-4">
                        <Skeleton class="h-4 w-12" />
                        <Skeleton class="h-4 w-24" />
                        <Skeleton class="h-4 w-16" />
                        <Skeleton class="h-4 w-8" />
                    </div>

                    <Skeleton class="mt-3 mb-1 h-4 w-full" />
                    <Skeleton class="mb-3 h-4 w-5/6" />

                    <div class="mt-1.5 flex items-center gap-2">
                        <Skeleton class="h-6 w-16 rounded-full" />
                        <Skeleton class="h-6 w-20 rounded-full" />
                        <Skeleton class="h-6 w-14 rounded-full" />
                    </div>

                    <div class="mt-4 flex flex-col items-center gap-2 md:flex-row">
                        <Skeleton class="h-10 w-28" />
                        <Skeleton class="h-10 w-28" />
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
