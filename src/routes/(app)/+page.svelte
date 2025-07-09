<script lang="ts">
	import { AspectRatio } from '$lib/components/ui/aspect-ratio/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { type CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { getSeasonAndYear } from '$lib/helpers';
	import { TMDB_GENRES, TMDB_IMAGE_BASE_URL } from '$lib/tmdb';
	import Calender from '@lucide/svelte/icons/calendar';
	import Tv from '@lucide/svelte/icons/tv';
	import Autoplay from 'embla-carousel-autoplay';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Dummy data for testing
	let nowPlaying = $state<any | null>({
		results: [
			{
				id: 1,
				title: 'Dune: Part Two',
				original_title: 'Dune: Part Two',
				backdrop_path: '/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
				overview:
					'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
				release_date: '2024-02-28',
				vote_average: 8.2,
				original_language: 'en',
				genre_ids: [878, 12, 28]
			},
			{
				id: 2,
				title: 'Spider-Man: Across the Spider-Verse',
				original_title: 'Spider-Man: Across the Spider-Verse',
				backdrop_path: '/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
				overview:
					"After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse.",
				release_date: '2023-05-31',
				vote_average: 8.6,
				original_language: 'en',
				genre_ids: [16, 28, 12]
			},
			{
				id: 3,
				title: 'Oppenheimer',
				original_title: 'Oppenheimer',
				backdrop_path: '/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
				overview:
					"The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
				release_date: '2023-07-19',
				vote_average: 8.1,
				original_language: 'en',
				genre_ids: [18, 36]
			}
		]
	});
	let nowPlayingCarouselApi = $state<CarouselAPI>();

	let trendingMovies = $state<any | null>({
		results: [
			{
				id: 4,
				title: 'The Batman',
				original_title: 'The Batman',
				poster_path: '/74xTEgt7R36Fpooo50r9T25onhq.jpg',
				release_date: '2022-03-01',
				media_type: 'movie'
			},
			{
				id: 5,
				title: 'Top Gun: Maverick',
				original_title: 'Top Gun: Maverick',
				poster_path: '/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
				release_date: '2022-05-24',
				media_type: 'movie'
			},
			{
				id: 6,
				title: 'Avatar: The Way of Water',
				original_title: 'Avatar: The Way of Water',
				poster_path: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
				release_date: '2022-12-14',
				media_type: 'movie'
			},
			{
				id: 7,
				title: 'Black Panther: Wakanda Forever',
				original_title: 'Black Panther: Wakanda Forever',
				poster_path: '/sv1xJUazXeYqALzczSZ3O6nkH75.jpg',
				release_date: '2022-11-09',
				media_type: 'movie'
			},
			{
				id: 8,
				title: 'Everything Everywhere All at Once',
				original_title: 'Everything Everywhere All at Once',
				poster_path: '/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
				release_date: '2022-03-24',
				media_type: 'movie'
			},
			{
				id: 9,
				title: 'The Menu',
				original_title: 'The Menu',
				poster_path: '/v31MsWhF9WFh7Qooq6xSBbmJxoG.jpg',
				release_date: '2022-11-17',
				media_type: 'movie'
			}
		]
	});
	let trendingMoviesTimeWindow = $state<'day' | 'week'>('day');
	let trendingMoviesCarouselApi = $state<CarouselAPI>();

	let trenedingShows = $state<any | null>(null);
	let trendingShowsTimeWindow = $state<'day' | 'week'>('day');
	let trendingShowsCarouselApi = $state<CarouselAPI>();

	onMount(async () => {
		// Commented out for testing with dummy data
		/*
		if (browser) {
			try {
				if (sessionStorage.getItem('getNowPlaying')) {
					nowPlaying = JSON.parse(sessionStorage.getItem('getNowPlaying') || '{}');
				} else {
					const response = await fetch('/api/tmdb/now-playing');
					if (!response.ok) {
						throw new Error('Failed to fetch now playing movies');
					}
					nowPlaying = await response.json();
					sessionStorage.setItem('getNowPlaying', JSON.stringify(nowPlaying));
				}

				if (sessionStorage.getItem('getTrendingMovies')) {
					trendingMovies = JSON.parse(sessionStorage.getItem('getTrendingMovies') || '{}');
				} else {
					const response = await fetch(`/api/tmdb/movie/${trendingMoviesTimeWindow}/trending`);
					if (!response.ok) {
						throw new Error('Failed to fetch trending movies');
					}
					trendingMovies = await response.json();
					sessionStorage.setItem('getTrendingMovies', JSON.stringify(trendingMovies));
				}

				if (sessionStorage.getItem('getTrendingShows')) {
					trenedingShows = JSON.parse(sessionStorage.getItem('getTrendingShows') || '{}');
				} else {
					const response = await fetch(`/api/tmdb/tv/${trendingShowsTimeWindow}/trending`);
					if (!response.ok) {
						throw new Error('Failed to fetch trending shows');
					}
					trenedingShows = await response.json();
					sessionStorage.setItem('getTrendingShows', JSON.stringify(trenedingShows));
				}
			} catch (error) {
				console.error('Error fetching now playing movies:', error);
			}
		}
		*/
	});

	$inspect(trendingMoviesTimeWindow);
