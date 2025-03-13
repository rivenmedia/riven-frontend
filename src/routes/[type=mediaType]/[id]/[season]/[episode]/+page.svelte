<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$lib/components/header.svelte';
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
	import { formatDate } from '$lib/helpers';
	import { statesName } from '$lib/constants';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Select from '$lib/components/ui/select';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import MediaFileSelector from '$lib/components/media-file-selector.svelte';
	import { ItemsService } from '$lib/client';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Badge } from '$lib/components/ui/badge';
	import ItemRequest from '$lib/components/item-request.svelte';
	import { getFormattedTime } from '$lib/utils';

	export let data: PageData;

	async function deleteItem(id: number) {
		const response = await ItemsService.removeItem({
			query: {
				ids: id.toString()
			}
		});

		if (!response.error) {
			toast.success('Media deleted successfully');
			invalidateAll();
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
</script>

<svelte:head>
	<title>{data.details.name} | {data.mediaDetails.name || data.mediaDetails.original_name}</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="relative flex flex-col text-zinc-100">
	<div class="fixed bottom-0 left-0 z-[-1] h-screen w-full bg-[#09101A]">
		<span>
			<img
				alt={data.mediaDetails.id}
				class="h-full w-full object-cover opacity-50 blur"
				src="https://www.themoviedb.org/t/p/original{data.mediaDetails.backdrop_path}"
				loading="lazy"
			/>
			<div
				class="absolute bottom-0 left-0 right-0 h-full w-full bg-gradient-to-b from-transparent to-zinc-900/55"
			></div>
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
							src="https://www.themoviedb.org/t/p/w780{data.details.still_path}"
							class="h-full w-full object-cover object-center"
						/>
					</div>
				</div>
				<div class="flex w-full flex-col gap-2 md:w-[75%] md:pl-12 lg:pl-16">
					<h1 class="text-center text-4xl text-zinc-50 md:text-left">
						{data.mediaDetails.name || data.mediaDetails.original_name}
					</h1>
					<h3 class="text-center text-2xl text-zinc-50 md:text-left">
						{data.details.name}
					</h3>
					{#if data.details.vote_average}
						<div class="flex items-center justify-center gap-1 md:justify-start">
							<Star class="size-4 text-yellow-400" />
							<span class="text-base font-thin text-zinc-200">
								{data.details.vote_average}
							</span>
							<div class="ml-4 text-base font-thin text-zinc-200">
								{data.details.runtime} min
							</div>
						</div>
					{/if}
					{#if data.details.overview}
						<p class="text-center text-base font-thin leading-tight text-zinc-200 md:text-left">
							{data.details.overview}
						</p>
					{/if}


					<div class="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
						{#if !data.riven}
							<ItemRequest data={data.details} type={data.mediaType} />
							<MediaFileSelector
								mediaId={data.details.external_ids.imdb_id}
								mediaType={'tv'}
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
										<p>Symlinked: {data.riven.symlinked ? 'Yes' : 'No'}</p>
										{#if data.riven.folder}
											<p class="break-words">Folder: {data.riven.folder}</p>
										{/if}
										{#if data.riven.file}
											<p class="break-words">File: {data.riven.file}</p>
										{/if}

										<div class="mt-1"></div>

										{#if data.riven.state !== "Completed"}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<AlertDialog.Root>
														<AlertDialog.Trigger asChild let:builder>
															<Button
																builders={[builder]}
																class="flex w-full items-center gap-1"
																variant="destructive"
															>
																{#if data.riven.state === "Paused"}
																	<CirclePlay class="size-4" />
																{:else}
																	<CirclePause class="size-4" />
																{/if}
																<span>{data.riven.state === "Paused" ? "Resume" : "Pause"}</span>
															</Button>
														</AlertDialog.Trigger>
														<AlertDialog.Content>
															<AlertDialog.Header>
																<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
																<AlertDialog.Description>
																	This action will {data.riven.state === "Paused" ? "resume" : "pause"} the media
																</AlertDialog.Description>
															</AlertDialog.Header>
															<AlertDialog.Footer>
																<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
																<AlertDialog.Action
																	on:click={async () => {
																		if (data.riven) {
																			if (data.riven.state === "Paused") {
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
													<p>{data.riven.state === "Paused" ? "Resume" : "Pause"} the media</p>
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
									</Sheet.Description>
								</Sheet.Content>
							</Sheet.Root>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<MediaFileSelector
										mediaId={data.riven.id.toString()}
										mediaType={'tv'}
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
				</div>
			</div>
		</div>
	</div>
</div>
