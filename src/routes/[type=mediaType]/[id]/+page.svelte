<script lang="ts">
	import type { PageData } from './$types';
	import { getFormattedTime, isRivenShow } from '$lib/utils.js';
	import Header from '$lib/components/header.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Star,
		Trash2,
		ArrowUpRight,
		Tag,
		Wrench,
		RotateCcw,
		CirclePower,
		Clipboard,
		CirclePause,
		CirclePlay
	} from 'lucide-svelte';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import MediaTmdbCarousel from '$lib/components/media-tmdb-carousel.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import { statesName } from '$lib/constants';
	import clsx from 'clsx';
	import Ytembed from '$lib/components/ytembed.svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import ItemRequest from '$lib/components/item-request.svelte';
	import * as Select from '$lib/components/ui/select';
	import type { Selected } from 'bits-ui';
	import { ItemsService } from '$lib/client';
	import MediaFileSelector from '$lib/components/media-file-selector.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { RivenShow } from '$lib/types';
	import MediaItem from '$lib/components/media-item.svelte';

	export let data: PageData;

	let productionCompanies = 4;
	let isShow = data.details.media_type === 'tv';
	let selectedItems: Selected<MediaItem>[] = [];

	$: selectedIds = getSelectedIds(selectedItems);

	const getSelectedIds = (selectedItems: Selected<MediaItem>[]): Set<string> =>
		new Set(selectedItems.map((selected) => selected.value.id));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function filterSpecial(seasons: any) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return seasons.filter((season: any) => season.season_number !== 0);
	}

	async function deleteItems(ids: string[]) {
		const response = await ItemsService.removeItem({
			query: {
				ids: ids.join(',')
			}
		});

		if (!response.error) {
			toast.success('Media deleted successfully');
			invalidateAll();
		} else {
			toast.error('An error occurred while deleting the media');
		}
	}

	async function pauseItem(id: number) {
		const response = await ItemsService.pauseItems({
			query: {
				ids: id.toString()
			}
		});

		if (!response.error) {
			toast.success('Media paused successfully');
			invalidateAll();
		} else {
			toast.error('An error occurred while pausing the media');
		}
	}

	async function resumeItem(id: number) {
		const response = await ItemsService.unpauseItems({
			query: {
				ids: id.toString()
			}
		});

		if (!response.error) {
			toast.success('Media resumed successfully');
			invalidateAll();
		} else {
			toast.error('An error occurred while resuming the media');
		}
	}

	async function retryItems(ids: string[]) {
		const response = await ItemsService.retryItems({
			query: {
				ids: ids.join(',')
			}
		});

		if (!response.error) {
			toast.success('Media retried successfully');
			invalidateAll();
		} else {
			toast.error('An error occurred while retrying the media');
		}
	}

	async function resetItems(ids: string[]) {
		const response = await ItemsService.resetItems({
			query: {
				ids: ids.join(',')
			}
		});

		if (!response.error) {
			toast.success('Media reset successfully');
			invalidateAll();
		} else {
			toast.error('An error occurred while resetting the media');
		}
	}

	function getRivenSeason(season: number) {
		if (!(data.riven && 'seasons' in data.riven)) return;
		return data.riven.seasons.find((s) => s.number === season);
	}

	function getSymlinkCount(item: any): number {
		return item.seasons
			.map((s) => s.episodes.filter((e) => e.symlinked).length)
			.reduce((a, b) => a + b, 0);
	}

	function getEpisodeCount(item: any): number {
		return item.seasons.map((s) => s.episodes.length).reduce((a, b) => a + b, 0);
	}
</script>

