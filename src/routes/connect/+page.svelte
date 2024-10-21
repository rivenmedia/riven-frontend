<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

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
        } catch (error) {
            console.error('Error fetching server configuration:', error);
        }
    });

    async function validateAndSave() {
        loading = true;
        errorMessage = '';

        try {
            const response = await fetch('/api/configure-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ backendUrl: backendUrlValue, apiKey: apiKeyValue }),
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
        } catch (err) {
            errorMessage = 'An error occurred while configuring the client';
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