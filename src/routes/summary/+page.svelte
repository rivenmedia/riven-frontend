<script lang="ts">
	import type { PageData } from './$types';
	import Header from '$lib/components/header.svelte';
	import * as Card from '$lib/components/ui/card';
	import { clsx } from 'clsx';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Pagination from '$lib/components/ui/pagination';
	import MediaItem from '$lib/components/media-item.svelte';

	export let data: PageData;

	const statsData: { title: string; value: number }[] = [
		{
			title: 'Total Items',
			value: data.stats.data.total_items
		},
		{
			title: 'Total Movies',
			value: data.stats.data.total_movies
		},
		{
			title: 'Total Shows',
			value: data.stats.data.total_shows
		},
		{
			title: 'Incomplete Items',
			value: data.stats.data.incomplete_items
		}
	];

	const statesName: Record<string, string> = {
		Unknown: 'Unknown',
		Requested: 'Requested',
		Indexed: 'Indexed',
		Scraped: 'Scraped',
		Downloaded: 'Downloaded',
		Symlinked: 'Symlinked',
		Completed: 'Completed',
		PartiallyCompleted: 'Partially Completed',
		Failed: 'Failed'
	};

	const servicesObject: Record<string, string> = {
		symlinklibrary: 'Symlink Library',
		traktindexer: 'Trakt Indexer',
		overseerr: 'Overseerr',
		plex_watchlist: 'Plex Watchlist',
		listrr: 'Listrr',
		mdblist: 'MDB List',
		trakt: 'Trakt',
		scraping: 'Scraping',
		annatar: 'Annatar',
		torrentio: 'Torrentio',
		knightcrawler: 'Knightcrawler',
		orionoid: 'Orionoid',
		jackett: 'Jackett',
		torbox: 'Torbox',
		mediafusion: 'Media Fusion',
		Prowlarr: 'Prowlarr',
		zilean: 'Zilean',
		symlink: 'Symlink',
		updater: 'Updater',
		plexupdater: 'Plex Updater',
		localupdater: 'Local Updater',
		realdebrid: 'Real Debrid',
		torbox_downloader: 'Torbox Downloader'
	};

	const coreServices = ['symlinklibrary', 'symlink', 'scraping', 'updater'];
	const downloaderServices = ['realdebrid', 'torbox', 'torbox_downloader'];
	const contentServices = ['mdblist', 'overseerr', 'plex_watchlist', 'listrr', 'trakt'];
	const scrapingServices = [
		'torrentio',
		'knightcrawler',
		'annatar',
		'jackett',
		'orionoid',
		'mediafusion',
		'Prowlarr',
		'zilean'
	];

	function sortServices(services: string[], data: Record<string, boolean>) {
		let sortedData = {} as Record<string, boolean>;

		for (let service of services) {
			sortedData[service] = data[service];
			if (!data[service]) {
				data[service] = false;
			}
		}
		return sortedData as Record<string, boolean>;
	}

	const coreServicesData = sortServices(coreServices, data.services.data);
	const downloaderServicesData = sortServices(downloaderServices, data.services.data);
	const contentServicesData = sortServices(contentServices, data.services.data);
	const scrapingServicesData = sortServices(scrapingServices, data.services.data);

	const coreServicesStatus = Object.keys(coreServicesData).map((service) => {
		return {
			name: servicesObject[service],
			status: coreServicesData[service]
		};
	});

	const downloaderServicesStatus = Object.keys(downloaderServicesData).map((service) => {
		return {
			name: servicesObject[service],
			status: downloaderServicesData[service]
		};
	});

	const contentServicesStatus = Object.keys(contentServicesData).map((service) => {
		return {
			name: servicesObject[service],
			status: contentServicesData[service]
		};
	});

	const scrapingServicesStatus = Object.keys(scrapingServicesData).map((service) => {
		return {
			name: servicesObject[service],
			status: scrapingServicesData[service]
		};
	});

	type ServiceStatus = {
		name: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		services: any;
	};

	const servicesStatus: ServiceStatus[] = [
		{
			name: 'Core services',
			services: coreServicesStatus
		},
		{
			name: 'Downloader services',
			services: downloaderServicesStatus
		},
		{
			name: 'Content services',
			services: contentServicesStatus
		},
		{
			name: 'Scraping services',
			services: scrapingServicesStatus
		}
	];

	let curPage = 1;
	const perPage = 20;
	$: start = (curPage - 1) * perPage;
	$: end = start + perPage;
	$: incompleteItems = data.incompleteItems
		.slice(start, end)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		.filter((item: any) => ['Movie', 'Show'].includes(item.type));
	$: totalIncompleteItems = incompleteItems.length;
