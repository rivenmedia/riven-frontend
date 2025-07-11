<script lang="ts">
	import { AspectRatio } from '$lib/components/ui/aspect-ratio/index.js';
	import { TMDB_IMAGE_BASE_URL } from '$lib/providers/tmdb';
	import Calender from '@lucide/svelte/icons/calendar';
	import Tv from '@lucide/svelte/icons/tv';

	let { data } = $props();
</script>

<AspectRatio ratio={2 / 3}>
	<img
		src={data.poster_path}
		alt={data.title}
		class="object-cover object-center transition-transform duration-300 select-none hover:scale-105"
		loading="lazy"
	/>
</AspectRatio>
<a href="/details/{data.id}" class="mt-1 block h-10 text-sm font-semibold hover:underline">
	<p class="line-clamp-2">
		{data.title}
	</p>
</a>
<div class="mt-1.5 flex flex-wrap items-center justify-between">
	<div class="flex items-center gap-0.5">
		<Calender class="text-muted-foreground size-3" />
		<p class="text-muted-foreground text-xs">
			{data.year}
		</p>
	</div>

	<div class="flex items-center gap-0.5">
		<Tv class="text-muted-foreground size-3" />
		<p class="text-muted-foreground text-xs">
			{data.media_type}
		</p>
	</div>
</div>
