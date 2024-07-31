<script lang="ts">
	import { formatDate } from '$lib/helpers';
	import { Play } from 'lucide-svelte';

	export let data;
	export let bannerImage: string;

	let showVideo = false;
</script>

<button
	class="aspect-[2/1] h-full w-full overflow-hidden rounded-2xl"
	on:click={() => (showVideo = !showVideo)}
>
	<div class="group relative flex h-full w-full flex-col">
		<div class="z-0">
			{#if showVideo}
				<iframe
					title={data.name}
					src="https://www.youtube.com/embed/{data.key}"
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
					class="size-full object-cover object-center"
				></iframe>
			{:else}
				<img
					src={bannerImage}
					alt={data.name}
					loading="lazy"
					class="size-full object-cover object-center"
				/>
			{/if}
		</div>
		{#if !showVideo}
			<div class="z-1 absolute inset-0 bg-gradient-to-t from-zinc-900"></div>
			<div class="z-2 absolute inset-0 flex flex-col justify-end gap-2 p-4">
				<div class="flex flex-col items-start">
					<p class="line-clamp-1">{data.name}</p>
					<div class="flex items-center gap-1 text-sm text-zinc-300">
						<p>{data.type}</p>
						<p>•</p>
						<p>{formatDate(data.published_at, 'short')}</p>
					</div>
				</div>
			</div>
			<div class="absolute inset-0 z-[3] flex items-center justify-center">
				<Play
					class="size-10 rounded-full bg-white/5 text-zinc-300 backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-105"
				/>
			</div>
		{/if}
	</div>
</button>