</script>

<Header />

<div class="mt-16 flex w-full flex-col p-8 md:px-24 lg:px-32">
	<h2 class="text-xl md:text-2xl">Statistics</h2>
	<p class="text-sm text-muted-foreground lg:text-base">Statistics of the library</p>
	<div class="mt-4 grid w-full grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
		{#each statsData as stat}
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm font-medium lg:text-base">{stat.title}</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if stat.title === 'Total Shows'}
						<p class="text-lg lg:text-3xl">{stat.value}</p>
						<p class="text-sm text-muted-foreground lg:text-base">
							{data.stats.data.total_seasons} Seasons
						</p>
						<p class="text-sm text-muted-foreground lg:text-base">
							{data.stats.data.total_episodes} Episodes
						</p>
					{:else}
						<p class="text-lg lg:text-3xl">{stat.value}</p>
					{/if}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<h2 class="mt-8 text-xl md:text-2xl">Services</h2>
	<p class="text-sm text-muted-foreground lg:text-base">Tells the current status of the services</p>
	<div class="mt-4 grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#each servicesStatus as service}
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm font-medium lg:text-base">{service.name}</Card.Title>
				</Card.Header>
				<Card.Content>
					{#each service.services as status}
						<div class="flex items-center gap-2">
							<span
								class={clsx('h-3 w-3 rounded-full', {
									'bg-green-500': status.status,
									'bg-red-500': !status.status
								})}
							></span>
							<p class="text-sm lg:text-base">{status.name}</p>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<h2 class="mt-8 text-xl md:text-2xl">States</h2>
	<p class="text-sm text-muted-foreground lg:text-base">
		Tells the current state of the items in the library
	</p>
	<Dialog.Root>
		<Dialog.Trigger class="flex w-full max-w-max items-start text-muted-foreground underline">
			Know more about states
		</Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>What are these states?</Dialog.Title>
				<Dialog.Description class="flex flex-col gap-2">
					<p>
						Riven has items, which are movies/shows/season/episode. These items go through different
						states.
					</p>
					<p>
						States represent how the items are processed in the library. Each state represents a
						different stage of the item in the library. Items start Requested and end up in
						Completed state. Sometimes due to ongoing series, no streams or some error, they can end
						up in Incomplete or Failed state. Rarely items end up in Unknown state.
					</p>
				</Dialog.Description>
			</Dialog.Header>
		</Dialog.Content>
	</Dialog.Root>
	<div class="mt-4 grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
		{#each Object.keys(data.stats.data.states) as state}
			<Card.Root
				class={clsx({
					'col-span-2': state === 'Completed'
				})}
			>
				<Card.Header>
					<Card.Title class="text-sm font-medium lg:text-base">{statesName[state]}</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-lg lg:text-3xl">{data.stats.data.states[state]}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<div class="mt-8 flex w-full flex-col">
		<h2 class="text-xl md:text-2xl">Incomplete Items</h2>
		<p class="text-sm text-muted-foreground lg:text-base">Items whose state is not Completed</p>
		<div class="mt-2">
			{#if totalIncompleteItems}
				<p class="text-sm text-muted-foreground lg:text-base">
					Showing {start + 1} to {end > totalIncompleteItems ? totalIncompleteItems : end} of {totalIncompleteItems}
					items
				</p>
			{:else}
				<p class="text-sm text-muted-foreground lg:text-base">No incomplete items found</p>
			{/if}
		</div>
		<div class="no-scrollbar mt-2 flex flex-wrap overflow-x-auto">
			{#each incompleteItems as item (item.imdb_id)}
				<MediaItem data={item} {statesName} />
			{/each}
		</div>
		{#if totalIncompleteItems}
			<Pagination.Root
				count={totalIncompleteItems}
				{perPage}
				let:pages
				let:currentPage
				onPageChange={(page) => (curPage = page)}
			>
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton />
					</Pagination.Item>
					{#each pages as page (page.key)}
						{#if page.type === 'ellipsis'}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link {page} isActive={currentPage == page.value}>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.NextButton />
					</Pagination.Item>
				</Pagination.Content>
			</Pagination.Root>
		{/if}
	</div>
</div>
