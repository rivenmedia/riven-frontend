<script lang="ts">
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import SuperDebug from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import * as Form from '$lib/components/ui/form';
	import { rankingSettingsSchema, type RankingSettingsSchema } from '$lib/forms/helpers';
	import { toast } from 'svelte-sonner';
	import TextField from './components/text-field.svelte';
	import NumberField from './components/number-field.svelte';
	import CheckboxField from './components/checkbox-field.svelte';
	import GroupCheckboxField from './components/group-checkbox-field.svelte';
	import ArrayField from './components/array-field.svelte';
	import { Loader2, Trash2, Plus } from 'lucide-svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import CustomRankSection from './components/custom-rank-section.svelte';
	import LanguageField from './components/language-field.svelte';

	export let data: SuperValidated<Infer<RankingSettingsSchema>>;
	export let actionUrl: string = '?/default';

	const formDebug: boolean = getContext('formDebug');

	const form = superForm(data, {
		validators: zodClient(rankingSettingsSchema),
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

	const qualityTypes = [
		'av1',
		'avc',
		'bluray',
		'dvd',
		'hdtv',
		'hevc',
		'mpeg',
		'remux',
		'vhs',
		'web',
		'webdl',
		'webmux',
		'xvid'
	] as const;

	const ripTypes = [
		'bdrip',
		'brrip',
		'dvdrip',
		'hdrip',
		'ppvrip',
		'satrip',
		'tvrip',
		'uhdrip',
		'vhsrip',
		'webdlrip',
		'webrip'
	] as const;

	const hdrTypes = ['10bit', 'dolby_vision', 'hdr', 'hdr10plus', 'sdr'] as const;

	const audioTypes = [
		'aac',
		'ac3',
		'atmos',
		'dolby_digital',
		'dolby_digital_plus',
		'dts_lossy',
		'dts_lossless',
		'eac3',
		'flac',
		'mono',
		'mp3',
		'stereo',
		'surround',
		'truehd'
	] as const;

	const extraTypes = [
		'3d',
		'converted',
		'documentary',
		'dubbed',
		'edition',
		'hardcoded',
		'network',
		'proper',
		'repack',
		'retail',
		'site',
		'subbed',
		'upscaled'
	] as const;

	const trashTypes = [
		'cam',
		'clean_audio',
		'pdtv',
		'r5',
		'screener',
		'size',
		'telecine',
		'telesync'
	] as const;
</script>

<form method="POST" action={actionUrl} use:enhance class="my-8 flex flex-col gap-4">
	<div class="space-y-4">
		<h3 class="text-lg font-medium">General Settings</h3>
		<TextField {form} name="profile" {formData} />
	</div>

	<Separator />

	<div class="space-y-4">
		<h3 class="text-lg font-medium">Regex</h3>
		<ArrayField {form} name="require" {formData}>
			{#each $formData.require as _, i}
				<Form.ElementField {form} name="require[{i}]">
					<Form.Control let:attrs>
						<div class="flex items-center gap-2">
							<Input
								type="text"
								spellcheck="false"
								autocomplete="false"
								{...attrs}
								bind:value={$formData.require[i]}
							/>
							<Form.Button
								type="button"
								size="sm"
								variant="destructive"
								on:click={() => removeField('require', i)}
							>
								<Trash2 class="h-4 w-4" />
							</Form.Button>
						</div>
					</Form.Control>
				</Form.ElementField>
			{/each}
			<div class="flex w-full items-center justify-between gap-2">
				<p class="text-sm text-muted-foreground">Add Required Regex</p>
				<Form.Button type="button" size="sm" variant="outline" on:click={() => addField('require')}>
					<Plus class="h-4 w-4" />
				</Form.Button>
			</div>
		</ArrayField>

		<ArrayField {form} name="exclude" {formData}>
			{#each $formData.exclude as _, i}
				<Form.ElementField {form} name="exclude[{i}]">
					<Form.Control let:attrs>
						<div class="flex items-center gap-2">
							<Input
								type="text"
								spellcheck="false"
								autocomplete="false"
								{...attrs}
								bind:value={$formData.exclude[i]}
							/>
							<Form.Button
								type="button"
								size="sm"
								variant="destructive"
								on:click={() => removeField('exclude', i)}
							>
								<Trash2 class="h-4 w-4" />
							</Form.Button>
						</div>
					</Form.Control>
				</Form.ElementField>
			{/each}
			<div class="flex w-full items-center justify-between gap-2">
				<p class="text-sm text-muted-foreground">Add Excluded Regex</p>
				<Form.Button type="button" size="sm" variant="outline" on:click={() => addField('exclude')}>
					<Plus class="h-4 w-4" />
				</Form.Button>
			</div>
		</ArrayField>

		<ArrayField {form} name="preferred" {formData}>
			{#each $formData.preferred as _, i}
				<Form.ElementField {form} name="preferred[{i}]">
					<Form.Control let:attrs>
						<div class="flex items-center gap-2">
							<Input
								type="text"
								spellcheck="false"
								autocomplete="false"
								{...attrs}
								bind:value={$formData.preferred[i]}
							/>
							<Form.Button
								type="button"
								size="sm"
								variant="destructive"
								on:click={() => removeField('preferred', i)}
							>
								<Trash2 class="h-4 w-4" />
							</Form.Button>
						</div>
					</Form.Control>
				</Form.ElementField>
			{/each}
			<div class="flex w-full items-center justify-between gap-2">
				<p class="text-sm text-muted-foreground">Add Preferred Regex</p>
				<Form.Button
					type="button"
					size="sm"
					variant="outline"
					on:click={() => addField('preferred')}
				>
					<Plus class="h-4 w-4" />
				</Form.Button>
			</div>
		</ArrayField>
	</div>

	<Separator />

	<GroupCheckboxField
		fieldTitle="Resolutions"
		fieldDescription="Select which resolutions to include"
	>
		<CheckboxField {form} name="resolution_2160p" label="2160p" {formData} isForGroup={true} />
		<CheckboxField {form} name="resolution_1080p" label="1080p" {formData} isForGroup={true} />
		<CheckboxField {form} name="resolution_720p" label="720p" {formData} isForGroup={true} />
		<CheckboxField {form} name="resolution_480p" label="480p" {formData} isForGroup={true} />
		<CheckboxField {form} name="resolution_360p" label="360p" {formData} isForGroup={true} />
		<CheckboxField {form} name="resolution_unknown" label="Unknown" {formData} isForGroup={true} />
	</GroupCheckboxField>

	<Separator />

	<div class="space-y-4">
		<h3 class="text-lg font-medium">Options</h3>
		<NumberField {form} name="title_similarity" {formData} stepValue={0.01} />
		<CheckboxField {form} name="remove_all_trash" {formData} />
		<NumberField {form} name="remove_ranks_under" {formData} stepValue={1} />
		<CheckboxField {form} name="remove_unknown_languages" {formData} />
		<CheckboxField {form} name="allow_english_in_languages" {formData} />
	</div>

	<Separator />

	<div class="space-y-4">
		<h3 class="text-lg font-medium">Languages</h3>
		<LanguageField {form} {formData} name="languages_required" />

		<LanguageField {form} {formData} name="languages_exclude" />

		<LanguageField {form} {formData} name="languages_preferred" />
		<!-- <ArrayField {form} name="languages_required" {formData}>
			{#each $formData.languages_required as _, i}
				<Form.ElementField {form} name="languages_required[{i}]">
					<Form.Control let:attrs>
						<div class="flex items-center gap-2">
							<Input
								type="text"
								spellcheck="false"
								autocomplete="false"
								{...attrs}
								bind:value={$formData.languages_required[i]}
							/>
							<Form.Button
								type="button"
								size="sm"
								variant="destructive"
								on:click={() => removeField('languages_required', i)}
							>
								<Trash2 class="h-4 w-4" />
							</Form.Button>
						</div>
					</Form.Control>
				</Form.ElementField>
			{/each}
			<div class="flex w-full items-center justify-between gap-2">
				<p class="text-sm text-muted-foreground">Add Required Languages</p>
				<Form.Button
					type="button"
					size="sm"
					variant="outline"
					on:click={() => addField('languages_required')}
				>
					<Plus class="h-4 w-4" />
				</Form.Button>
			</div>
		</ArrayField>

		<ArrayField {form} name="languages_exclude" {formData}>
			{#each $formData.languages_exclude as _, i}
				<Form.ElementField {form} name="languages_exclude[{i}]">
					<Form.Control let:attrs>
						<div class="flex items-center gap-2">
							<Input
								type="text"
								spellcheck="false"
								autocomplete="false"
								{...attrs}
								bind:value={$formData.languages_exclude[i]}
							/>
							<Form.Button
								type="button"
								size="sm"
								variant="destructive"
								on:click={() => removeField('languages_exclude', i)}
							>
								<Trash2 class="h-4 w-4" />
							</Form.Button>
						</div>
					</Form.Control>
				</Form.ElementField>
			{/each}
			<div class="flex w-full items-center justify-between gap-2">
				<p class="text-sm text-muted-foreground">Add Excluded Languages</p>
				<Form.Button
					type="button"
					size="sm"
					variant="outline"
					on:click={() => addField('languages_exclude')}
				>
					<Plus class="h-4 w-4" />
				</Form.Button>
			</div>
		</ArrayField>

		<ArrayField {form} name="languages_preferred" {formData}>
			{#each $formData.languages_preferred as _, i}
				<Form.ElementField {form} name="languages_preferred[{i}]">
					<Form.Control let:attrs>
						<div class="flex items-center gap-2">
							<Input
								type="text"
								spellcheck="false"
								autocomplete="false"
								{...attrs}
								bind:value={$formData.languages_preferred[i]}
							/>
							<Form.Button
								type="button"
								size="sm"
								variant="destructive"
								on:click={() => removeField('languages_preferred', i)}
							>
								<Trash2 class="h-4 w-4" />
							</Form.Button>
						</div>
					</Form.Control>
				</Form.ElementField>
			{/each}
			<div class="flex w-full items-center justify-between gap-2">
				<p class="text-sm text-muted-foreground">Add Preferred Languages</p>
				<Form.Button
					type="button"
					size="sm"
					variant="outline"
					on:click={() => addField('languages_preferred')}
				>
					<Plus class="h-4 w-4" />
				</Form.Button>
			</div>
		</ArrayField> -->
	</div>

	<Separator />

	<CustomRankSection
		{form}
		{formData}
		sectionTitle="Quality Settings"
		prefix="quality"
		types={qualityTypes}
	/>

	<CustomRankSection
		{form}
		{formData}
		sectionTitle="Rips Settings"
		prefix="rips"
		types={ripTypes}
	/>

	<CustomRankSection {form} {formData} sectionTitle="HDR Settings" prefix="hdr" types={hdrTypes} />

	<CustomRankSection
		{form}
		{formData}
		sectionTitle="Audio Settings"
		prefix="audio"
		types={audioTypes}
	/>

	<CustomRankSection
		{form}
		{formData}
		sectionTitle="Extras Settings"
		prefix="extras"
		types={extraTypes}
	/>

	<CustomRankSection
		{form}
		{formData}
		sectionTitle="Trash Settings"
		prefix="trash"
		types={trashTypes}
	/>

	<div class="flex w-full justify-end">
		<Form.Button disabled={$delayed} type="submit" size="sm" class="w-full lg:max-w-max">
			{#if $delayed}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			Save changes
			<span class="ml-1" class:hidden={$page.url.pathname === '/settings/ranking'}
				>and continue</span
			>
		</Form.Button>
	</div>
</form>

{#if formDebug}
	<SuperDebug data={$formData} />
{/if}
