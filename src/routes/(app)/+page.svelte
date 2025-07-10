<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import TmdbNowPlaying from '$lib/components/tmdb-now-playing.svelte';
	import TmdbListCarousel from '$lib/components/tmdb-list-carousel.svelte';

	let { data }: { data: PageData } = $props();

	let nowPlaying = $state<any | null>(null);

	let trendingMovies = $state<any | null>(null);
	let trendingMoviesTimeWindow = $state<'day' | 'week'>('day');

	let trenedingShows = $state<any | null>(null);
	let trendingShowsTimeWindow = $state<'day' | 'week'>('day');

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
			} catch (error) {
				console.error('Error fetching now playing movies:', error);
			}
		}
	});

	$inspect(trendingMoviesTimeWindow);
</script>

<TmdbNowPlaying data={nowPlaying} />

<div class="flex flex-col gap-12 p-6 md:p-8 md:px-16">
	<TmdbListCarousel bind:data={trendingMovies} type="movie" />
	<TmdbListCarousel bind:data={trenedingShows} type="tv" />
</div>
