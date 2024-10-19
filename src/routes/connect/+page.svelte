<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import '../../app.css';
	import { sendCustomEvent } from '$lib/sendCustomEvent';
	import { DefaultService } from '$lib/client/services.gen';
	import { error } from '@sveltejs/kit';

	let backendUrlValue = '';
	let apiKeyValue = '';
	let errorMessage = '';
	let loading = false;

	onMount(() => {
		backendUrlValue = localStorage.getItem('backendUrl') || '';
		apiKeyValue = localStorage.getItem('apiKey') || '';
		if (backendUrlValue && apiKeyValue) {
			validateAndSave();
		}
	});

	async function validateAndSave() {
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch(`${backendUrlValue}/api/v1/health`, {
				method: 'GET',
				headers: {
					'x-api-key': apiKeyValue,
					backendUrl: backendUrlValue
				}
			});

			if (response.status === 200) {
				// Save to localStorage
				localStorage.setItem('backendUrl', backendUrlValue);
				localStorage.setItem('apiKey', apiKeyValue);

				await sendCustomEvent('initialize-api', {
					'Backend-Url': backendUrlValue,
					'Api-Key': apiKeyValue
				});

				const { data, error: apiError } = await DefaultService.services();

				if (apiError || !data) {
					return error(500, 'API Error');
				}

				const toCheck = ['symlink', 'symlinklibrary'];
				const allServicesTrue: boolean = toCheck.every((service) => data[service] === true);
				if (!allServicesTrue) {
					goto('/onboarding');
				}

				// Navigate to home
				goto('/');
			} else if (response.status === 401) {
				errorMessage = 'Invalid API Key';
			} else {
				errorMessage = 'Unkown error';
			}
		} catch {
			errorMessage = 'Error connecting to the backend';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-96 rounded-lg p-8 shadow-md">
		<form on:submit|preventDefault={validateAndSave} class="space-y-4">
			<div>
				<label for="backendUrl" class="block text-sm font-medium text-gray-700">Backend URL</label>
				<input
					type="url"
					id="backendUrl"
					bind:value={backendUrlValue}
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>
			<div>
				<label for="apiKey" class="block text-sm font-medium text-gray-700">API Key</label>
				<input
					type="password"
					id="apiKey"
					bind:value={apiKeyValue}
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>
			{#if errorMessage}
				<p class="text-sm text-red-500">{errorMessage}</p>
			{/if}
			<button
				type="submit"
				disabled={loading}
				class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
			>
				{loading ? 'Validating...' : 'Save and Connect'}
			</button>
		</form>
	</div>
</div>
