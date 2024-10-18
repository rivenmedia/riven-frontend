<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import "../../app.css"
	import { sendCustomEvent } from '$lib/sendCustomEvent';

    let backendUrlValue = '';
    let apiKeyValue = '';
    let error = '';
    let loading = false;

    onMount(() => {
        backendUrlValue = localStorage.getItem('backendUrl') || '';
        apiKeyValue = localStorage.getItem('apiKey') || '';
    });

    async function validateAndSave() {
        loading = true;
        error = '';

        try {
        const response = await fetch(`${backendUrlValue}/api/v1/health`, {
            method: 'GET',
            headers: {
            'x-api-key': apiKeyValue,
            'backendUrl': backendUrlValue
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

            // Navigate to home
            goto('/');
        } else {
            error = 'Invalid credentials or backend URL';
        }
        } catch (err) {
        error = 'Error connecting to the backend';
        } finally {
        loading = false;
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center">
    <div class="p-8 rounded-lg shadow-md w-96">
        <form on:submit|preventDefault={validateAndSave} class="space-y-4">
            <div>
                <label for="backendUrl" class="block text-sm font-medium text-gray-700">Backend URL</label>
                <input
                    type="url"
                    id="backendUrl"
                    bind:value={backendUrlValue}
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <div>
                <label for="apiKey" class="block text-sm font-medium text-gray-700">API Key</label>
                <input
                    type="password"
                    id="apiKey"
                    bind:value={apiKeyValue}
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            {#if error}
            <p class="text-red-500 text-sm">{error}</p>
            {/if}
            <button
                type="submit"
                disabled={loading}
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                {loading ? 'Validating...' : 'Save and Connect'}
            </button>
        </form>
    </div>
</div>