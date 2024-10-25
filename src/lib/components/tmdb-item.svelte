<script lang="ts">
	import type { TMDBItem } from '$lib/types';

	export let data: TMDBItem;
	export let mediaType: string;

	const type = data.media_type || mediaType;
</script>

<a
	href="/{type}/{data.id}"
	class="relative block h-full w-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:scale-105"
>
	<img
		src="https://www.themoviedb.org/t/p/w780{data.poster_path}"
		alt={data.title || data.name}
		class="h-full w-full object-cover object-center"
		loading="lazy"
	/>
	<div
		class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-4"
	>
		<h3 class="mb-1 line-clamp-2 text-lg text-white">{data.title || data.name}</h3>
	</div>
</a>
