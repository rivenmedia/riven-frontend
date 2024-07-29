<script lang="ts">
	import type { PageData } from './$types';
	import ExpandableRow from '$lib/components/expandable-row.svelte';
	import Header from '$lib/components/header.svelte';
	import * as Card from '$lib/components/ui/card';
	export let data: PageData;

    async function deleteItem(imdb_id: string) {
        try {
			const response = await fetch(`/library?imdb_id=${imdb_id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error deleting item');
            }

			const _data = await response.json();
            return _data;
        } catch (error) {
            console.error(error);
        }
    }

    async function getExtended(imdb_id: string) {
        try {
            const response = await fetch(`/library?method=extended&imdb_id=${imdb_id}`, {
                method: 'GET'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error getting extended info');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting extended info:', error);
            // alert('Error getting extended info');
        }
    }
	export let movies = data.items.items.filter((item: any) => item.type === 'Movie');
	export let shows = data.items.items.filter((item: any) => item.type === 'Show');

	function handleRemove(imdb_id: string) {
		deleteItem(imdb_id);
		data.items.items = data.items.items.filter(
                (item: { imdb_id: string }) => item.imdb_id !== imdb_id
            );
		movies = data.items.items.filter((item: any) => item.type === 'Movie');
		shows = data.items.items.filter((item: any) => item.type === 'Show');
	}

	function handleExpand(imdb_id: string) {
		return getExtended(imdb_id);
	}
</script>

<style>
	/* Hide scrollbar */
	.scrollbar-hidden {
	  scrollbar-width: none; /* Firefox */
	  -ms-overflow-style: none; /* Internet Explorer 10+ */
	}
  
	.scrollbar-hidden::-webkit-scrollbar {
	  display: none; /* WebKit-based browsers */
	}
  </style>

<Header />

<div class="mt-16 flex w-full flex-wrap gap-4 p-8 md:px-24 lg:px-32">
	<div class="flex flex-col h-screen w-full relative">
		<Card.Root class="flex flex-col flex-1">
		  <Card.Content class="flex flex-col flex-1">
			<div class="flex-1 overflow-y-auto scrollbar-hidden w-full" >
					<h1 class="text-lg font-semibold p-4 text-center group-hover:text-gray-600">Movies</h1>
					{#each movies as movie}
			  			<ExpandableRow item={movie} onRemove={handleRemove} onExpand={handleExpand} />
					{/each}
					<h1 class="text-lg font-semibold p-4 text-center group-hover:text-gray-600">Shows</h1>
					{#each shows as show}
			  			<ExpandableRow item={show} onRemove={handleRemove} onExpand={handleExpand} />
					{/each}
			</div>
		  </Card.Content>
		</Card.Root>
	  </div>
</div>
