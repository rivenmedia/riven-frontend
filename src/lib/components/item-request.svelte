<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { getExternalID } from '$lib/tmdb';

	export let data: any;
	export let type: string;

	async function requestItem(id: number) {
		const externalIds = await getExternalID(fetch, type, id);
		const response = await fetch(`/api/media/${externalIds.imdb_id}`, {
			method: 'POST'
		});

		if (response.ok) {
			toast.success('Media requested successfully');
			invalidateAll();
		} else {
			toast.error('An error occurred while requesting the media');
		}
	}
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger asChild let:builder>
		<Button
			on:click={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			variant="outline"
			size="sm"
			builders={[builder]}>Request</Button
		>
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Requesting {data.title || data.name || data.original_name}</AlertDialog.Title>
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
