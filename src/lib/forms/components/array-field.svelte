<script lang="ts" context="module">
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	import type { FormPath } from 'sveltekit-superforms';

	type T = Record<string, unknown>;
	type U = unknown;
</script>

<script lang="ts" generics="T extends Record<string, unknown>, U extends FormPath<T>">
	import { type FieldsetProps } from 'formsnap';
	import clsx from 'clsx';
	import * as Form from '$lib/components/ui/form';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { Writable } from 'svelte/store';
	import { formatWords } from '$lib/helpers';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	type $$Props = FieldsetProps<T, U> & {
		legend?: string;
		fieldDescription?: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		formData: Writable<any>;
	};

	export let form: SuperForm<T>;
	export let name: U;
	export let legend: string = formatWords(name as string);
	export let fieldDescription: string | undefined = undefined;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let formData: Writable<any>;
</script>

<Form.Fieldset {form} {name}>
	<div
		class={clsx('flex max-w-6xl flex-col items-start gap-2 md:flex-row md:gap-4', {
			'md:items-center': !fieldDescription || !$formData[name].length
		})}
	>
		<div class="flex w-full min-w-48 flex-col items-start gap-2 md:w-48 self-baseline">
			<Form.Legend>{legend}</Form.Legend>
			{#if fieldDescription}
				<p class="text-xs text-muted-foreground">{fieldDescription}</p>
			{/if}
		</div>

		<div class="flex flex-col items-start gap-2">
			<slot />
		</div>

		<Form.FieldErrors class="mt-2 text-xs text-red-500" />
	</div>
</Form.Fieldset>
