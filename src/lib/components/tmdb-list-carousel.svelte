<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ListCarousel from './list-carousel.svelte';

	let trendingTimeWindow = $state<'day' | 'week'>('day');

	let { data = $bindable(), type } = $props();
</script>

<div class="flex flex-col">
	<div class="flex items-center justify-between">
		<div class="flex max-w-max items-center gap-2">
			<h2
				class="text-muted-foreground mb-4 max-w-max text-base font-semibold md:text-xl lg:text-2xl"
			>
				Trending {type === 'movie' ? 'Movies' : 'TV Shows'}
			</h2>
			<Select.Root
				bind:value={trendingTimeWindow}
				onValueChange={async (value) => {
					const response = await fetch(`/api/tmdb/${type}/${value}/trending`);
					if (!response.ok) {
						throw new Error(`Failed to fetch trending ${type}`);
					}
					data = await response.json();
				}}
				type="single"
			>
				<Select.Trigger class="w-28">
					{trendingTimeWindow === 'day' ? 'Today' : 'This Week'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="day">Today</Select.Item>
					<Select.Item value="week">This Week</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		<Button variant="link" href="/{type}/{trendingTimeWindow}/trending">View All</Button>
	</div>

	<ListCarousel bind:data />
</div>
