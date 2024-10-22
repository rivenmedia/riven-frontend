<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import SuperDebug from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import * as Form from '$lib/components/ui/form';
	import { generalSettingsSchema, type GeneralSettingsSchema } from '$lib/forms/helpers';
	import { toast } from 'svelte-sonner';
	import TextField from './components/text-field.svelte';
	import NumberField from './components/number-field.svelte';
	import CheckboxField from './components/checkbox-field.svelte';
	import GroupCheckboxField from './components/group-checkbox-field.svelte';
	import ArrayField from './components/array-field.svelte';
	import { Loader2, Trash2, Plus } from 'lucide-svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';

	export let data: SuperValidated<Infer<GeneralSettingsSchema>>;
	export let actionUrl: string = '?/default';

	const formDebug: boolean = getContext('formDebug');

	const form = superForm(data, {
		validators: zodClient(generalSettingsSchema),
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
	<CheckboxField {form} name="debug" {formData} fieldDescription="Requires restart" />
	<CheckboxField {form} name="log" {formData} fieldDescription="Requires restart" />
	<TextField {form} name="rclone_path" {formData} />
	<TextField {form} name="library_path" {formData} />
	<CheckboxField
		{form}
		name="separate_anime_dirs"
		{formData}
		fieldDescription="Creates anime_movies and anime_shows folders"
	/>
	<CheckboxField {form} name="repair_symlinks" {formData} />
	<NumberField {form} name="repair_interval" stepValue={1} {formData} fieldDescription="In hours" />

	<TextField {form} name="database_host" fieldDescription="Database connection string" {formData} />
	<NumberField
		{form}
		name="indexer_update_interval"
		{formData}
		stepValue={1}
		fieldDescription="In seconds"
	/>

	<GroupCheckboxField
		fieldTitle="Downloaders"
		fieldDescription="Enable only one downloader at a time"
	>
		<CheckboxField
			{form}
			name="realdebrid_enabled"
			label="Real-Debrid"
			{formData}
			isForGroup={true}
		/>
		<CheckboxField
			{form}
			name="alldebrid_enabled"
			label="All-Debrid"
			{formData}
			isForGroup={true}
		/>
		<CheckboxField {form} name="torbox_enabled" label="Torbox" {formData} isForGroup={true} />
	</GroupCheckboxField>

	{#if $formData.realdebrid_enabled}
		<div transition:slide>
			<TextField {form} name="realdebrid_api_key" {formData} isProtected={true} />
		</div>

		<div transition:slide>
			<CheckboxField
				{form}
				name="realdebrid_proxy_enabled"
				label="Real-Debrid Proxy"
				{formData}
				fieldDescription="Use proxy for Real-Debrid API"
			/>
		</div>

		{#if $formData.realdebrid_proxy_enabled}
			<div transition:slide>
				<TextField {form} name="realdebrid_proxy_url" {formData} />
			</div>
		{/if}
	{/if}

	{#if $formData.alldebrid_enabled}
		<div transition:slide>
			<TextField {form} name="alldebrid_api_key" {formData} isProtected={true} />
		</div>

		<div transition:slide>
			<CheckboxField
				{form}
				name="alldebrid_proxy_enabled"
				label="All-Debrid Proxy"
				{formData}
				fieldDescription="Use proxy for All-Debrid API"
			/>
		</div>

		{#if $formData.alldebrid_proxy_enabled}
			<div transition:slide>
				<TextField {form} name="alldebrid_proxy_url" {formData} />
			</div>
		{/if}
	{/if}

	{#if $formData.torbox_enabled}
		<div transition:slide>
			<TextField {form} name="torbox_api_key" {formData} />
		</div>
	{/if}

	<CheckboxField {form} name="notifications_enabled" label="Notifications" {formData} />

	{#if $formData.notifications_enabled}
		<div transition:slide>
			<TextField {form} name="notifications_title" {formData} />
		</div>

		<div transition:slide>
			<ArrayField {form} name="notifications_on_item_type" {formData}>
				{#each $formData.notifications_on_item_type as _, i}
					<Form.ElementField {form} name="notifications_on_item_type[{i}]">
						<Form.Control let:attrs>
							<div class="flex items-center gap-2">
								<Input
									type="text"
									spellcheck="false"
									autocomplete="false"
									{...attrs}
									bind:value={$formData.notifications_on_item_type[i]}
								/>

								<div class="flex items-center gap-2">
									<Form.Button
										type="button"
										size="sm"
										variant="destructive"
										on:click={() => {
											removeField('notifications_on_item_type', i);
										}}
									>
										<Trash2 class="h-4 w-4" />
									</Form.Button>
								</div>
							</div>
						</Form.Control>
					</Form.ElementField>
				{/each}

				<div class="flex w-full items-center justify-between gap-2">
					<p class="text-sm text-muted-foreground">Add notifications type</p>
					<Form.Button
						type="button"
						size="sm"
						variant="outline"
						on:click={() => {
							addField('notifications_on_item_type');
						}}
					>
						<Plus class="h-4 w-4" />
					</Form.Button>
				</div>
			</ArrayField>
		</div>

		<div transition:slide>
			<ArrayField {form} name="notifications_service_urls" {formData}>
				{#each $formData.notifications_service_urls as _, i}
					<Form.ElementField {form} name="notifications_service_urls[{i}]">
						<Form.Control let:attrs>
							<div class="flex items-center gap-2">
								<Input
									type="text"
									spellcheck="false"
									autocomplete="false"
									{...attrs}
									bind:value={$formData.notifications_service_urls[i]}
								/>

								<div class="flex items-center gap-2">
									<Form.Button
										type="button"
										size="sm"
										variant="destructive"
										on:click={() => {
											removeField('notifications_service_urls', i);
										}}
									>
										<Trash2 class="h-4 w-4" />
									</Form.Button>
								</div>
							</div>
						</Form.Control>
					</Form.ElementField>
				{/each}

				<div class="flex w-full items-center justify-between gap-2">
					<p class="text-sm text-muted-foreground">Add notification service urls</p>
					<Form.Button
						type="button"
						size="sm"
						variant="outline"
						on:click={() => {
							addField('notifications_service_urls');
						}}
					>
						<Plus class="h-4 w-4" />
					</Form.Button>
				</div>
			</ArrayField>
		</div>
	{/if}

	<GroupCheckboxField fieldTitle="Post Processing" fieldDescription="Post processing options">
		<CheckboxField
			{form}
			name="subliminal_enabled"
			label="Subtitles Download"
			{formData}
			isForGroup={true}
		/>
	</GroupCheckboxField>

	{#if $formData.subliminal_enabled}
		<div transition:slide>
			<ArrayField {form} name="subliminal_languages" {formData}>
				{#each $formData.subliminal_languages as _, i}
					<Form.ElementField {form} name="subliminal_languages[{i}]">
						<Form.Control let:attrs>
							<div class="flex items-center gap-2">
								<Input
									type="text"
									spellcheck="false"
									autocomplete="false"
									{...attrs}
									bind:value={$formData.subliminal_languages[i]}
								/>

								<div class="flex items-center gap-2">
									<Form.Button
										type="button"
										size="sm"
										variant="destructive"
										on:click={() => {
											removeField('subliminal_languages', i);
										}}
									>
										<Trash2 class="h-4 w-4" />
									</Form.Button>
								</div>
							</div>
						</Form.Control>
					</Form.ElementField>
				{/each}

				<div class="flex w-full items-center justify-between gap-2">
					<p class="text-sm text-muted-foreground">Add subtitle languages</p>
					<Form.Button
						type="button"
						size="sm"
						variant="outline"
						on:click={() => {
							addField('subliminal_languages');
						}}
					>
						<Plus class="h-4 w-4" />
					</Form.Button>
				</div>
			</ArrayField>
		</div>

		<!-- "providers": {
            "opensubtitles": {
              "enabled": false,
              "username": "",
              "password": ""
            },
            "opensubtitlescom": {
              "enabled": false,
              "username": "",
              "password": ""
            }
          } -->

		<div transition:slide>
			<GroupCheckboxField
				fieldTitle="Providers"
				fieldDescription="Some of the subliminal providers"
			>
				<CheckboxField
					{form}
					name="subliminal_providers_opensubtitles_enabled"
					label="OpenSubtitles"
					{formData}
					isForGroup={true}
				/>
				<CheckboxField
					{form}
					name="subliminal_providers_opensubtitlescom_enabled"
					label="OpenSubtitles.com"
					{formData}
					isForGroup={true}
				/>
			</GroupCheckboxField>
		</div>

		{#if $formData.subliminal_providers_opensubtitles_enabled}
			<div transition:slide>
				<TextField
					{form}
					name="subliminal_providers_opensubtitles_username"
					label="Opensubtitles Username"
					{formData}
				/>
				<TextField
					{form}
					name="subliminal_providers_opensubtitles_password"
					label="Opensubtitles Password"
					{formData}
					isProtected={true}
				/>
			</div>
		{/if}

		{#if $formData.subliminal_providers_opensubtitlescom_enabled}
			<div transition:slide>
				<TextField
					{form}
					name="subliminal_providers_opensubtitlescom_username"
					label="Opensubtitles.com Username"
					{formData}
				/>
				<TextField
					{form}
					name="subliminal_providers_opensubtitlescom_password"
					label="Opensubtitles.com Password"
					{formData}
					isProtected={true}
				/>
			</div>
		{/if}
	{/if}

	<Separator class="mt-4" />
	<div class="flex w-full justify-end">
		<Form.Button disabled={$delayed} type="submit" size="sm" class="w-full lg:max-w-max">
			{#if $delayed}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			{/if}
			Save changes
			<span class="ml-1" class:hidden={$page.url.pathname === '/settings/general'}
				>and continue</span
			>
		</Form.Button>
	</div>
</form>

{#if formDebug}
	<SuperDebug data={$formData} />
{/if}
