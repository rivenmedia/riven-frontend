<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import SuperDebug from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import * as Form from '$lib/components/ui/form';
	import { scrapersSettingsSchema, type ScrapersSettingsSchema } from '$lib/forms/helpers';
	import { toast } from 'svelte-sonner';
	import TextField from './components/text-field.svelte';
	import NumberField from './components/number-field.svelte';
	import CheckboxField from './components/checkbox-field.svelte';
	import GroupCheckboxField from './components/group-checkbox-field.svelte';
	import ArrayField from './components/array-field.svelte';
	import { Loader2, Trash2, Plus } from 'lucide-svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';

	export let data: SuperValidated<Infer<ScrapersSettingsSchema>>;
	export let actionUrl: string = '?/default';

	const formDebug: boolean = getContext('formDebug');

	const form = superForm(data, {
		validators: zodClient(scrapersSettingsSchema),
		onError(event) {
			toast.error(event.result.error.message);
		}
	});

	const { form: formData, enhance, message, delayed } = form;

	$: if ($message && $page.status === 200) {
		toast.success($message);
	} else if ($message) {
		toast.error($message);
	}

	function addField(name: string) {
		// @ts-expect-error eslint-disable-next-line
		$formData[name] = [...$formData[name], ''];
	}

	function removeField(name: string, index: number) {
		// @ts-expect-error eslint-disable-next-line
		$formData[name] = $formData[name].filter((_, i) => i !== index);
	}
</script>

