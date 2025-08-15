<script lang="ts">
	import { statesName } from '$lib/constants';
	import type { RivenItem } from '$lib/types';
	import { Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { ItemsService } from '$lib/client';
	import { invalidateAll } from '$app/navigation';

	export let data: RivenItem;

	const baseUrl = 'https://images.metahub.space/poster/small/';

	const MEDIA_TYPES = {
		Movie: { route: 'movie', usesParentId: false },
		Show: { route: 'tv', usesParentId: false },
		Episode: { route: 'tv', usesParentId: true },
		Season: { route: 'tv', usesParentId: true }
	} as const;

	function buildHrefUrl(item: RivenItem): string {
		const mediaType = MEDIA_TYPES[item.type as keyof typeof MEDIA_TYPES];
		if (!mediaType) return '';

		const baseHrefUrl = `/${mediaType.route}`;
		const id = mediaType.usesParentId ? item.parent_ids?.tmdb_id : item.tmdb_id;

		let url = `${baseHrefUrl}/${id}`;

		if (item.season_number) {
			url += `/${item.season_number}`;
		}

		if (item.episode_number) {
			url += `/${item.episode_number}`;
		}

		return url;
	}

	function buildImgUrl(item: RivenItem): string {
		const mediaType = MEDIA_TYPES[item.type as keyof typeof MEDIA_TYPES];
		if (!mediaType) return '';

		const imdbId = mediaType.usesParentId ? item.parent_ids?.imdb_id : item.imdb_id;
		return imdbId ? `${baseUrl}${imdbId}/img` : '';
	}

	async function deleteItem(id: string) {
		try {
			const response = await ItemsService.removeItem({
				query: { ids: id }
			});

			if (!response.error) {
				toast.success('Media deleted successfully');
				invalidateAll();
			} else {
				toast.error('An error occurred while deleting the media');
			}
		} catch (err) {
			toast.error('Failed to delete media');
		}
	}

	const isChildItem = ['Episode', 'Season'].includes(data.type);
	const displayState = data.state === 'PartiallyCompleted' ? 'Partial' : statesName[data.state];
</script>

<a
	href={buildHrefUrl(data)}
	class="relative block h-full w-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:scale-105"
>
	<img
		src={buildImgUrl(data)}
		alt={data.title}
		class="h-full w-full object-cover object-center"
		loading="lazy"
	/>
	<div
		class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-4"
	>
		<h3 class="mb-1 line-clamp-2 text-lg font-semibold text-white">{data.title}</h3>
		{#if isChildItem}
			<p class="mb-2 line-clamp-1 text-sm text-gray-300">{data.parent_title}</p>
		{/if}
		<div class="flex items-center justify-between text-sm text-gray-300">
			<span class="capitalize">{data.type}</span>
			<button
				on:click={(e) => {
					e.preventDefault();
					e.stopPropagation();
					if (data?.id) {
						deleteItem(data.id);
					}
				}}
				class="rounded-lg bg-destructive/80 p-1 hover:bg-primary"
				aria-label="Delete item"
			>
				<Trash2 class="h-4 w-4 text-primary-foreground" />
			</button>
			<span class="rounded-full bg-primary/80 px-2 py-1 text-xs text-primary-foreground">
				{displayState}
			</span>
		</div>
	</div>
</a>
