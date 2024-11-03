<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { LoaderCircle, AlertCircle, FileIcon, CircleX } from 'lucide-svelte';
	import { ScrapeService } from '$lib/client';
	import type { Stream, ContainerFile, Container, StartSessionResponse } from '$lib/client';
	import { cn } from '$lib/utils';

	export let mediaId: string;
	export let mediaType: 'movie' | 'tv';

	type CustomStream = Stream & { parsed_data: { [key: string]: unknown } };

	let isOpen = false;
	let step = 1;
	let streams: { magnet: string; stream: CustomStream }[] = [];
	let sessionId: string | null = null;
	let sessionData: (StartSessionResponse & { containers: Array<Container> }) | null = null;
	let loading = false;
	let error: string | null = null;

	async function scrapeStreams() {
		try {
			loading = true;
			error = null;
			const response = await ScrapeService.scrapeItem({
				path: {
					id: mediaId
				}
			});

			if (response.data) {
				// Convert streams object to array of {magnet, stream} pairs
				streams = Object.entries(response.data.streams).map(([magnet, stream]) => ({
					magnet,
					stream
				}));

				// randomly set cached status for testing
				// streams.forEach(stream => {
				// 	stream.stream.is_cached = Math.random() > 0.5;
				// });

				step = 2;
			} else {
				if ('message' in response.error) {
					error = response.error.message as string;
				} else {
					error = 'Failed to fetch streams';
				}
			}
		} catch {
			error = 'Failed to fetch streams';
		} finally {
			loading = false;
		}
	}

	function onMagnetInputKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			const target = e.target as HTMLInputElement;
			startSession(target?.value);
		}
	}

	async function startSession(magnet: string) {
		try {
			loading = true;
			error = null;
			const response = await ScrapeService.startManualSessionApiV1ScrapeScrapeStartSessionPost({
				query: {
					item_id: mediaId,
					magnet
				}
			});

			if (response.data) {
				sessionId = response.data.session_id;
				sessionData = response.data as StartSessionResponse & { containers: Array<Container> };
				step = 3;
			} else {
				if ('message' in response.error) {
					error = response.error.message as string;
				} else {
					error = 'Failed to start session';
				}
			}
		} catch {
			error = 'Failed to start session';
		} finally {
			loading = false;
		}
	}

	async function selectFiles(files: Container) {
		try {
			loading = true;
			error = null;
			if (!sessionId) return;

			const response = await ScrapeService.manualSelect({
				path: {
					session_id: sessionId
				},
				body: files
			});

			if (response.data) {
				step = 4;
			} else {
				if ('message' in response.error) {
					error = response.error.message as string;
				} else {
					error = 'Failed to select files';
				}
			}
		} catch {
			error = 'Failed to select files';
		} finally {
			loading = false;
		}
	}

	type FileMapping = {
		id: string;
		filename?: string;
		filesize?: number;
		season?: number;
		episode?: number;
	};

	let selectedFilesMappings: FileMapping[] = [];

	function handleFileSelection(files: Container) {
		// Convert selected files to mappings array for easier manipulation
		selectedFilesMappings = Object.entries(files.root)
			.filter(([_, file]) => file !== 'undefined')
			.map(([id, file]) => {
				const containerFile = file as unknown as ContainerFile;

				return {
					id,
					filename: containerFile.filename,
					filesize: containerFile.filesize || undefined,
					// Try to extract season/episode from filename
					...extractSeasonEpisode(containerFile.filename)
				};
			});
		step = 4;
	}
	function extractSeasonEpisode(filename: string): { season?: number; episode?: number } {
		const match = filename.match(/s(\d+)e(\d+)/i);
		if (match) {
			return {
				season: parseInt(match[1]),
				episode: parseInt(match[2])
			};
		}
		return {};
	}

	function validateMappings(): boolean {
		if (mediaType === 'movie') return true;

		return selectedFilesMappings.every(
			(file) =>
				typeof file.season === 'number' &&
				typeof file.episode === 'number' &&
				file.season > 0 &&
				file.episode > 0
		);
	}

	async function updateAttributes() {
		try {
			loading = true;
			error = null;
			if (!sessionId) return;

			if (!validateMappings()) {
				error = 'Please set season and episode numbers for all files';
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let fileData: any = {};

			if (mediaType === 'tv') {
				// Convert mappings to the expected structure
				selectedFilesMappings.forEach((mapping) => {
					if (mapping.season && mapping.episode) {
						if (!fileData[mapping.season]) {
							fileData[mapping.season] = {};
						}
						fileData[mapping.season][mapping.episode] = {
							filename: mapping.filename,
							filesize: mapping.filesize
						};
					}
				});
			} else {
				fileData = selectedFilesMappings.reduce((prev, current) =>
					(prev.filesize || 0) > (current.filesize || 0) ? prev : current
				);
			}

			const response = await ScrapeService.manualUpdateAttributes({
				path: { session_id: sessionId },
				body: fileData
			});

			if (response.data) {
				await ScrapeService.completeManualSession({
					path: { session_id: sessionId }
				});

				isOpen = false;
				toast.success('Media added successfully');
				invalidateAll();
			} else {
				if ('message' in response.error) {
					error = response.error.message as string;
				} else {
					error = 'Failed to update attributes';
				}
			}
		} catch {
			error = 'Failed to update attributes';
		} finally {
			loading = false;
		}
	}

	async function abortSession() {
		if (sessionId) {
			try {
				await ScrapeService.abortManualSessionApiV1ScrapeScrapeAbortSessionSessionIdPost({
					path: { session_id: sessionId }
				});
			} catch (err) {
				throw new Error('Failed to abort session: ' + err);
			}
		}
	}

	function resetFlow() {
		step = 1;
		streams = [];
		sessionId = null;
		sessionData = null;
		error = null;
	}

	function getDialogWidth(currentStep: number): string {
		switch (currentStep) {
			case 1:
				return 'max-w-[50vw]';
			case 2:
				return 'max-w-[60vw]';
			case 3:
				return 'max-w-[70vw]';
			case 4:
				return 'max-w-[70vw]';
			default:
				return 'max-w-[50vw]';
		}
	}

	$: dialogWidth = isOpen ? getDialogWidth(step) : getDialogWidth(1);

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

	$: {
		if (!isOpen) {
			if (sessionId) {
				// Only abort if the session wasn't completed successfully
				if (error || step !== 4) {
					abortSession();
				}
			}
			resetFlow();
		}
	}
</script>

<Button on:click={() => (isOpen = true)}>Scrape Manually</Button>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Content class={`fixed ${dialogWidth} flex h-[70vh] flex-col overflow-hidden`}>
		{#if error}
			<Alert.Root variant="destructive" class="mb-4">
				<AlertCircle class="h-4 w-4" />
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{/if}

		{#if step === 1}
			<div class="flex flex-col gap-4 p-4 text-center">
				<Card.Header class="flex-shrink-0">
					<Card.Title>Step 1: Fetch Available Streams</Card.Title>
				</Card.Header>
				<Card.Content class="flex-shrink-0">
					<Button on:click={scrapeStreams} disabled={loading} class="w-full">
						{#if loading}
							<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
							Fetching Streams
						{:else}
							Fetch Streams
						{/if}
					</Button>

					<p class="my-4">or</p>

					<Input
						type="text"
						placeholder="Magnet Link"
						class="w-full"
						on:keydown={onMagnetInputKeyDown}
					/>
				</Card.Content>
			</div>
		{:else if step === 2}
			<div class="flex h-full flex-col">
				<Card.Header class="flex-shrink-0 p-4">
					<Card.Title>Step 2: Select Stream</Card.Title>
				</Card.Header>
				<Card.Content class="flex-1 overflow-y-auto p-4">
					<div class="grid gap-4">
						{#if streams.length === 0}
							<div class="text-center">No streams available</div>
						{:else}
							{#each streams as { magnet, stream }}
								<button
									class="w-full text-left"
									on:click={() => (stream.is_cached ? startSession(magnet) : null)}
								>
									<Card.Root
										class={cn(
											'relative cursor-pointer transition-all duration-200',
											stream.is_cached && 'hover:rotate-0.5 hover:scale-[1.02] hover:bg-accent',
											!stream.is_cached && 'cursor-not-allowed bg-unavailable opacity-75'
										)}
									>
										<Card.Content class="pt-4">
											<Badge
												class={cn(
													'absolute right-4 top-4',
													stream.rank > 0
														? 'bg-green-500 hover:bg-green-600'
														: 'bg-red-500 hover:bg-red-600'
												)}>{stream.rank}</Badge
											>

											<div class="pr-16">
												<div class="mb-2">{stream.raw_title}</div>
												<div class="flex flex-row flex-wrap gap-2">
													{#each ['resolution', 'quality', 'hdr', 'audio', 'codec', 'languages'] as key}
														{#if stream.parsed_data[key]}
															{#if Array.isArray(stream.parsed_data[key])}
																{#each stream.parsed_data[key] as value}
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
																			? getResolutionColor(stream.parsed_data[key])
																			: 'bg-secondary/50 uppercase'
																	}`}
																>
																	{stream.parsed_data[key]}
																</Badge>
															{/if}
														{/if}
													{/each}
													<Badge
														class={`text-nowrap font-medium ${
															stream.is_cached
																? 'bg-green-500 hover:bg-green-600'
																: 'bg-red-500 hover:bg-red-600'
														}`}
													>
														{stream.is_cached ? 'Cached' : 'Uncached'}

														<!-- {(scrapedItemsAvailability[item.infohash]?.length ||
															0) > 0
															? `Cached (${
																getFilenamesOfScrapedItem(item).size
																} file${getFilenamesOfScrapedItem(item).size > 1 ? 's' : ''})`
															: 'Uncached'} -->
													</Badge>
												</div>
												<!-- <div class="mt-2">{item.infohash}</div> -->
											</div>
											{#if !stream.is_cached}
												<div class="absolute inset-0 flex items-center justify-center">
													<Badge variant="destructive" class="pointer-events-none">
														Uncached support coming soon!
													</Badge>
												</div>
											{/if}
										</Card.Content>
									</Card.Root>
								</button>
							{/each}
						{/if}
					</div>
				</Card.Content>
			</div>
		{:else if step === 3 || step === 4}
			<div class="flex h-full flex-col">
				<Card.Header class="flex-shrink-0 p-4">
					<Card.Title>
						{step === 3 ? 'Step 3: Select Files' : 'Step 4: Map Files'}
					</Card.Title>
				</Card.Header>
				<Card.Content class="flex-1 overflow-y-auto p-4">
					<div class="grid gap-4">
						{#if step === 3 && sessionData?.containers}
							{#each sessionData.containers as container}
								<button
									class="w-full text-left"
									on:click={() => {
										selectFiles(container);
										const filename = container.filename + '';
										handleFileSelection({ root: { ...container, filename } });
									}}
								>
									<Card.Root
										class="w-full min-w-0 cursor-pointer transition-colors hover:bg-accent"
									>
										<Card.Content class="p-4">
											<div class="grid gap-2">
												{#each Object.entries(container) as [_id, file]}
													<div class="flex items-center gap-2 rounded border p-2">
														<FileIcon class="h-4 w-4" />
														<span class="flex-1 truncate">{file.filename}</span>
														{#if file.filesize}
															<Badge variant="outline">
																{(file.filesize / (1024 * 1024 * 1024)).toFixed(2)} GB
															</Badge>
														{/if}
													</div>
												{/each}
											</div>
										</Card.Content>
									</Card.Root>
								</button>
							{/each}
						{:else if step === 4}
							<div class="grid gap-4">
								{#each selectedFilesMappings as file (file.id)}
									<Card.Root class="w-full min-w-0">
										<Card.Content class="p-4">
											<div class="grid gap-4">
												<div class="flex items-center gap-2">
													<FileIcon class="h-4 w-4 flex-shrink-0" />
													<span class="flex-1 truncate">{file.filename}</span>
													<button
														on:click={() => {
															selectedFilesMappings = selectedFilesMappings.filter(
																(f) => f.id !== file.id
															);
														}}
													>
														<CircleX
															class="float-right h-4 w-4 cursor-pointer text-lg text-red-500"
														/>
													</button>
												</div>

												{#if mediaType === 'tv'}
													<div class="grid grid-cols-2 gap-4">
														<div class="flex flex-col gap-2">
															<Label for={`season-${file.id}`}>Season</Label>
															<Input
																id={`season-${file.id}`}
																type="number"
																bind:value={file.season}
																placeholder="Season number"
															/>
														</div>
														<div class="flex flex-col gap-2">
															<Label for={`episode-${file.id}`}>Episode</Label>
															<Input
																id={`episode-${file.id}`}
																type="number"
																bind:value={file.episode}
																placeholder="Episode number"
															/>
														</div>
													</div>
												{/if}
											</div>
										</Card.Content>
									</Card.Root>
								{/each}
							</div>

							<Button
								on:click={updateAttributes}
								disabled={loading || !validateMappings()}
								class="mt-4 w-full"
							>
								{#if loading}
									<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
									Processing
								{:else}
									Confirm and Complete
								{/if}
							</Button>
						{/if}
					</div>
				</Card.Content>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
