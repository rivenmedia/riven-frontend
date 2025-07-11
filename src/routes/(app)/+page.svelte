<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import TmdbNowPlaying from '$lib/components/tmdb-now-playing.svelte';
	import TmdbListCarousel from '$lib/components/tmdb-list-carousel.svelte';
	import ListCarousel from '$lib/components/list-carousel.svelte';
	import { TMDB_IMAGE_BASE_URL } from '$lib/providers/tmdb';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data }: { data: PageData } = $props();

	let nowPlaying = $state<any | null>(null);

	let trendingMovies = $state<any | null>(null);
	let trendingMoviesTimeWindow = $state<'day' | 'week'>('day');
	let trendingMoviesParsed = $derived.by(() => {
		return (
			trendingMovies?.results.map((item: any) => ({
				id: item.id,
				title: item.title || item.original_title,
				poster_path: `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`,
				media_type: 'Movie',
				year: new Date(item.release_date).getFullYear()
			})) || null
		);
	});

	let trenedingShows = $state<any | null>(null);
	let trendingShowsTimeWindow = $state<'day' | 'week'>('day');
	let trendingShowsParsed = $derived.by(() => {
		return (
			trenedingShows?.results.map((item: any) => ({
				id: item.id,
				title: item.name || item.original_name,
				poster_path: `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`,
				media_type: 'TV',
				year: new Date(item.first_air_date).getFullYear()
			})) || null
		);
	});

	let anilistTrending = $state<any | null>(null);
	let anilistTrendingParsed = $derived.by(() => {
		return (
			anilistTrending?.data?.Page?.media.map((item: any) => ({
				id: item.id,
				title: item.title.romaji || item.title.english || item.title.native,
				poster_path: item.coverImage.large,
				media_type: item.format,
				year: item.seasonYear
			})) || null
		);
	});

	onMount(async () => {
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

				if (sessionStorage.getItem('getAnilistTrending')) {
					anilistTrending = JSON.parse(sessionStorage.getItem('getAnilistTrending') || '{}');
				} else {
					const response = await fetch('/api/anilist/trending');
					if (!response.ok) {
						throw new Error('Failed to fetch Anilist trending');
					}
					anilistTrending = await response.json();
					sessionStorage.setItem('getAnilistTrending', JSON.stringify(anilistTrending));
				}
			} catch (error) {
				console.error('Error fetching now playing movies:', error);
			}
		}
	});
</script>

<TmdbNowPlaying data={nowPlaying} />

<div class="flex flex-col gap-12 p-6 md:p-8 md:px-16">
	<TmdbListCarousel bind:data={trendingMoviesParsed} type="movie" />
	<TmdbListCarousel bind:data={trendingShowsParsed} type="tv" />

	<div class="flex flex-col">
		<div class="flex items-center justify-between">
			<h2
				class="text-muted-foreground mb-4 max-w-max text-base font-semibold md:text-xl lg:text-2xl"
			>
				Trending Animes
			</h2>
			<Button variant="link" href="/anime/trending">View All</Button>
		</div>
		<ListCarousel bind:data={anilistTrendingParsed} />
	</div>
</div>
