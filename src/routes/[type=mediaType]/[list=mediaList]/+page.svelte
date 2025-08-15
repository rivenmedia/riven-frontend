<script lang="ts">
	import { roundOff } from '$lib/helpers';
	import { Star } from 'lucide-svelte';
	import ItemRequest from '$lib/components/item-request.svelte';
	import Header from '$lib/components/header.svelte';
	import { writable, derived } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		getMoviesPopular,
		getTVPopular,
		getTrending,
		MediaType,
		TimeWindow,
		TMDB_LANGUAGE
	} from '$lib/tmdb';
	import { mediaListStore } from '$lib/stores/mediaListStores';
	import { browser } from '$app/environment';

	$: type = $page.params.type;
	$: listType = $page.params.list;

	let savedScrollPosition = 0;
	const hoveredItem = writable(null);
	let isLoading = false;
	let hasMoreItems = true;

	$: {
		if (type && listType) {
			mediaListStore.initList(type, listType);
		}
	}

	const currentList = derived([mediaListStore, page], ([$store, $page]) => {
		const key = `${$page.params.type}-${$page.params.list}`;
		return $store[key] || { items: [], currentPage: 0, totalItems: 0, existingIds: new Set() };
	});

	if (browser) {
		window.addEventListener('beforeunload', () => {
			savedScrollPosition = window.scrollY;
		});
	}

	const handleMouseLeave = (e: MouseEvent) => {
		const currentTarget = e.currentTarget as HTMLElement;
		const relatedTarget = e.relatedTarget as HTMLElement;
		if (currentTarget.contains(relatedTarget)) {
			$hoveredItem = null;
		}
	};

	async function loadMoreItems() {
		if (isLoading || !hasMoreItems) return;

		const nextPage = $currentList.currentPage + 1;
		isLoading = true;
		console.info('Loading more items:', nextPage);

		try {
			let newData;
			if (type === 'tv') {
				if (listType === 'popular') {
					newData = await getTVPopular(fetch, TMDB_LANGUAGE, nextPage);
				} else if (listType === 'trending') {
					newData = await getTrending(
						fetch,
						TMDB_LANGUAGE,
						nextPage,
						MediaType.TV,
						TimeWindow.Week
					);
				}
			} else if (type === 'movie') {
				if (listType === 'popular') {
					newData = await getMoviesPopular(fetch, TMDB_LANGUAGE, nextPage);
				} else if (listType === 'trending') {
					newData = await getTrending(
						fetch,
						TMDB_LANGUAGE,
						nextPage,
						MediaType.Movie,
						TimeWindow.Week
					);
				}
			}

			if (newData && newData.results && newData.results.length > 0) {
				mediaListStore.addItems(type, listType, newData.results, newData.total_results, nextPage);

				if (nextPage * 20 >= newData.total_results) {
					hasMoreItems = false;
				}

				if (newData.results.length > 0 && $currentList.items.length === 0 && hasMoreItems) {
					setTimeout(loadMoreItems, 100);
				}
			} else {
				hasMoreItems = false;
			}
		} catch (error) {
			console.error('Failed to load more items:', error);
		} finally {
			isLoading = false;
		}
	}

	let sentinelElement: HTMLElement;
	onMount(() => {
		if ($currentList.items.length === 0) {
			loadMoreItems();
		} else {
			setTimeout(() => {
				if (browser && savedScrollPosition > 0) {
					window.scrollTo(0, savedScrollPosition);
					savedScrollPosition = 0;
				}
			}, 0);
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && !isLoading) {
					loadMoreItems();
				}
			},
			{ rootMargin: '500px' }
		);

		if (sentinelElement) {
			observer.observe(sentinelElement);
		}

		const handleScroll = () => {
			if (isLoading || !hasMoreItems) return;

			if (sentinelElement) {
				const rect = sentinelElement.getBoundingClientRect();
				const isNearViewport = rect.top <= window.innerHeight + 1000;

				if (isNearViewport) {
					loadMoreItems();
				}
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });

		setTimeout(() => {
			if (
				$currentList.items.length === 0 ||
				(sentinelElement && sentinelElement.getBoundingClientRect().top <= window.innerHeight)
			) {
				loadMoreItems();
			}
		}, 300);

		return () => {
			if (sentinelElement) {
				observer.unobserve(sentinelElement);
			}
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<svelte:head>
	<title>{listType} {type} | Riven</title>
</svelte:head>

<div class="!text-zinc-100">
	<Header />
</div>

<div class="mt-32 p-8 md:px-24 lg:px-32">
	<h1 class="mb-8 text-center text-4xl text-zinc-50 md:text-left">{listType} {type}</h1>

	<div
		class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
	>
		{#each $currentList.items as item (item.id)}
			<div
				class="group relative mb-2 flex flex-shrink-0 flex-col gap-2 rounded-lg p-2"
				role="button"
				tabindex="0"
				on:mouseenter={() => ($hoveredItem = item.id)}
				on:mouseleave={handleMouseLeave}
				on:focus={() => ($hoveredItem = item.id)}
				on:blur={() => ($hoveredItem = null)}
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						$hoveredItem = item.id;
					}
				}}
				on:click={() => goto(`/${type}/${item.id}`)}
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
					<div
						class="absolute inset-0 hidden flex-col justify-end from-zinc-900/70 p-2 group-hover:flex group-hover:bg-gradient-to-t"
						on:mousedown={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						role="presentation"
					>
						{#if $hoveredItem === item.id}
							<ItemRequest data={item} {type} />
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div bind:this={sentinelElement} class="h-20 w-full"></div>
	{#if isLoading}
		<div class="mt-6 flex justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{/if}

	{#if !hasMoreItems && !isLoading && $currentList.items.length > 0}
		<div class="mt-6 text-center text-zinc-400">No more items to load</div>
	{/if}
</div>
