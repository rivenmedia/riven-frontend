<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$lib/components/header.svelte';
	import { Input } from '$lib/components/ui/input';
	import { debounce } from '$lib/helpers';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
    import MediaTmdbCarousel from '$lib/components/media-tmdb-carousel.svelte';
    import { Loader2 } from 'lucide-svelte';

	export let data: PageData;

	let loading = false;
	let query = $page.url.searchParams.get('query') || '';

	$: movies = data.movies;
	$: shows = data.shows;

	let fetchedResults = debounce(async (e) => {
		loading = true;
		query = e.target.value;
		if (query.length === 0) {
			goto(`?`, { invalidateAll: true });
		}
		goto(`?query=${query}`, { invalidateAll: true });
		loading = false;
	});
</script>

<Header />

<div class="mt-32 flex w-full flex-col p-8 md:px-24 lg:px-32">
	<div class="flex w-full flex-col gap-1.5">
		<Input
			type="text"
			id="query"
			placeholder="Search for your movie/series/anime/collections here"
			bind:value={query}
			on:input={fetchedResults}
		/>
	</div>

	{#if loading}
		<div class="flex flex-row items-center gap-2">
			<Loader2 class="w-6 h-6 animate-spin" />
			<p class="text-sm">Loading...</p>
		</div>
    {:else}
        {#if query.length > 0}
            <p class="text-muted-foreground mt-4">Search results for {query}</p>

            {#if movies.length > 0}
                <MediaTmdbCarousel name="Movies" results={movies} mediaType="movie" />
            {/if}

            {#if shows.length > 0}
                <MediaTmdbCarousel name="Shows" results={shows} mediaType="tv" />
            {/if}
        {/if}
	{/if}
</div>
