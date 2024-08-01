<script lang="ts">
	import type { PageData } from './$types';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import Header from '$lib/components/header.svelte';
	import { get } from 'svelte/store';
	import MediaItem from '$lib/components/media-item.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { goto } from '$app/navigation';

	export let data: PageData;

	$: pageSize = writable(Number($page.url.searchParams.get('limit') || 25));
	$: currentPage = writable(Number($page.url.searchParams.get('page') || 1));
	$: totalDataItems = writable(Number($page.data.total));
	$: totalPages = writable(Math.ceil(get(totalDataItems) / get(pageSize)));
	$: library = writable(data.library);
</script>

<Header />

<div class="mt-32 flex w-full flex-col p-8 md:px-24 lg:px-32">
	<div class="flex w-full flex-wrap">
		{#each $library as item (item._id)}
			<MediaItem data={item} />
		{/each}
	</div>

	{#if $totalDataItems > 0}
		<Pagination.Root
			count={$totalDataItems}
			perPage={$pageSize}
			let:pages
			let:currentPage
			onPageChange={(page) => goto(`?page=${page}`, { replaceState: true })}
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
