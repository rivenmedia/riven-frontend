<script lang="ts">
	import type { PageData } from './$types';
	import { cn, isRivenShow } from '$lib/utils.js';
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
		Magnet,
		LoaderCircle,
		ScanSearch
	} from 'lucide-svelte';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import MediaTmdbCarousel from '$lib/components/media-tmdb-carousel.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import { statesName } from '$lib/constants';
	import clsx from 'clsx';
	import Ytembed from '$lib/components/ytembed.svelte';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import ItemRequest from '$lib/components/item-request.svelte';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import type { Selected } from 'bits-ui';
	import {
		ItemsService,
		ScrapeService,
		type GetCachedStatusResponse,
		type ScrapedTorrent,
		type ScrapeResponse
	} from '$lib/client';
	import Card from '$lib/components/ui/card/card.svelte';

	export let data: PageData;

	type CustomScrapedData = ScrapeResponse & { parsed_data: { [key: string]: any } }[];

	let productionCompanies = 4;
	let magnetLink = '';
	let magnetLoading = false;
	let isShow = data.details.media_type === 'tv';
	let selectedMagnetItem: Selected<{ id: string; file?: string; folder?: string }>;
	let isScraping = false;
	$: buttonEnabled = magnetLink && !magnetLoading && (isShow ? selectedMagnetItem : true);

	let scrapedItems: CustomScrapedData = [];
	let allResolutions: string[];
	$: allResolutions = scrapedItems
		.map((item) => item.parsed_data.resolution)
		.filter((value, index, self) => self.indexOf(value) === index)
		.filter((value) => value !== undefined);
	let filteredScrapedItems: CustomScrapedData;
	$: filteredScrapedItems = scrapedItems.filter((item) =>
		selectedResolutionFilter.length > 0
			? selectedResolutionFilter
					.map((filter) => filter.value)
					.some((resolution) => item.parsed_data.resolution === resolution)
			: true
	);
	let selectedResolutionFilter: Selected<string>[];
	$: selectedResolutionFilter = [];
	let scrapedItemsAvailability: { [key: string]: any } | undefined = {};
	$: scrapedItemsAvailability

	let selectedScrapedItem: ScrapedTorrent | undefined;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function filterSpecial(seasons: any) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return seasons.filter((season: any) => season.season_number !== 0);
	}

	async function deleteItem(id: number) {
		const response = await ItemsService.removeItem({
			query: {
				ids: id.toString()
			}
		});

		if (!response.error) {
			toast.success('Media deleted successfully');
			goto('/library');
		} else {
			toast.error('An error occurred while deleting the media');
		}
	}

	async function retryItem(id: number) {
		const response = await ItemsService.retryItems({
			query: {
				ids: id.toString()
			}
		});

		if (!response.error) {
			toast.success('Media retried successfully');
			invalidateAll();
		} else {
			toast.error('An error occurred while retrying the media');
		}
	}

	async function resetItem(id: number) {
		const response = await ItemsService.resetItems({
			query: {
				ids: id.toString()
			}
		});

		if (!response.error) {
			toast.success('Media reset successfully');
			invalidateAll();
		} else {
			toast.error('An error occurred while resetting the media');
		}
	}

	function getTime(time: string) {
		const date = new Date(time);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function addMagnetLink(id: number, magnet: string) {
		if (!magnet) {
			toast.error('Magnet link cannot be empty');
			return;
		}
		if (isShow && !selectedMagnetItem) {
			toast.error('Select a season/episode');
			return;
		}
		if (magnetLoading) return;
		magnetLoading = true;
		const idToSet = isShow ? parseInt(selectedMagnetItem.value.id) : id;
		const { error } = await ItemsService.setTorrentRdMagnet({
			path: {
				id: idToSet
			},
			query: {
				magnet
			}
		});
		magnetLoading = false;
		if (error) {
			toast.error((error as string) ?? 'Unknown error');
			return;
		}
		toast.success('Magnet link added successfully');
	}

	async function addItemManually(imdb_id: string, input: string) {
		if (!input) {
			toast.error('Input cannot be empty');
			return;
		}
		const { data, error } = await ItemsService.addItemManually({
			query: {
				imdb_id,
				input
			}
		});
		if (error) {
			toast.error((error as string) ?? 'Unknown error');
			return;
		}
		toast.success(data?.message ?? 'Processing of the item has started');
	}

	async function scrapeForItem() {
		isScraping = true;
		const { data: responseData, error } = await ScrapeService.scrape({
			query: {
				imdb_id: data.details.external_ids.imdb_id
			}
		});
		isScraping = false;
		if (error) {
			toast.error((error as string) ?? 'Error while scraping');
			return;
		}
		scrapedItems = responseData.sort((a, b) => b.rank - a.rank);
	}

	async function getCachedStatusForScrapedItems() {
		const { data: responseData, error } = await ScrapeService.getCachedStatus({
			query: {
				infohashes: scrapedItems.map((item) => item.infohash).join(',')
			}
		});
		if (error) {
			toast.error((error as string) ?? 'Error while getting cached status');
			return;
		}
		scrapedItemsAvailability = responseData;
	}

	function getFilenamesOfSelectedScrapedItem() {
		if (!selectedScrapedItem) return new Set<string>();
		return getFilenamesOfScrapedItem(selectedScrapedItem);																							
	}

	function getFilenamesOfScrapedItem(item: ScrapedTorrent) {
		if (!scrapedItemsAvailability) return new Set<string>();
		if (!scrapedItemsAvailability[item.infohash]) return new Set<string>();
		return new Set<string>(scrapedItemsAvailability[item.infohash].flatMap((fileData: any) => Object.values(fileData).map(item => (item as any).filename)))																								
	}

	function getResolutionColor(resolution: string) {
		const res = resolution.toLowerCase();

		if (res == '2160p') {
			return 'bg-purple-500 hover:bg-purple-600';
		}
		if (res == '1440p') {
			return 'bg-indigo-500 hover:bg-indigo-600';
		}
		if (res == '1080p') {
			return 'bg-blue-500 hover:bg-blue-600';
		}
		if (res == '720p') {
			return 'bg-yellow-500 hover:bg-yellow-600 text-black';
		}
		return 'bg-pink-500 hover:bg-pink-600'; // Default for lower resolutions
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
						<Sheet.Root>
							<Sheet.Trigger asChild let:builder>
								<Button
									builders={[builder]}
									class="flex items-center gap-1 bg-zinc-100 text-zinc-900 transition-all duration-200 ease-in-out hover:bg-zinc-200"
								>
									<Wrench class="size-4" />
									<span>
										{#if data.riven}Manage{:else}Add torrent
										{/if}</span
									>
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
									{#if data.riven}
										<p>ID: {data.riven.id}</p>
										{#if data.riven.requested_by}
											<p>Requested by: {data.riven.requested_by}</p>
										{/if}
										{#if data.riven.requested_at}
											<p>Requested at: {getTime(data.riven.requested_at)}</p>
										{/if}
										<p>Symlinked: {data.riven.symlinked}</p>
										{#if data.riven.folder}
											<p>Folder: {data.riven.folder}</p>
										{/if}
										{#if isShow && selectedMagnetItem && selectedMagnetItem.value.file}
											<p>Selected item file: {selectedMagnetItem.value.file}</p>
										{:else if isShow && selectedMagnetItem && selectedMagnetItem.value.folder}
											<p>Selected item folder: {selectedMagnetItem.value.folder}</p>
										{/if}

										<div class="mt-1"></div>
									{/if}
									{#if data.riven && isRivenShow(data.riven)}
										<Select.Root portal={null} bind:selected={selectedMagnetItem}>
											<Select.Trigger>
												<Select.Value placeholder="Select a season/episode" />
											</Select.Trigger>
											<Select.Content class="max-h-[600px] overflow-y-scroll sm:max-h-[300px]">
												<Select.Group>
													{#each data.riven.seasons as season}
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
													{/each}
												</Select.Group>
											</Select.Content>
											<Select.Input name="favoriteFruit" />
										</Select.Root>
									{/if}

									<Input bind:value={magnetLink} placeholder="Paste in the magnet link" />

									<Tooltip.Root>
										<Tooltip.Trigger class="mb-2">
											<Button
												class="flex w-full items-center gap-1"
												disabled={!buttonEnabled}
												on:click={async () => {
													if (data.riven && magnetLink) {
														await addMagnetLink(data.riven.id, magnetLink);
													} else if (magnetLink) {
														await addItemManually(data.details.external_ids.imdb_id, magnetLink);
													}
												}}
											>
												{#if magnetLoading}
													<LoaderCircle class="size-4 animate-spin" />
												{:else}
													<Magnet class="size-4" />
												{/if}
												<span
													>{#if data.riven}Replace{:else}Add{/if} torrent</span
												>
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>Replaces the current torrent with the magnet link</p>
										</Tooltip.Content>
									</Tooltip.Root>
									{#if data.riven}
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
																	if (data.riven) {
																		await retryItem(data.riven.id);
																	}
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
																		await resetItem(data.riven.id);
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
										<Button
											class="flex w-full items-center gap-1"
											variant="destructive"
											on:click={() => {
												navigator.clipboard.writeText(JSON.stringify(data.riven, null, 2));
												toast.success('Item data copied to clipboard');
											}}
										>
											<Clipboard class="size-4" />
											<span>Copy item data</span>
										</Button>
									{/if}
								</Sheet.Description>
							</Sheet.Content>
						</Sheet.Root>
						{#if !data.riven}
							<ItemRequest data={data.details} type={data.mediaType} />
						{/if}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Dialog.Root>
									<Dialog.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											class="flex w-full items-center gap-1"
											variant="default"
											on:click={async () => {
												scrapeForItem().then(() => {
													getCachedStatusForScrapedItems();
												});
											}}
										>
											<ScanSearch class="size-4" />
											<span>Scrape</span>
										</Button>
									</Dialog.Trigger>
									<Dialog.Content class="max-w-[50%]">
										<Dialog.Header>
											<Dialog.Title>
												<div class="flex flex-row items-center gap-4">
													Results
													<Select.Root bind:selected={selectedResolutionFilter} multiple>
														<Select.Trigger>
															<Select.Value placeholder="Filter by resolution" />
														</Select.Trigger>
														<Select.Content>
															{#each allResolutions as resolution}
																<Select.Item value={resolution}>{resolution}</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												</div>
											</Dialog.Title>
											<Dialog.Description
												class="max-h-[35rem] overflow-x-hidden overflow-y-scroll pt-4"
											>
												{#if isScraping}
													<p>Scraping...</p>
												{:else}
													<div class="grid grid-cols-1 gap-2">
														{#if scrapedItems.length === 0}
															<p>No results found</p>
														{:else}
															{#if filteredScrapedItems.length === 0}
																<p>No results found for the selected resolutions</p>
															{/if}
															{#each filteredScrapedItems as item}
																<Card class="relative p-4">
																	<Badge
																		class={cn(
																			'absolute right-4 top-4',
																			item.rank > 0
																				? 'bg-green-500 hover:bg-green-600'
																				: 'bg-red-500 hover:bg-red-600'
																		)}>{item.rank}</Badge
																	>
																	<div class="flex flex-col gap-2">
																		<div class="pr-16">
																			<div>{item.raw_title}</div>
																			<div class="mt-2 flex flex-row flex-wrap gap-2">
																				{#each ['resolution', 'quality', 'hdr', 'audio', 'codec', 'languages'] as key}
																					{#if item.parsed_data[key]}
																						{#if Array.isArray(item.parsed_data[key])}
																							{#each item.parsed_data[key] as value}
																								<Badge
																									class={`text-nowrap font-medium ${
																										key === 'resolution'
																											? getResolutionColor(value)
																											: 'bg-secondary/50 uppercase'
																									}`}
																								>
																									{value}
																								</Badge>
																							{/each}
																						{:else}
																							<Badge
																								class={`text-nowrap font-medium ${
																									key === 'resolution'
																										? getResolutionColor(item.parsed_data[key])
																										: 'bg-secondary/50 uppercase'
																								}`}
																							>
																								{item.parsed_data[key]}
																							</Badge>
																						{/if}
																					{/if}
																				{/each}
																				{#if scrapedItemsAvailability}
																					<Badge
																						class={`text-nowrap font-medium ${
																							(scrapedItemsAvailability[item.infohash]?.length ||
																								0) > 0
																								? 'bg-green-500 hover:bg-green-600'
																								: 'bg-red-500 hover:bg-red-600'
																						}`}
																					>
																						{(scrapedItemsAvailability[item.infohash]?.length ||
																							0) > 0
																							? `Cached (${
																								getFilenamesOfScrapedItem(item).size
																								} file${getFilenamesOfScrapedItem(item).size > 1 ? 's' : ''})`
																							: 'Uncached'}
																					</Badge>
																				{/if}
																			</div>
																			<!-- <div class="mt-2">{item.infohash}</div> -->
																		</div>
																		<div class="mt-2 flex w-full flex-row gap-2">
																			<Button
																				on:click={async () => {
																					navigator.clipboard.writeText(item.infohash);
																					toast.success('Infohash copied to clipboard');
																				}}
																				size="sm"
																				class="flex-1"
																				variant="outline"
																			>
																				<span>Copy Infohash</span>
																			</Button>
																			<div class="flex-1">
																				<Tooltip.Root>
																					<Tooltip.Trigger>
																						<Dialog.Root>
																							<Dialog.Trigger asChild let:builder>
																								<Button
																									builders={[builder]}
																									on:click={async () => {
																										selectedScrapedItem = item;
																									}}
																									size="sm"
																									variant="outline"
																								>
																									<span>View Files</span>
																								</Button>
																							</Dialog.Trigger>
																							<Dialog.Content class="max-w-[80%]">
																								<Dialog.Header>
																									<Dialog.Title>
																										Files of {selectedScrapedItem?.raw_title}
																									</Dialog.Title>
																									<Dialog.Description
																										class="max-h-[35rem] overflow-x-hidden overflow-y-scroll pt-4"
																									>
																									{#if selectedScrapedItem?.infohash} 
																										{#if scrapedItemsAvailability}
																											<div class="grid grid-cols-1 gap-2">
																												{#each getFilenamesOfSelectedScrapedItem() as filename}
																													<div>{filename}</div>
																												{/each}
																											</div>
																										{:else}
																											<p>No files found (yet)</p>
																										{/if}
																									{:else}
																										<p>No infohash selected (this should not happen)</p>
																									{/if}
																									</Dialog.Description>
																								</Dialog.Header>
																							</Dialog.Content>
																						</Dialog.Root>
																					</Tooltip.Trigger>
																					<Tooltip.Content>
																						<p>View all files in this torrent</p>
																					</Tooltip.Content>
																				</Tooltip.Root>
																			</div>
																			<Button
																				on:click={async () => {
																					await addItemManually(
																						data.details.external_ids.imdb_id,
																						item.infohash
																					);
																				}}
																				size="sm"
																				class="flex-1"
																			>
																				Select
																			</Button>
																		</div>
																	</div>
																</Card>
															{/each}
														{/if}
													</div>
												{/if}
											</Dialog.Description>
										</Dialog.Header>
									</Dialog.Content>
								</Dialog.Root>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Scrapes torrents for the item</p>
							</Tooltip.Content>
						</Tooltip.Root>
						{#if data.riven}
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
															await deleteItem(data.riven.id);
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
										<div
											class="mt-auto line-clamp-1 self-end rounded-md bg-zinc-900/60 px-2 text-xs text-white sm:text-sm"
										>
											{season.episode_count ? season.episode_count : 'N/A'} episodes
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
