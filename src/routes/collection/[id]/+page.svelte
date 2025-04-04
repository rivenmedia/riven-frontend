<script lang="ts">
	import { roundOff } from '$lib/helpers';
	import { Star } from 'lucide-svelte';
	import type { PageData } from './$types';
	import ItemRequest from '$lib/components/item-request.svelte';
	import Header from '$lib/components/header.svelte';
	import { fade } from 'svelte/transition';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { getExternalID } from '$lib/tmdb';
	import { ItemsService } from '$lib/client';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	const original_backdrop_path = data.details.backdrop_path;
	let backdrop_path = data.details.backdrop_path;

	async function fetchExternalId(type: string, id: number) {
		try {
			const externalIds = await getExternalID(fetch, type, id);
			if (externalIds.imdb_id) {
				return externalIds.imdb_id;
			}
		} catch (error) {
			console.error('Error fetching external ID:', error);
		}
	}

	async function fetchExternalIds(data: any[]) {
		const externalIds = await Promise.all(
			data.map((item: any) => fetchExternalId(item.media_type, item.id))
		);
		return externalIds;
	}

	async function requestItem() {
		const externalIds = await fetchExternalIds(data.details.parts);
		const externalIdsString = externalIds.join(',');
		const response = await ItemsService.addItems({
			query: {
				imdb_ids: externalIdsString
			}
		});

		if (!response.error) {
			toast.success('Media requested successfully');
		} else {
			toast.error('An error occurred while requesting the media');
		}
	}
</script>

<svelte:head>
	<title>{data.details.name} | Riven</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="relative flex flex-col text-zinc-100">
	<div class="fixed bottom-0 left-0 z-[-1] h-screen w-full bg-[#09101A]">
		<span>
			{#key backdrop_path}
				<img
					in:fade={{ duration: 200 }}
					out:fade={{ duration: 200 }}
					alt={data.details.id}
					class="h-full w-full object-cover opacity-50 blur"
					src="https://www.themoviedb.org/t/p/original{backdrop_path}"
					loading="lazy"
				/>
			{/key}
			<div
				class="absolute bottom-0 left-0 right-0 h-full w-full bg-gradient-to-b from-transparent to-slate-900 to-80%"
			/>
		</span>
	</div>
	<div class="absolute z-[2] mt-32 flex h-full w-full flex-col items-center p-8 md:px-24 lg:px-32">
		<div class="mx-auto flex w-full max-w-7xl flex-col">
			<div class="flex w-full flex-col items-center md:flex-row md:items-start">
				<div class="w-[180px] flex-shrink-0 overflow-hidden md:w-[25%]">
					<div
						class="aspect-[1/1.5] flex-shrink-0 overflow-hidden rounded-lg backdrop-blur md:rounded-xl"
					>
						<img
							alt={data.details.id}
							src="https://www.themoviedb.org/t/p/w780{data.details.poster_path}"
							class="h-full w-full object-cover object-center"
						/>
					</div>
				</div>
				<div class="flex w-full flex-col gap-2 md:w-[75%] md:pl-12 lg:pl-16">
					<h1 class="text-center text-4xl text-zinc-50 md:text-left">
						{data.details.title || data.details.name || data.details.original_name}
					</h1>
					<div class="text-center text-base font-thin leading-tight text-zinc-200 md:text-left">
						{data.details.overview}
					</div>

					<div class="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
						<AlertDialog.Root>
							<AlertDialog.Trigger>
								<Button>Request Collection</Button>
							</AlertDialog.Trigger>
							<AlertDialog.Content>
								<AlertDialog.Header>
									<AlertDialog.Title
										>Requesting {data.details.title ||
											data.details.name ||
											data.details.original_name}</AlertDialog.Title
									>
								</AlertDialog.Header>
								<AlertDialog.Footer>
									<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
									<AlertDialog.Action
										on:click={async () => {
											await requestItem();
										}}>Continue</AlertDialog.Action
									>
								</AlertDialog.Footer>
							</AlertDialog.Content>
						</AlertDialog.Root>
					</div>
				</div>
			</div>

			{#if data.details.parts}
				<div class="mt-16 flex w-full select-none flex-col gap-4 rounded-lg bg-zinc-50/10 p-8">
					<h3 class="text-2xl text-zinc-100">Collection Items</h3>

					<div class="relative flex w-full cursor-pointer flex-wrap">
						{#each data.details.parts as item}
							<div
								role="button"
								tabindex="0"
								on:mouseenter={() => (backdrop_path = item.backdrop_path)}
								on:mouseleave={() => (backdrop_path = original_backdrop_path)}
								class="group relative mb-2 flex w-full flex-shrink-0 flex-col gap-2 rounded-lg p-2 md:w-1/2 lg:w-1/3 xl:w-1/4 xl:p-[.4rem]"
							>
								<div class="relative aspect-[1/1.5] w-full overflow-hidden rounded-lg">
									<img
										src="https://image.tmdb.org/t/p/w342{item.poster_path}"
										alt={item.title || item.name}
										loading="lazy"
										class="h-full w-full object-cover object-center transition-all duration-300 ease-in-out group-hover:scale-105"
									/>
									<div
										class="absolute right-0 top-1 flex items-center justify-center gap-1 rounded-l-md bg-slate-900/70 px-[5px] py-1"
									>
										<Star class="size-3 text-yellow-400" />
										<span class="text-xs font-light text-white">
											{roundOff(item.vote_average)}
										</span>
									</div>
									<a
										href="/{item.media_type}/{item.id}"
										class="absolute inset-0 hidden flex-col justify-end from-zinc-900/70 p-2 group-hover:flex group-hover:bg-gradient-to-t"
									>
										<ItemRequest data={item} type={item.media_type} />
									</a>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
