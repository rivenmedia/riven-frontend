<script lang="ts">
    import type { PageProps } from './$types';
    import * as Carousel from '$lib/components/ui/carousel/index.js';
    import { AspectRatio } from '$lib/components/ui/aspect-ratio/index.js';
    import { type CarouselAPI } from '$lib/components/ui/carousel/context.js';
    import Autoplay from 'embla-carousel-autoplay';
    import { roundOff } from '$lib/helpers';
    import Tooltip from '$lib/components/tooltip.svelte';
    import { Button } from '$lib/components/ui/button/index.js';
    import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
    import Header from '$lib/components/header.svelte';

    import Star from '@lucide/svelte/icons/star';
    import CalendarDays from '@lucide/svelte/icons/calendar-days';
    import Languages from '@lucide/svelte/icons/languages';
    import Info from '@lucide/svelte/icons/info';
    import CirclePlus from '@lucide/svelte/icons/circle-plus';

    import { MediaType, TimeWindow } from '$lib/tmdb';
    import ListCarousel from '$lib/components/list-carousel.svelte';

    let { data }: PageProps = $props();

    let carouselApi = $state<CarouselAPI>();
    let carouselCurrent = $state(0);
    const carouselCount = $derived(carouselApi ? carouselApi.scrollSnapList().length : 0);

    $effect(() => {
        if (carouselApi) {
            carouselCurrent = carouselApi.selectedScrollSnap() + 1;
            carouselApi.on('select', () => {
                carouselCurrent = carouselApi!.selectedScrollSnap() + 1;
            });
        }
    });

    const lists = [
        {
            name: 'Trending Today',
            list: data.trendingAllToday.results,
            orientation: 'horizontal'
        },
        {
            name: 'Trending Movies This Week',
            list: data.trendingMovies.results,
            orientation: 'vertical'
        },
        {
            name: 'Trending Shows This Week',
            list: data.trendingShows.results,
            orientation: 'vertical'
        },
        {
            name: 'Popular Movies',
            list: data.popularMovies.results,
            orientation: 'vertical'
        },
        {
            name: 'Popular Shows',
            list: data.popularShows.results,
            orientation: 'vertical'
        },
        {
            name: 'Top Rated Movies',
            list: data.topRatedMovies.results,
            orientation: 'vertical'
        },
        {
            name: 'Top Rated Shows',
            list: data.topRatedShows.results,
            orientation: 'vertical'
        }
    ];
</script>

<svelte:head>
    <title>Homepage | Riven</title>
</svelte:head>

<Header />

<Carousel.Root
    setApi={(emblaApi) => (carouselApi = emblaApi)}
    plugins={[
        Autoplay({
            delay: 10000
        })
    ]}
    class="h-screen lg:h-[60vh] overflow-hidden"
>
    <Carousel.Content class="h-full">
        {#each data.nowPlaying.results as item}
            <Carousel.Item
                class="h-full w-full min-w-full basis-full pl-0 text-white dark:text-white"
            >
                <div class="relative">
                    <img
                        src="https://www.themoviedb.org/t/p/original{item.backdrop_path}"
                        alt={item.title || item.name || item.original_name}
                        class="h-screen lg:h-[60vh] w-full select-none object-cover object-center"
                        loading="lazy"
                    />
                    <div
                        class="absolute inset-0 z-[1] flex select-none bg-gradient-to-t from-neutral-950"
                    ></div>
                    <div class="absolute inset-0 z-[2] flex flex-col gap-4">
                        <div
                            class="ml-4 flex h-full w-full flex-col justify-end gap-2 p-8 md:px-16"
                        >
                            <div class="w-full max-w-2xl select-none">
                                <h1
                                    class="break-words text-3xl font-medium leading-tight md:text-4xl"
                                >
                                    {item.title || item.name || item.original_name}
                                </h1>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-xs text-neutral-200">
                                <div class="flex items-center gap-1">
                                    <Star class="size-4" />
                                    <p>{roundOff(item.vote_average)}</p>
                                </div>
                                <div class="flex items-center gap-1">
                                    <CalendarDays class="size-4" />
                                    <p>{item.release_date}</p>
                                </div>
                                <div class="flex items-center gap-1 uppercase">
                                    <Languages class="size-4" />
                                    <p>{item.original_language}</p>
                                </div>
                            </div>
                            <div class="mt-2 w-full max-w-2xl select-none">
                                <Tooltip class="text-left">
                                    {#snippet trigger()}
                                        <p
                                            class="line-clamp-3 text-base md:line-clamp-4 lg:line-clamp-5 xl:line-clamp-6"
                                        >
                                            {item.overview}
                                        </p>
                                    {/snippet}
                                    {#snippet content()}
                                        <p class="max-w-xs text-sm md:max-w-md lg:max-w-xl">
                                            {item.overview}
                                        </p>
                                    {/snippet}
                                </Tooltip>
                            </div>
                            <div class="mt-2 flex gap-2">
                                <Button size="lg" class="flex items-center gap-2">
                                    <CirclePlus />
                                    <span class="text-base">Request</span>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    class="flex items-center gap-2"
                                    href="/movie/{item.id}"
                                >
                                    <Info />
                                    <span class="text-base">Details</span>
                                </Button>
                            </div>

                            {#if carouselApi && carouselCount > 1}
                                <div class="mt-8 flex items-center justify-center gap-1">
                                    <RadioGroup.Root
                                        value={carouselCurrent.toString()}
                                        onValueChange={(value) => {
                                            carouselApi!.scrollTo(parseInt(value) - 1);
                                        }}
                                        class="flex gap-2"
                                    >
                                        {#each Array.from({ length: carouselCount }) as _, index}
                                            <RadioGroup.Item
                                                class="size-2 md:size-3"
                                                value={(index + 1).toString()}
                                            />
                                        {/each}
                                    </RadioGroup.Root>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </Carousel.Item>
        {/each}
    </Carousel.Content>
</Carousel.Root>

<div class="space-y-4 p-8 md:px-16">
    {#each lists as { name, list, orientation }}
        <ListCarousel {list} {orientation} title={name} class="flex w-full flex-col gap-2" />
    {/each}
</div>
