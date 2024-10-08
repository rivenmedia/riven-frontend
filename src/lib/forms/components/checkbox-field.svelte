<script lang="ts" context="module">
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	import type { FormPath } from 'sveltekit-superforms';

	type T = Record<string, unknown>;
	type U = unknown;
</script>

<script lang="ts" generics="T extends Record<string, unknown>, U extends FormPath<T>">
	import { type ControlProps, type FieldProps } from 'formsnap';
	import clsx from 'clsx';
	import type { Writable } from 'svelte/store';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { SuperForm } from 'sveltekit-superforms';
	import { formatWords } from '$lib/helpers';
	import * as Form from '$lib/components/ui/form';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	type $$Props = FieldProps<T, U> &
		ControlProps & {
			label?: string;
			fieldDescription?: string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			formData: Writable<any>;
			isForGroup?: boolean;
		};

	export let form: SuperForm<T>;
	export let name: U;
	export let label: string = formatWords(name as string);
	export let fieldDescription: string | undefined = undefined;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let formData: Writable<any>;
	export let isForGroup: boolean = false;
</script>

{#if isForGroup}
	<Form.Field {form} {name}>
		<Form.Control let:attrs {...$$restProps}>
			<div class="my-2 flex flex-wrap items-center gap-2 md:my-0">
				<Checkbox {...attrs} bind:checked={$formData[name]} />
				<Form.Label class="text-sm">{label}</Form.Label>
			</div>
			<input name={attrs.name} value={$formData[name]} hidden />
		</Form.Control>
	</Form.Field>
{:else}
	<Form.Field {form} {name}>
		<Form.Control let:attrs {...$$restProps}>
			<div
				class={clsx('flex max-w-6xl flex-col items-start gap-2 md:flex-row md:gap-4', {
					'md:items-center': !fieldDescription
				})}
			>
				<div class="flex w-full min-w-48 flex-col items-start gap-2 md:w-48">
					<Form.Label>{label}</Form.Label>
					{#if fieldDescription}
						<p class="text-xs text-muted-foreground">{fieldDescription}</p>
					{/if}
				</div>
				<Checkbox {...attrs} bind:checked={$formData[name]} />
			</div>
			<input name={attrs.name} value={$formData[name]} hidden />
		</Form.Control>

		<Form.FieldErrors class="mt-2 text-xs text-red-500" />
	</Form.Field>
{/if}
