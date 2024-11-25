<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { SuperForm } from 'sveltekit-superforms';
	import CheckboxField from './checkbox-field.svelte';
	import NumberField from './number-field.svelte';
	import { Separator } from '$lib/components/ui/separator';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let form: SuperForm<any, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let formData: any;
	export let sectionTitle: string;
	export let prefix: 'quality' | 'rips' | 'hdr' | 'audio' | 'extras' | 'trash';
	export let types: readonly string[];
</script>

<div class="space-y-4">
	<h3 class="text-lg font-medium">{sectionTitle}</h3>
	{#each types as type}
		<div class="rounded border p-4">
			<CheckboxField {form} name={`${prefix}_${type}_fetch`} label={type} {formData} />
			{#if $formData[`${prefix}_${type}_fetch`]}
				<div transition:slide class="ml-4 mt-4 space-y-2">
					<CheckboxField
						{form}
						name={`${prefix}_${type}_use_custom_rank`}
						label="Use Custom Rank"
						{formData}
					/>
					{#if $formData[`${prefix}_${type}_use_custom_rank`]}
						<NumberField {form} name={`${prefix}_${type}_rank`} {formData} stepValue={1} />
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>

<Separator />
