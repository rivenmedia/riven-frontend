<script lang="ts">
    import { goto } from '$app/navigation';
    import { error } from '@sveltejs/kit';
    import { onMount } from 'svelte';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Button } from '$lib/components/ui/button';
    import Mountain from '@lucide/svelte/icons/mountain';

    let backendUrlValue: string = $state('http://riven:8080');
    let apiKeyValue: string = $state('');
    let errorMessage: string = $state('');
    let loading: boolean = $state(false);

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

<svelte:head>
    <title>Connect To Backend | Riven</title>
</svelte:head>

<div class="flex h-dvh items-center justify-center">
    <div class="flex w-full max-w-lg flex-col">
        <div class="flex w-full items-center justify-center gap-2 p-4">
            <Mountain />
            <h1 class="text-2xl">Connect to Backend</h1>
        </div>
        <div class="flex w-full flex-col p-4">
            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    validateAndSave();
                }}
                class="flex flex-col gap-y-4"
            >
                <div class="gap-y-1">
                    <Label for="backendUrl" class="text-base text-muted-foreground"
                        >Backend URL</Label
                    >
                    <p class="mb-2 text-sm text-muted-foreground">
                        This is the interna URL of your backend server. It should be in the format
                        <code class="text-purple-500">http://your-backend-url:port</code>.
                    </p>
                    <Input type="url" id="backendUrl" bind:value={backendUrlValue} required />
                </div>
                <div class="gap-y-1">
                    <Label for="apiKey" class="text-base text-muted-foreground">API Key</Label>
                    <p class="mb-2 text-sm text-muted-foreground">
                        This is the API key you use to connect to your backend. Find it in <code
                            class="text-purple-500">settings.json</code
                        > file of your backend.
                    </p>
                    <Input type="password" id="apiKey" bind:value={apiKeyValue} required />
                </div>
                {#if errorMessage}
                    <p class="text-sm text-red-500">{errorMessage}</p>
                {/if}
                <Button type="submit" disabled={loading} class="mt-4 w-full">
                    {loading ? 'Validating...' : 'Save and Connect'}
                </Button>
            </form>
            <div class="mt-4 flex w-full items-center justify-center text-center">
                <p class="text-sm text-muted-foreground">
                    Read our <a
                        href="https://rivenmedia.github.io/wiki/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-500">documentation</a
                    > to learn more about connecting to your backend.
                </p>
            </div>
            <div class="mt-2 flex w-full items-center justify-center">
                <p class="text-sm text-muted-foreground">
                    Still need help? <a
                        href="https://discord.gg/YGRrDgzcfK"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-500">Ask in #🆘・support on discord</a
                    >
                </p>
            </div>
        </div>
    </div>
</div>