<form method="POST" action={actionUrl} use:enhance class="my-8 flex flex-col gap-2">
	<NumberField
		{form}
		name="after_2"
		{formData}
		stepValue={0.01}
		fieldDescription="Time to wait after 2 failed attempts in hours"
	/>
	<NumberField
		{form}
		name="after_5"
		{formData}
		stepValue={0.01}
		fieldDescription="Time to wait after 5 failed attempts in hours"
	/>
	<NumberField
		{form}
		name="after_10"
		{formData}
		stepValue={0.01}
		fieldDescription="Time to wait after 10 failed attempts in hours"
	/>

	<CheckboxField
		{form}
		name="parse_debug"
		label="Parse Debug"
		{formData}
		fieldDescription="Enable debug for parsing results (useful for debugging scrapers)"
	/>

	<CheckboxField
		{form}
		name="enable_aliases"
		label="Enable aliases"
		{formData}
		fieldDescription="Enable title aliases (e.g. Harry Potter and the Philosopher's Stone -> Harry Potter und der Stein der Weisen)"
	/>

	<NumberField
		{form}
		name="bucket_limit"
		{formData}
		stepValue={1}
		fieldDescription="Limit the number of torrents that get taken per resolution bucket in each run"
	/>

	<CheckboxField
		{form}
		name="max_failed_attempts"
		label="Max Failed Attempts"
		{formData}
		fieldDescription="Maximum number of failed attempts before giving up on a search"
	/>

	<CheckboxField
		{form}
		name="dubbed_anime_only"
		label="Dubbed Anime Only"
		{formData}
		fieldDescription="Only search for dubbed anime (requires parse debug to be enabled)"
	/>

	<GroupCheckboxField fieldTitle="Scrapers" fieldDescription="Enable the scrapers you want to use">
		<CheckboxField {form} name="torrentio_enabled" label="Torrentio" {formData} isForGroup={true} />
		<CheckboxField
			{form}
			name="knightcrawler_enabled"
			label="Knightcrawler"
			{formData}
			isForGroup={true}
		/>
		<CheckboxField {form} name="orionoid_enabled" label="Orionoid" {formData} isForGroup={true} />
		<CheckboxField {form} name="jackett_enabled" label="Jackett" {formData} isForGroup={true} />
		<CheckboxField
			{form}
			name="mediafusion_enabled"
			label="Mediafusion"
			{formData}
			isForGroup={true}
		/>
		<CheckboxField {form} name="prowlarr_enabled" label="Prowlarr" {formData} isForGroup={true} />
		<CheckboxField {form} name="zilean_enabled" label="Zilean" {formData} isForGroup={true} />
		<CheckboxField {form} name="comet_enabled" label="Comet" {formData} isForGroup={true} />
	</GroupCheckboxField>

	{#if $formData.torrentio_enabled}
		<div transition:slide>
			<TextField {form} name="torrentio_url" {formData} />
		</div>

		<div transition:slide>
			<TextField {form} name="torrentio_filter" {formData} />
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="torrentio_timeout"
				{formData}
				stepValue={1}
				fieldDescription="in seconds"
			/>
		</div>

		<div transition:slide>
			<CheckboxField {form} name="torrentio_ratelimit" {formData} />
		</div>

		<div transition:slide>
			<TextField {form} name="torrentio_proxy_url" {formData} />
		</div>
	{/if}

	{#if $formData.knightcrawler_enabled}
		<div transition:slide>
			<TextField {form} name="knightcrawler_url" {formData} />
		</div>
		<div transition:slide>
			<TextField {form} name="knightcrawler_filter" {formData} />
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="knightcrawler_timeout"
				{formData}
				stepValue={1}
				fieldDescription="in seconds"
			/>
		</div>

		<div transition:slide>
			<CheckboxField {form} name="knightcrawler_ratelimit" {formData} />
		</div>
	{/if}

	{#if $formData.orionoid_enabled}
		<div transition:slide>
			<TextField {form} name="orionoid_api_key" {formData} isProtected={true} />
		</div>

		<div transition:slide>
			<CheckboxField {form} name="orionoid_cached_results_only" {formData} />
		</div>

		<div transition:slide>
			<CheckboxField {form} name="orionoid_parameters_video3d" {formData} />
		</div>

		<div transition:slide>
			<TextField {form} name="orionoid_parameters_videoquality" {formData} isProtected={true} />
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="orionoid_parameters_limitcount"
				{formData}
				stepValue={1}
				fieldDescription="Search results limit"
			/>
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="orionoid_timeout"
				{formData}
				stepValue={1}
				fieldDescription="in seconds"
			/>
		</div>

		<div transition:slide>
			<CheckboxField {form} name="orionoid_ratelimit" {formData} />
		</div>
	{/if}

	{#if $formData.jackett_enabled}
		<div transition:slide>
			<TextField {form} name="jackett_url" {formData} />
		</div>

		<div transition:slide>
			<TextField {form} name="jackett_api_key" {formData} isProtected={true} />
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="jackett_timeout"
				{formData}
				stepValue={1}
				fieldDescription="in seconds"
			/>
		</div>

		<div transition:slide>
			<CheckboxField {form} name="jackett_ratelimit" {formData} />
		</div>
	{/if}

	{#if $formData.mediafusion_enabled}
		<div transition:slide>
			<TextField {form} name="mediafusion_url" {formData} />
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="mediafusion_timeout"
				{formData}
				stepValue={1}
				fieldDescription="in seconds"
			/>
		</div>

		<div transition:slide>
			<CheckboxField {form} name="mediafusion_ratelimit" {formData} />
		</div>
	{/if}

	{#if $formData.prowlarr_enabled}
		<div transition:slide>
			<TextField {form} name="prowlarr_url" {formData} />
		</div>

		<div transition:slide>
			<TextField {form} name="prowlarr_api_key" {formData} isProtected={true} />
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="prowlarr_timeout"
				{formData}
				stepValue={1}
				fieldDescription="in seconds"
			/>
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="prowlarr_limiter_seconds"
				label="Prowlarr Limiter"
				{formData}
				stepValue={1}
				fieldDescription="in seconds"
			/>
		</div>

		<div transition:slide>
			<CheckboxField {form} name="prowlarr_ratelimit" {formData} />
		</div>
	{/if}

	{#if $formData.zilean_enabled}
		<div transition:slide>
			<TextField {form} name="zilean_url" {formData} />
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="zilean_timeout"
				{formData}
				stepValue={1}
				fieldDescription="in seconds"
			/>
		</div>

		<div transition:slide>
			<CheckboxField {form} name="zilean_ratelimit" {formData} />
		</div>
	{/if}

	{#if $formData.comet_enabled}
		<div transition:slide>
			<TextField {form} name="comet_url" {formData} />
		</div>

		<div transition:slide>
			<NumberField
				{form}
				name="comet_timeout"
				{formData}
				stepValue={1}
				fieldDescription="in seconds"
			/>
		</div>

		<div transition:slide>
			<CheckboxField {form} name="comet_ratelimit" {formData} />
		</div>
	{/if}

	<Separator class="mt-4" />
	<div class="flex w-full justify-end">
		<Form.Button disabled={$delayed} type="submit" size="sm" class="w-full lg:max-w-max">
			{#if $delayed}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			Save changes
			<span class="ml-1" class:hidden={$page.url.pathname === '/settings/scrapers'}
				>and continue</span
			>
		</Form.Button>
	</div>
</form>

{#if formDebug}
	<SuperDebug data={$formData} />
{/if}
