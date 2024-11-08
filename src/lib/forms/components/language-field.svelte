<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Trash2, Plus } from 'lucide-svelte';
	import { languageCodes } from './language-codes';
	import ArrayField from './array-field.svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let form: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let formData: any;
	export let name: string;

	function addField() {
		$formData[name] = [...$formData[name], ''];
	}

	function removeField(index: number) {
		// @ts-expect-error eslint-disable-next-line
		$formData[name] = $formData[name].filter((_, i) => i !== index);
	}

	// Language code validation
	function validateInput(event: Event, index: number) {
		const input = event.target as HTMLInputElement;
		let value = input.value.toLowerCase();

		// Only allow letters
		value = value.replace(/[^a-z]/g, '');

		// Limit to 2 characters
		if (value.length > 2) {
			value = value.slice(0, 2);
		}

		// Update the form data
		$formData[name][index] = value;
	}
</script>

<ArrayField {form} {name} {formData}>
	{#each $formData[name] as _, i}
		<Form.ElementField {form} name="{name}[{i}]">
			<Form.Control let:attrs>
				<div class="flex items-center gap-2">
					<Input
						type="text"
						spellcheck="false"
						autocomplete="false"
						{...attrs}
						bind:value={$formData[name][i]}
						on:input={(e) => validateInput(e, i)}
					/>
					<Form.Button
						type="button"
						size="sm"
						variant="destructive"
						on:click={() => removeField(i)}
					>
						<Trash2 class="h-4 w-4" />
					</Form.Button>
				</div>
			</Form.Control>
			<Form.Description>
				{#if $formData[name][i]}
					{#if languageCodes.includes($formData[name][i].toLowerCase())}
						<span class="text-green-500">Valid language code</span>
					{:else}
						<span class="text-yellow-500">Invalid language code</span>
					{/if}
				{/if}
			</Form.Description>
		</Form.ElementField>
	{/each}
	<div class="flex w-full items-center justify-between gap-2">
		<p class="text-sm text-muted-foreground">Add language code (e.g., en, fr, de)</p>
		<Form.Button type="button" size="sm" variant="outline" on:click={addField}>
			<Plus class="h-4 w-4" />
		</Form.Button>
	</div>
</ArrayField>
