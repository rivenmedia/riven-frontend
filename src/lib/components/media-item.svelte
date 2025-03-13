<script lang="ts">
	import { statesName } from '$lib/constants';
	import type { RivenItem } from '$lib/types';
	import { Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { ItemsService } from '$lib/client';
	import { invalidateAll } from '$app/navigation';

	export let data: RivenItem;

	const baseUrl = 'https://images.metahub.space/poster/small/';

	const convertTo: Record<string, string> = {
		movie: 'movie',
		show: 'tv'
	};

	async function deleteItem(id: string) {
		const response = await ItemsService.removeItem({
			query: {
				ids: id
			}
		});

		if (!response.error) {
			toast.success('Media deleted successfully');
			invalidateAll();
		} else {
			toast.error('An error occurred while deleting the media');
		}
	}
</script>

<a
	href="/{convertTo[data.type.toLowerCase()]}/{data.tmdb_id}"
	class="relative block h-full w-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:scale-105"
>
	<img
		src="{baseUrl}{data.imdb_id}/img"
		alt={data.title}
		class="h-full w-full object-cover object-center"
		loading="lazy"
	/>
	<div
		class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-4"
	>
		<h3 class="mb-1 line-clamp-2 text-lg font-semibold text-white">{data.title}</h3>
		<div class="flex items-center justify-between text-sm text-gray-300">
			<span class="capitalize">{data.type}</span>
			<button
				on:click={(e) => {
					e.preventDefault();
					e.stopPropagation();
					if (data) {
						deleteItem(data.id);
					}
				}}
				class="rounded-lg bg-destructive/80 p-1 hover:bg-primary"
			>
				<Trash2 class="h-4 w-4 text-primary-foreground" />
			</button>
			<span class="rounded-full bg-primary/80 px-2 py-1 text-xs text-primary-foreground">
				{data.state === 'PartiallyCompleted' ? 'Partial' : statesName[data.state]}
			</span>
		</div>
	</div>
</a>