</script>

<Carousel.Root
	setApi={(emblaApi) => (nowPlayingCarouselApi = emblaApi)}
	plugins={[
		Autoplay({
			delay: 5000
		})
	]}
>
	<Carousel.Content>
		{#each nowPlaying.results as item}
			<Carousel.Item class="relative h-96 w-full">
				<img
					src="{TMDB_IMAGE_BASE_URL}/original{item.backdrop_path}"
					alt={item.title || item.original_title}
					class="w-full object-cover object-center select-none max-md:h-full"
					loading="lazy"
				/>
				<div
					class="absolute inset-0 z-[1] flex bg-gradient-to-t from-neutral-950 select-none"
				></div>

				<div class="absolute inset-0 z-[2] flex flex-col gap-4">
					<div class="flex h-full w-full flex-col justify-end gap-2 p-9 md:px-20">
						<div class="w-full max-w-2xl select-none">
							<h1 class="text-3xl leading-tight font-medium break-words md:text-4xl">
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
									{item.vote_average ? item.vote_average.toFixed(1) : 'N/A'} / 10
								</p>

								<span class="text-muted-foreground text-sm">•</span>

								<p class="text-sm">
									{item.original_language.toUpperCase()}
								</p>
							</div>
							<p class="text-muted-foreground mt-1 line-clamp-2 text-sm">
								{item.overview || 'No overview available.'}
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
							<Button href="/watch/{item.id}" class="w-full md:w-auto">Request</Button>
							<Button variant="link" href="/details/{item.id}">View Details</Button>
						</div>
					</div>
				</div>
			</Carousel.Item>
		{/each}
	</Carousel.Content>
</Carousel.Root>
{#if nowPlaying}{:else}
	<div class="relative h-96 w-full">
		<div
			class="absolute inset-0 animate-pulse bg-gradient-to-t from-neutral-950 to-neutral-800"
		></div>

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

<div class="p-6 md:p-8 md:px-16">
	<div class="flex items-center justify-between">
		<div class="flex max-w-max items-center gap-2">
			<h2 class="text-muted-foreground mb-4 text-2xl font-semibold">Trending Movies</h2>
			<Select.Root
				bind:value={trendingMoviesTimeWindow}
				onValueChange={(value) => {
					trendingMovies = fetch(`/api/tmdb/movie/${value}/trending`)
						.then((response) => response.json())
						.then((data) => {
							trendingMovies = data;
						})
						.catch((error) => console.error('Error fetching trending movies:', error));
				}}
				type="single"
			>
				<Select.Trigger class="w-44">
					{trendingMoviesTimeWindow === 'day' ? 'Today' : 'This Week'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="day">Today</Select.Item>
					<Select.Item value="week">This Week</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		<Button variant="link" href="/movie/{trendingMoviesTimeWindow}/trending">View All</Button>
	</div>
	{#if trendingMovies}
		<Carousel.Root
			opts={{
				dragFree: true,
				slidesToScroll: 'auto'
			}}
			class="mt-1.5"
			setApi={(emblaApi) => (trendingMoviesCarouselApi = emblaApi)}
		>
			<Carousel.Content>
				{#each trendingMovies.results as item}
					<Carousel.Item class="basis-48 border">
						<AspectRatio ratio={2 / 3}>
							<img
								src="{TMDB_IMAGE_BASE_URL}/w500{item.poster_path}"
								alt={item.title || item.original_title}
								class="object-cover object-center transition-transform duration-300 select-none hover:scale-105"
								loading="lazy"
							/>
						</AspectRatio>
						<a
							href="/details/{item.id}"
							class="mt-1 block h-10 text-sm font-semibold hover:underline"
						>
							<p class="line-clamp-2">
								{item.title || item.original_title}
							</p>
						</a>
						<div class="mt-1 flex flex-wrap items-center justify-between">
							<div class="flex items-center gap-0.5">
								<Calender class="text-muted-foreground size-3" />
								<p class="text-muted-foreground text-xs">
									{new Date(item.release_date || item.first_air_date).getFullYear()}
								</p>
							</div>

							<div class="flex items-center gap-0.5">
								<Tv class="text-muted-foreground size-3" />
								<p class="text-muted-foreground text-xs">
									{item.media_type === 'movie' ? 'Movie' : 'TV Show'}
								</p>
							</div>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</Carousel.Root>
	{:else}
		<div class="flex gap-3 overflow-x-auto pb-2">
			{#each Array(2) as _, i}
				<div class="w-[140px] flex-none sm:w-[160px] md:w-[180px]">
					<Skeleton class="aspect-[2/3] w-full rounded-sm" />
					<Skeleton class="mt-2 h-4 w-full" />
					<div class="mt-1 flex items-center justify-between">
						<div class="flex items-center gap-1">
							<Skeleton class="h-4 w-12 rounded-full" />
						</div>
						<div class="flex items-center gap-1">
							<Skeleton class="h-4 w-12 rounded-full" />
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
