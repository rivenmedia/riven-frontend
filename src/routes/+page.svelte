<script lang="ts">
	import type { PageData } from './$types';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import Autoplay from 'embla-carousel-autoplay';
	import Header from '$lib/components/header.svelte';
	import { Star, CalendarDays, Languages, Info, Flame, Clapperboard } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { roundOff } from '$lib/helpers';
	import HomeItems from '$lib/components/home-items.svelte';
	import ItemRequest from '$lib/components/item-request.svelte';
	export let data: PageData;
</script>

<svelte:head>
	<title>Riven | Home</title>
</svelte:head>

<Carousel.Root
	plugins={[
		Autoplay({
			delay: 5000
		})
	]}
	class="h-[70vh] overflow-hidden md:h-[100vh]"
>
	<Header />
	<Carousel.Content class="h-full">
		{#each data.nowPlaying.results as nowPlaying, i}
			{#if i <= 9}
				<Carousel.Item class="h-full w-full min-w-full basis-full pl-0 text-slate-50">
					<div class="relative">
						<img
							src="https://www.themoviedb.org/t/p/original{nowPlaying.backdrop_path}"
							alt={nowPlaying.title}
							class="h-[70vh] w-full select-none object-cover object-center md:h-[100vh]"
							loading="lazy"
						/>
						<div
							class="absolute inset-0 z-[1] flex select-none bg-gradient-to-t from-zinc-900"
						></div>
						<div class="absolute inset-0 z-[2] mt-16 flex flex-col gap-4 md:mb-56">
							<div class="ml-4 flex h-full w-full flex-col justify-end gap-2 p-8 md:px-24 lg:px-32">
								<div class="w-full max-w-2xl select-none">
									<h1 class="break-words text-3xl font-medium leading-tight md:text-4xl">
										{nowPlaying.title}
									</h1>
								</div>
								<div class="flex flex-wrap items-center gap-2 text-xs text-zinc-200">
									<div class="flex items-center gap-2">
										<Star class="size-4" />
										<p>{roundOff(nowPlaying.vote_average)}</p>
									</div>
									<div class="flex items-center gap-2">
										<CalendarDays class="size-4" />
										<p>{nowPlaying.release_date}</p>
									</div>
									<div class="flex items-center gap-2 uppercase">
										<Languages class="size-4" />
										<p>{nowPlaying.original_language}</p>
									</div>
								</div>
								<div class="mt-2 w-full max-w-2xl select-none">
									<p class="line-clamp-2 text-base">{nowPlaying.overview}</p>
								</div>
								<div class="mt-2 flex gap-2">
									<ItemRequest data={nowPlaying} type="movie" />
									<Button
										size="lg"
										variant="ghost"
										class="flex items-center gap-2"
										href="/movie/{nowPlaying.id}"
									>
										<Info class="h-4 w-4" />
										<span>Details</span>
									</Button>
								</div>
							</div>
						</div>
					</div>
				</Carousel.Item>
			{/if}
		{/each}
	</Carousel.Content>
</Carousel.Root>

<div class="flex w-full flex-col items-start p-8 md:-mt-56">
	<Carousel.Root
		opts={{
			dragFree: true
		}}
		plugins={[
			Autoplay({
				delay: 5000
			})
		]}
		class="w-full overflow-hidden"
	>
		<div class="z-40 mb-4 flex w-full text-white md:px-16 lg:px-24">
			<div class="flex w-full items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="rounded-md bg-primary p-2">
						<Flame class="size-4" />
					</div>
					<h2 class="text-xl font-medium md:text-2xl">What's Trending Today</h2>
				</div>
				<div class="flex items-center gap-1 text-zinc-900 dark:text-zinc-100">
					<Carousel.Previous class="static mt-8 h-8 w-8 rounded-md" />
					<Carousel.Next class="static mt-8 h-8 w-8 rounded-md" />
				</div>
			</div>
		</div>
		<Carousel.Content class="w-full">
			{#each data.trendingAll.results as trendingAll}
				{#if trendingAll.media_type !== 'person'}
					{@const mediaType = trendingAll.media_type}
					<Carousel.Item
						class="basis-11/12 text-zinc-50 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5"
					>
						<div class="aspect-[2/1] h-fit w-full overflow-hidden rounded-2xl">
							<a
								href="/{mediaType}/{trendingAll.id}"
								class="group relative flex h-full w-full flex-shrink-0 flex-col"
							>
								<div class="z-0">
									<img
										src="https://image.tmdb.org/t/p/w780{trendingAll.backdrop_path}"
										alt={trendingAll.name}
										loading="lazy"
										class="size-full object-cover object-center transition-all duration-300 ease-in-out group-hover:scale-105"
									/>
								</div>
								<div
									class="absolute inset-0 z-[1] flex select-none bg-gradient-to-t from-zinc-900"
								></div>
								<div class="absolute inset-0 z-[2] flex flex-col justify-end gap-2 p-4">
									<div class="flex items-center gap-2">
										<Clapperboard class="size-4" />
										<p class="line-clamp-1">{trendingAll.name || trendingAll.original_title}</p>
									</div>
									<div class="flex items-center gap-2 text-xs text-primary-foreground">
										<div class="flex items-center gap-2">
											<Star class="size-4" />
											<p>{roundOff(trendingAll.vote_average)}</p>
										</div>
										<div class="flex items-center gap-2">
											<CalendarDays class="size-4" />
											<p>{trendingAll.release_date || trendingAll.first_air_date}</p>
										</div>
										<div class="flex items-center gap-2 uppercase">
											<Languages class="size-4" />
											<p>{trendingAll.original_language}</p>
										</div>
									</div>
								</div>
							</a>
						</div>
					</Carousel.Item>
				{/if}
			{/each}
		</Carousel.Content>
	</Carousel.Root>
</div>

<HomeItems name="Movies" trending={data.trendingMovies} popular={data.moviesPopular} type="movie" />

<HomeItems name="Shows" trending={data.trendingShows} popular={data.showsPopular} type="tv" />
