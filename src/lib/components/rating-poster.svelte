<script lang="ts">
	import { onMount } from 'svelte';
	import { posterCache, type RatingScore } from '$lib/services/poster-cache';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio/index.js';

	type Placement = 'top' | 'bottom' | 'left' | 'right';
	type Indexer = 'tmdb' | 'anilist';

	interface Props {
		id: number;
		indexer: Indexer;
		mediaType?: 'movie' | 'tv';
		posterUrl: string;
		alt: string;
		placement?: Placement;
		overlayOpacity?: number;
	}

	let {
		id,
		indexer,
		mediaType,
		posterUrl,
		alt,
		placement = 'bottom',
		overlayOpacity = 0.9
	}: Props = $props();

	let scores = $state<RatingScore[]>([]);
	let loading = $state(true);
	let error = $state(false);

	onMount(async () => {
		// Check cache first (use indexer as mediaType for anilist)
		const cacheKey: 'movie' | 'tv' | 'anime' = indexer === 'anilist' ? 'anime' : (mediaType as 'movie' | 'tv') || 'movie';
		const cached = posterCache.get(id, cacheKey);
		if (cached) {
			scores = cached.scores;
			loading = false;
			return;
		}

		// Fetch from API
		try {
			let response: Response;
			if (indexer === 'anilist') {
				response = await fetch(`/api/ratings/anilist/${id}`);
			} else {
				response = await fetch(`/api/ratings/${id}?type=${mediaType}`);
			}

			if (response.ok) {
				const data = await response.json();
				scores = data.scores || [];
				posterCache.set(id, cacheKey, scores);
			} else {
				error = true;
			}
		} catch (e) {
			console.error('Failed to fetch ratings:', e);
			error = true;
		} finally {
			loading = false;
		}
	});

	const isHorizontal = $derived(placement === 'top' || placement === 'bottom');
	const overlayPosition = $derived(
		placement === 'top'
			? 'top-0'
			: placement === 'bottom'
				? 'bottom-0'
				: placement === 'left'
					? 'left-0'
					: 'right-0'
	);
</script>

<style>
	.rating-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.rating-logo {
		width: auto;
		object-fit: contain;
	}
</style>

<AspectRatio ratio={2 / 3} class="overflow-hidden rounded-sm">
	<div class="relative h-full w-full">
		<div class="relative h-full w-full transition-transform duration-300 hover:scale-105">
			<!-- Poster Image -->
			<img
				src={posterUrl}
				{alt}
				class="h-full w-full object-cover object-center select-none"
				loading="lazy" />

			<!-- Rating Overlay -->
			{#if !loading && !error && scores.length > 0}
				<div
					class="rating-overlay absolute {overlayPosition} {isHorizontal
						? 'left-0 right-0'
						: 'top-0 bottom-0'} flex {isHorizontal
						? 'h-[8%] flex-row items-center justify-evenly'
						: 'w-[16%] flex-col items-center justify-start gap-2 pt-2'}"
					style="background-color: rgba(0, 0, 0, {overlayOpacity});">
					{#each scores as score}
						<div class="rating-item text-white text-xs flex {isHorizontal ? 'flex-row' : 'flex-col'}">
							{#if score.image}
								<img
									src="/rating-logos/{score.image}"
									alt={score.name}
									class="rating-logo {indexer === 'anilist' ? 'h-[1rem]' : 'h-[0.8rem]'}" />
							{/if}
							<span class="font-medium">{score.score}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</AspectRatio>