<svelte:head>
	<title>{data.details.title || data.details.name || data.details.original_name} | Riven</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="relative flex flex-col text-zinc-100">
	<div class="fixed bottom-0 left-0 z-[-1] h-screen w-full bg-[#09101A]">
		<span>
			<img
				alt={data.details.id}
				class="h-full w-full object-cover opacity-50 blur"
				src="https://www.themoviedb.org/t/p/original{data.details.backdrop_path}"
				loading="lazy"
			/>
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
					{#if data.riven}
						<div class="flex items-center justify-center gap-2 md:justify-start">
							<Badge
								class={clsx('font-medium', {
									'bg-green-500': data.riven.state === 'Completed',
									'bg-yellow-500':
										data.riven.state === 'Downloaded' || data.riven.state === 'PartiallyCompleted',
									'bg-red-500': data.riven.state === 'Unknown'
								})}
							>
								{statesName[data.riven.state]}
							</Badge>
						</div>
					{/if}
					{#if data.details.tagline}
						<h2 class="text-center text-xl italic text-zinc-200 md:text-left">
							&quot;{data.details.tagline}&quot;
						</h2>
					{/if}
					<div class="flex flex-wrap items-center justify-center gap-3 text-base md:justify-start">
						{#if data.details.release_date || data.details.first_air_date}
							<span class="text-zinc-100">
								{data.details.release_date || data.details.first_air_date}
							</span>
						{/if}
						{#if data.details.vote_average}
							<div class="flex items-center gap-1 text-zinc-100">
								<Star class="size-4" />
								<span>{data.details.vote_average}</span>
							</div>
						{/if}
						{#if data.details.original_language}
							<span class="uppercase text-zinc-100">
								{data.details.original_language}
							</span>
						{/if}
						{#if data.details.runtime}
							<span class="uppercase text-zinc-100">
								{data.details.runtime}m
							</span>
						{/if}
					</div>
					<div class="flex flex-wrap items-center justify-center gap-1 md:justify-start">
						{#if data.details.genres}
							{#each data.details.genres as genre}
								<Badge variant="secondary" class="font-medium">{genre.name}</Badge>
							{/each}
						{/if}
					</div>
					<div class="text-center text-base font-thin leading-tight text-zinc-200 md:text-left">
						{data.details.overview}
					</div>
					<div class="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
						{#if !data.riven}
							<ItemRequest data={data.details} type={data.mediaType} />
							<MediaFileSelector
								mediaId={data.details.external_ids.imdb_id}
								mediaType={data.mediaType == 'movie' ? 'movie' : 'tv'}
							/>
						{/if}
						{#if data.riven}
							<Sheet.Root>
								<Sheet.Trigger asChild let:builder>
									<Button
										builders={[builder]}
										class="flex items-center gap-1 bg-zinc-100 text-zinc-900 transition-all duration-200 ease-in-out hover:bg-zinc-200"
									>
										<Wrench class="size-4" />
										<span>Manage</span>
									</Button>
								</Sheet.Trigger>
								<Sheet.Content class="z-[99]">
									<Sheet.Header>
										<Sheet.Title
											>{data.details.title ||
												data.details.name ||
												data.details.original_name}</Sheet.Title
										>
									</Sheet.Header>
									<Sheet.Description class="mt-2 flex flex-col gap-2">
										<p>ID: {data.riven.id}</p>
										{#if data.riven.requested_by}
											<p>Requested by: {data.riven.requested_by}</p>
										{/if}
										{#if data.riven.requested_at}
											<p>Requested at: {getFormattedTime(data.riven.requested_at)}</p>
										{/if}
										{#if isRivenShow(data.riven)}
											<p>
												Symlinked: {data.riven.seasons.every((s) =>
													s.episodes.every((e) => e.symlinked)
												)
													? 'All'
													: getSymlinkCount(data.riven) + '/' + getEpisodeCount(data.riven)}
											</p>
										{:else}
											<p>Symlinked: {data.riven.symlinked}</p>
										{/if}
										{#if data.riven.folder}
											<p class="break-words">Folder: {data.riven.folder}</p>
										{/if}
										<!-- {#if selectedIds.size > 0}
											<p>Selected items: {selectedIds.size}</p>
											{#each selectedIds as id}
												<p>{id}</p>
											{/each}
										{/if} -->

										<div class="mt-1"></div>
										{#if data.riven && isRivenShow(data.riven)}
											<Select.Root portal={null} multiple={true} bind:selected={selectedItems}>
												<Select.Trigger>
													<Select.Value placeholder="Select a season/episode" />
												</Select.Trigger>
												<Select.Content class="max-h-[600px] overflow-y-scroll sm:max-h-[300px]">
													<Select.Group>
														<Select.Label>All seasons</Select.Label>
														<Select.Item value={data.riven}>
															S{data.riven.seasons[0].number}-{data.riven.seasons[
																data.riven.seasons.length - 1
															].number}
														</Select.Item>
													</Select.Group>
													{#each data.riven.seasons as season}
														<Select.Group>
															<Select.Label>Season {season.number}</Select.Label>
															<Select.Item value={season}>
																All episodes in season {season.number}
															</Select.Item>
															{#each season.episodes as episode}
																<Select.Item value={episode}>
																	S{season.number.toString().padStart(2, '0')}E{episode.number
																		.toString()
																		.padStart(2, '0')}
																	{episode.title}
																</Select.Item>
															{/each}
														</Select.Group>
														<Select.Separator />
													{/each}
												</Select.Content>
												<Select.Input name="favoriteFruit" />
											</Select.Root>
										{/if}

										{#if data.riven.state !== 'Completed'}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<AlertDialog.Root>
														<AlertDialog.Trigger asChild let:builder>
															<Button
																builders={[builder]}
																class="flex w-full items-center gap-1"
																variant="destructive"
															>
																{#if data.riven.state === 'Paused'}
																	<CirclePlay class="size-4" />
																{:else}
																	<CirclePause class="size-4" />
																{/if}
																<span>{data.riven.state === 'Paused' ? 'Resume' : 'Pause'}</span>
															</Button>
														</AlertDialog.Trigger>
														<AlertDialog.Content>
															<AlertDialog.Header>
																<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
																<AlertDialog.Description>
																	This action will {data.riven.state === 'Paused'
																		? 'resume'
																		: 'pause'} the media
																</AlertDialog.Description>
															</AlertDialog.Header>
															<AlertDialog.Footer>
																<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
																<AlertDialog.Action
																	on:click={async () => {
																		if (data.riven) {
																			if (data.riven.state === 'Paused') {
																				await resumeItem(data.riven.id);
																			} else {
																				await pauseItem(data.riven.id);
																			}
																		}
																	}}>Continue</AlertDialog.Action
																>
															</AlertDialog.Footer>
														</AlertDialog.Content>
													</AlertDialog.Root>
												</Tooltip.Trigger>
												<Tooltip.Content>
													<p>{data.riven.state === 'Paused' ? 'Resume' : 'Pause'} the media</p>
												</Tooltip.Content>
											</Tooltip.Root>
										{/if}

										<Tooltip.Root>
											<Tooltip.Trigger>
												<AlertDialog.Root>
													<AlertDialog.Trigger asChild let:builder>
														<Button
															builders={[builder]}
															class="flex w-full items-center gap-1"
															variant="destructive"
														>
															<RotateCcw class="size-4" />
															<span>Retry</span>
														</Button>
													</AlertDialog.Trigger>
													<AlertDialog.Content>
														<AlertDialog.Header>
															<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
															<AlertDialog.Description>
																This action will remove the item from queue and insert it back
															</AlertDialog.Description>
														</AlertDialog.Header>
														<AlertDialog.Footer>
															<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
															<AlertDialog.Action
																on:click={async () => {
																	await retryItems(
																		selectedIds.size > 0 ? Array.from(selectedIds) : [data.riven.id]
																	);
																}}>Continue</AlertDialog.Action
															>
														</AlertDialog.Footer>
													</AlertDialog.Content>
												</AlertDialog.Root>
											</Tooltip.Trigger>
											<Tooltip.Content>
												<p>Removes the item and add it again to the queue</p>
											</Tooltip.Content>
										</Tooltip.Root>

										<Tooltip.Root>
											<Tooltip.Trigger>
												<AlertDialog.Root>
													<AlertDialog.Trigger asChild let:builder>
														<Button
															builders={[builder]}
															class="flex w-full items-center gap-1"
															variant="destructive"
														>
															<CirclePower class="size-4" />
															<span>Reset</span>
														</Button>
													</AlertDialog.Trigger>
													<AlertDialog.Content>
														<AlertDialog.Header>
															<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
															<AlertDialog.Description>
																This action will reset the media to its initial state and blacklist
																the torrent
															</AlertDialog.Description>
														</AlertDialog.Header>
														<AlertDialog.Footer>
															<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
															<AlertDialog.Action
																on:click={async () => {
																	if (data.riven) {
																		await resetItems(
																			selectedIds.size > 0
																				? Array.from(selectedIds)
																				: [data.riven.id]
																		);
																	}
																}}>Continue</AlertDialog.Action
															>
														</AlertDialog.Footer>
													</AlertDialog.Content>
												</AlertDialog.Root>
											</Tooltip.Trigger>
											<Tooltip.Content>
												<p>Blacklist the torrent added and scrapes again</p>
											</Tooltip.Content>
										</Tooltip.Root>

										<Dialog.Root>
											<Dialog.Trigger>
												<Button class="flex w-full items-center gap-1">
													<Clipboard class="size-4" />
													<span>Item data</span>
												</Button>
											</Dialog.Trigger>
											<Dialog.Content class="p-4">
												<Dialog.Header>
													<Dialog.Title>{data.riven.title}</Dialog.Title>
												</Dialog.Header>
												<Button
													on:click={() => {
														navigator.clipboard.writeText(JSON.stringify(data.riven, null, 2));
														toast.success('Item data copied to clipboard');
													}}
												>
													Copy json
												</Button>
												<div class="mt-4 max-h-[400px] overflow-auto rounded bg-zinc-800 p-2">
													<pre
														class="whitespace-pre-wrap break-all text-sm text-zinc-100">{JSON.stringify(
															data.riven,
															null,
															2
														)}</pre>
												</div>
											</Dialog.Content>
										</Dialog.Root>
									</Sheet.Description>
								</Sheet.Content>
							</Sheet.Root>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<MediaFileSelector
										mediaId={data.riven.id}
										mediaType={data.mediaType == 'movie' ? 'movie' : 'tv'}
									/>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Scrapes torrents for the item</p>
								</Tooltip.Content>
							</Tooltip.Root>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<AlertDialog.Root>
										<AlertDialog.Trigger asChild let:builder>
											<Button
												builders={[builder]}
												class="flex items-center gap-1"
												variant="destructive"
											>
												<Trash2 class="size-4" />
												<span>Delete</span>
											</Button>
										</AlertDialog.Trigger>
										<AlertDialog.Content>
											<AlertDialog.Header>
												<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
												<AlertDialog.Description>
													This action cannot be undone. This will permanently delete the media from
													your library.
												</AlertDialog.Description>
											</AlertDialog.Header>
											<AlertDialog.Footer>
												<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
												<AlertDialog.Action
													on:click={async () => {
														if (data.riven) {
															await deleteItems([data.riven.id]);
														}
													}}>Continue</AlertDialog.Action
												>
											</AlertDialog.Footer>
										</AlertDialog.Content>
									</AlertDialog.Root>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Delete item from library</p>
								</Tooltip.Content>
							</Tooltip.Root>
						{/if}
					</div>
					{#if data.details.belongs_to_collection}
						<div class="relative mt-4 flex h-full w-full flex-col">
							<div class="z-[-1] w-full">
								<img
									alt={data.details.belongs_to_collection.id}
									src={data.details.belongs_to_collection.backdrop_path
										? `https://www.themoviedb.org/t/p/w1280${data.details.belongs_to_collection.backdrop_path}`
										: 'https://via.placeholder.com/1280x720.png?text='}
									loading="lazy"
									class="h-full max-h-16 w-full rounded-2xl object-cover object-center"
								/>
							</div>
							<div
								class="absolute inset-0 z-[0] h-full w-full rounded-2xl bg-gradient-to-t from-zinc-900"
							></div>
							<div
								class="absolute inset-0 z-[1] flex items-center justify-between gap-1 p-4 text-zinc-200"
							>
								<h2 class="text-base font-medium">
									{data.details.belongs_to_collection.name}
								</h2>
								<Button
									href="/collection/{data.details.belongs_to_collection.id}"
									variant="link"
									class="text-zinc-200">View Collection</Button
								>
							</div>
						</div>
					{/if}
					{#if data.details.credits && data.details.credits.cast.length > 0}
						<div
							class="mt-2 flex flex-row flex-wrap items-center justify-center gap-2 md:justify-start"
						>
							{#each data.details.credits.cast as cast, i}
								{#if i < 9}
									<Tooltip.Root>
										<Tooltip.Trigger>
											<div class="flex flex-col items-center gap-1">
												<a href="/people/{cast.id}">
													<img
														alt={cast.id}
														src={cast.profile_path
															? `https://www.themoviedb.org/t/p/w185${cast.profile_path}`
															: '/images/avatar.png'}
														loading="lazy"
														class="h-16 w-16 rounded-full object-cover object-center"
													/>
												</a>
											</div>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>{cast.name} as</p>
											<p>{cast.character}</p>
										</Tooltip.Content>
									</Tooltip.Root>
								{/if}
							{/each}
							{#if data.details.credits.cast.length > 9}
								<Button
									variant="link"
									href="/{data.mediaType}/{data.details.id}/credits"
									class="flex gap-1 text-zinc-100"
								>
									<ArrowUpRight class="size-4" />
									<span>View All</span>
								</Button>
							{/if}
						</div>
					{/if}
				</div>
			</div>
			<div class="mt-8 flex w-full flex-col items-start gap-8 md:flex-row">
				<div class="flex w-full flex-col items-start md:w-[70%]">
					{#if data.details.credits && data.details.credits.crew.length > 0}
						<div class="grid w-full grid-cols-3 gap-4">
							{#each data.details.credits.crew as crew, i}
								{#if i < 6}
									<div class="flex flex-col gap-1">
										<p class="text-lg font-medium text-zinc-100">{crew.job}</p>
										<p class="text-zinc-200">{crew.name}</p>
									</div>
								{/if}
							{/each}
						</div>
					{/if}
					{#if data.details.keywords}
						{@const keywords = data.details.keywords.keywords || data.details.keywords.results}
						<div class="mt-8 flex w-full flex-wrap gap-2">
							{#each keywords as keyword}
								<Badge class="flex items-center gap-2 bg-secondary/50 font-medium">
									<Tag class="size-4" />
									<span>{keyword.name}</span>
								</Badge>
							{/each}
						</div>
					{/if}
				</div>

				<div class="flex w-full flex-col md:w-[30%]">
					<div class="flex flex-1 flex-col rounded-lg bg-zinc-50/10">
						{#if data.details.status}
							<div
								class="flex items-center justify-between gap-2 p-2 last-of-type:border-none md:p-3"
							>
								<h2 class="text-zinc-100">Status</h2>
								<span class="text-sm text-zinc-300">{data.details.status}</span>
							</div>
						{/if}
						{#if data.details.revenue}
							<div
								class="flex items-center justify-between gap-2 p-2 last-of-type:border-none md:p-3"
							>
								<h2 class="text-zinc-100">Revenue</h2>
								<span class="text-sm text-zinc-300">
									${data.details.revenue.toLocaleString()}
								</span>
							</div>
						{/if}
						{#if data.details.budget}
							<div
								class="flex items-center justify-between gap-2 p-2 last-of-type:border-none md:p-3"
							>
								<h2 class="text-zinc-100">Budget</h2>
								<span class="text-sm text-zinc-300">
									${data.details.budget.toLocaleString()}
								</span>
							</div>
						{/if}
						{#if data.details.production_countries}
							<div
								class={clsx('flex justify-between gap-2 p-2 last-of-type:border-none md:p-3', {
									'items-center': data.details.production_countries.length === 1,
									'items-start': data.details.production_countries.length > 1
								})}
							>
								<h2 class="text-zinc-100">Countries</h2>
								<span class="flex flex-col items-end">
									<ul class="mb-2 space-y-1 text-right text-sm text-zinc-300">
										{#each data.details.production_countries as country}
											<li class="line-clamp-1">{country.name}</li>
										{/each}
									</ul>
								</span>
							</div>
						{/if}
						{#if data.details.production_companies}
							<div
								class={clsx('flex justify-between gap-2 p-2 last-of-type:border-none md:p-3', {
									'items-center': data.details.production_companies.length === 1,
									'items-start': data.details.production_companies.length > 1
								})}
							>
								<h2 class="text-zinc-100">Companies</h2>
								<span class="flex flex-col items-end">
									<ul class="mb-2 space-y-1 text-right text-sm text-zinc-300">
										{#each data.details.production_companies as company, i}
											{#if i < productionCompanies}
												<li class="line-clamp-1">{company.name}</li>
											{/if}
										{/each}
									</ul>

									{#if data.details.production_companies.length > 4}
										<Button
											on:click={() => {
												productionCompanies =
													productionCompanies < data.details.production_companies.length
														? data.details.production_companies.length
														: 4;
											}}
											variant="link"
											class="text-zinc-200"
										>
											{productionCompanies < data.details.production_companies.length
												? 'View All'
												: 'View Less'}
										</Button>
									{/if}
								</span>
							</div>
						{/if}
					</div>
				</div>
			</div>

			{#if data.details.seasons}
				<div class="mt-16 flex w-full select-none flex-col gap-4 rounded-lg bg-zinc-50/10 p-8">
					<h3 class="text-2xl text-zinc-100">Seasons</h3>

					<div class="relative flex w-full cursor-pointer flex-wrap">
						{#each filterSpecial(data.details.seasons) as season}
							<a
								href="/tv/{data.mediaID}/{season.season_number}"
								class="group relative aspect-[2/1] h-fit w-full p-2 sm:w-1/2 md:w-1/3 lg:w-1/4"
							>
								<div class="h-full w-full overflow-hidden rounded-lg bg-white/10 shadow-xl">
									<img
										alt={season.id}
										src={season.poster_path
											? `https://www.themoviedb.org/t/p/w780${season.poster_path}`
											: 'https://via.placeholder.com/198x228.png?text=No+thumbnail'}
										class=" h-full w-full object-cover brightness-75 transition-all duration-300 ease-in-out group-hover:scale-105"
										loading="lazy"
									/>
									<div class="absolute left-0 top-0 flex h-full w-full flex-col px-4 py-3">
										<div
											class="line-clamp-2 w-fit rounded-md bg-zinc-900/60 px-2 text-sm font-medium capitalize text-white sm:text-base"
										>
											Season {season.season_number}
										</div>

										<div class="mt-auto flex w-full justify-between">
											{#if data.riven}
												<div>
													{#if getRivenSeason(season.season_number)?.state == 'Completed'}
														<Badge class="bg-green-500 font-medium">Completed</Badge>
													{:else if getRivenSeason(season.season_number)?.state == 'Downloaded' || getRivenSeason(season.season_number)?.state == 'PartiallyCompleted'}
														<Badge class="bg-yellow-500 font-medium">Downloaded</Badge>
													{:else}
														<Badge class="font-medium"
															>{getRivenSeason(season.season_number)?.state}</Badge
														>
													{/if}
												</div>
											{/if}
											<div
												class="self-end rounded-md bg-zinc-900/60 px-2 text-xs text-white sm:text-sm"
											>
												{season.episode_count ? season.episode_count : 'N/A'} episodes
											</div>
										</div>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<div class="mt-16 w-full select-none">
				{#if data.details.videos && data.details.videos.results.length > 0}
					<Carousel.Root
						opts={{
							dragFree: true,
							slidesToScroll: 'auto'
						}}
						class="mt-4 h-full overflow-hidden"
					>
						<div class="mb-2 flex items-center justify-between">
							<h3 class="text-2xl text-zinc-100">Related Videos</h3>
							<div class="flex items-center gap-1 text-zinc-900 dark:text-zinc-100">
								<Carousel.Previous class="static mt-8 h-8 w-8 rounded-md" />
								<Carousel.Next class="static mt-8 h-8 w-8 rounded-md" />
							</div>
						</div>
						<Carousel.Content class="h-full w-full">
							{#each data.details.videos.results as video}
								<Carousel.Item
									class="basis-11/12 sm:basis-10/12 md:basis-1/2 lg:basis-1/3 2xl:basis-1/4"
								>
									<Ytembed
										data={video}
										bannerImage={`https://www.themoviedb.org/t/p/w780${data.details.backdrop_path}`}
									/>
								</Carousel.Item>
							{/each}
						</Carousel.Content>
					</Carousel.Root>
				{/if}
			</div>

			<div class="mb-32 mt-8 flex w-full select-none flex-col gap-8">
				{#if data.details.recommendations && data.details.recommendations.results.length > 0}
					<MediaTmdbCarousel
						name="Recommendations"
						results={data.details.recommendations.results}
						mediaType={data.mediaType}
					/>
				{/if}

				{#if data.details.similar && data.details.similar.results.length > 0}
					<MediaTmdbCarousel
						name="Similar titles"
						results={data.details.similar.results}
						mediaType={data.mediaType}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>
