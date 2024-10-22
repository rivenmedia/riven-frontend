<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { getExternalID } from '$lib/tmdb';
	import { ItemsService } from '$lib/client';
	import { onMount } from 'svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let data: any;
	export let type: string;

	let isInLibrary = false;
	let isChecking = true;

	async function checkItemExists(id: number) {
		try {
			const externalIds = await getExternalID(fetch, type, id);
			const response = await ItemsService.getItems({
				query: {
					search: externalIds.imdb_id
				}
			});

			if (response.data && response.data.items.length > 0) {
				isInLibrary = true;
			}
		} catch {
			//pass
		} finally {
			isChecking = false;
		}
	}

	async function requestItem(id: number) {
		const externalIds = await getExternalID(fetch, type, id);
		const response = await ItemsService.addItems({
			query: {
				imdb_ids: externalIds.imdb_id
			}
		});

		if (!response.error) {
			toast.success('Media requested successfully');
			isInLibrary = true;
		} else {
			toast.error('An error occurred while requesting the media');
		}
	}

	onMount(() => {
		checkItemExists(data.id);
	});
</script>

{#if isChecking}
	<Button variant="outline" disabled>Checking...</Button>
{:else if isInLibrary}
	<Button variant="outline" disabled>In Library</Button>
{:else}
	<AlertDialog.Root>
		<AlertDialog.Trigger asChild let:builder>
			<Button
				on:click={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
				variant="outline"
				builders={[builder]}>Request</Button
			>
		</AlertDialog.Trigger>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title
					>Requesting {data.title || data.name || data.original_name}</AlertDialog.Title
				>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action
					on:click={async () => {
						await requestItem(data.id);
					}}>Continue</AlertDialog.Action
				>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
