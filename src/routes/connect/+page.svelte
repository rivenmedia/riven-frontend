<script lang="ts">
	import { goto } from '$app/navigation';
	import { error } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';

	let backendUrlValue = '';
	let apiKeyValue = '';
	let errorMessage = '';
	let loading = false;

	onMount(async () => {
		try {
			const response = await fetch('/api/configure-client');
			if (response.ok) {
				const config = await response.json();
				backendUrlValue = config.backendUrl;
				apiKeyValue = config.apiKey;
				// If we have a configuration, validate and proceed
				if (backendUrlValue && apiKeyValue) {
					await validateAndSave();
				}
			}
		} catch {
			throw error(500, 'Error fetching server configuration');
		}
	});

	async function validateAndSave() {
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/configure-client', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ backendUrl: backendUrlValue, apiKey: apiKeyValue })
			});

			const data = await response.json();

			if (response.ok) {
				if (data.requiresOnboarding) {
					goto('/onboarding');
				} else {
					goto('/');
				}
			} else {
				errorMessage = data.message || 'Failed to configure client';
			}
		} catch {
			errorMessage = 'An error occurred while configuring the client';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex h-screen items-center justify-center">
	<div class="w-96 rounded-lg">
		<form on:submit|preventDefault={validateAndSave} class="space-y-4">
			<p class="w-full text-center text-base">Connect to your backend</p>
			<div class="space-y-1">
				<Label for="backendUrl" class="text-muted-foreground">Backend URL</Label>
				<Input type="url" id="backendUrl" bind:value={backendUrlValue} required />
			</div>
			<div class="space-y-1">
				<Label for="apiKey" class="text-muted-foreground">API Key</Label>
				<Input type="password" id="apiKey" bind:value={apiKeyValue} required />
			</div>
			{#if errorMessage}
				<p class="text-sm text-red-500">{errorMessage}</p>
			{/if}
			<Button type="submit" disabled={loading} class="mt-2 w-full">
				{loading ? 'Validating...' : 'Save and Connect'}
			</Button>
		</form>
	</div>
</div>
