<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$lib/components/header.svelte';
	import * as Card from '$lib/components/ui/card';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.media.title || data.media.name || data.media.original_name} - Credits | Riven</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="relative flex flex-col text-zinc-100">
	<div class="fixed bottom-0 left-0 z-[-1] h-screen w-full bg-[#09101A]">
		<span>
			<img
				alt={data.media.id}
				class="h-full w-full object-cover opacity-50 blur"
				src="https://www.themoviedb.org/t/p/original{data.media.backdrop_path}"
				loading="lazy"
			/>
			<div
				class="absolute bottom-0 left-0 right-0 h-full w-full bg-gradient-to-b from-transparent to-zinc-900/55"
			></div>
		</span>
	</div>
	<div class="absolute z-[2] mt-32 flex h-full w-full flex-col items-center p-8 md:px-24 lg:px-32">
		<div class="flex max-w-7xl flex-col gap-2">
			<h3 class="text-center text-3xl text-zinc-50 md:text-left lg:text-4xl">
				{data.media.title || data.media.name || data.media.original_name}
			</h3>

			<p class="text-center text-lg font-thin italic text-zinc-200 md:text-left lg:text-xl">
				&quot;{data.media.overview}&quot;
			</p>

			<h3 class="mt-8 text-2xl">Cast</h3>
			<div
				class="mt-2 grid w-full select-none grid-cols-2 rounded-lg bg-zinc-50/10 p-8 sm:grid-cols-3 md:grid-cols-4 md:justify-start lg:grid-cols-5 2xl:grid-cols-6"
			>
				{#each data.details.cast as castMember}
					<Card.Root class="h-full border-none bg-transparent text-zinc-100">
						<Card.Content>
							<a href="/people/{castMember.id}" class="flex flex-col items-center text-center">
								<img
									alt={castMember.id}
									src={castMember.profile_path
										? `https://www.themoviedb.org/t/p/w185${castMember.profile_path}`
										: '/images/avatar.png'}
									loading="lazy"
									class="h-24 w-24 rounded-full object-cover object-center"
								/>
								<p class="mt-2">{castMember.name}</p>
								<p>as {castMember.character}</p>
							</a>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>

			<h3 class="mt-8 text-2xl">Crew</h3>
			<div
				class="mt-2 grid w-full select-none grid-cols-2 rounded-lg bg-zinc-50/10 p-8 sm:grid-cols-3 md:grid-cols-4 md:justify-start lg:grid-cols-5 2xl:grid-cols-6"
			>
				{#each data.details.crew as crew}
					<Card.Root class="h-full border-none bg-transparent text-zinc-100">
						<Card.Content>
							<a href="/people/{crew.id}" class="flex flex-col items-center text-center">
								<img
									alt={crew.id}
									src={crew.profile_path
										? `https://www.themoviedb.org/t/p/w185${crew.profile_path}`
										: '/images/avatar.png'}
									loading="lazy"
									class="h-24 w-24 rounded-full object-cover object-center"
								/>
								<p class="mt-1">{crew.name}</p>
								<p>{crew.job}</p>
							</a>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- <div class="mt-32 p-8 text-zinc-100 md:px-24 lg:px-32">


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
</div> -->
