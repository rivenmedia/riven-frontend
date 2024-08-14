<script lang="ts">
	import { roundOff } from '$lib/helpers';
	import { Star } from 'lucide-svelte';
	import type { PageData } from './$types';
	import Header from '$lib/components/header.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Card from '$lib/components/ui/card';

	export let data: PageData;
	console.log(data);
</script>

<svelte:head>
	<title>{data.media.title || data.media.name || data.media.original_name} - Credits | Riven</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="mt-16 p-8 text-zinc-100 md:px-24 lg:px-32">
	<h1 class="text-center text-4xl text-zinc-50 md:text-left">
		{data.media.title || data.media.name || data.media.original_name}
	</h1>

	<h2 class="text-center text-xl italic text-zinc-200 md:text-left">
		&quot;{data.media.overview}&quot;
	</h2>

	<h3 class="mt-4 text-2xl">Cast</h3>
	<div class="mt-2 grid grid-cols-6 items-center justify-center gap-2 md:justify-start">
		{#each data.details.cast as castMember}
			<Card.Root class="h-full">
				<Card.Content>
					<div class="flex flex-col items-center gap-1 pt-6 text-center">
						<img
							alt={castMember.id}
							src={castMember.profile_path
								? `https://www.themoviedb.org/t/p/w185${castMember.profile_path}`
								: '/images/avatar.png'}
							loading="lazy"
							class="h-24 w-24 rounded-full object-cover object-center"
						/>
						<h2>{castMember.name}</h2>
						<h3>as {castMember.character}</h3>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<h3 class="mt-8 text-2xl">Crew</h3>
	<div class="mt-4 grid w-full grid-cols-6 gap-4">
		{#each data.details.crew as crew}
			<Card.Root class="h-full">
				<Card.Content>
					<div class="flex flex-col items-center gap-1 pt-6 text-center">
						<img
							alt={crew.id}
							src={crew.profile_path
								? `https://www.themoviedb.org/t/p/w185${crew.profile_path}`
								: '/images/avatar.png'}
							loading="lazy"
							class="h-24 w-24 rounded-full object-cover object-center"
						/>
						<h2>{crew.name}</h2>
						<h3>{crew.job}</h3>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>
