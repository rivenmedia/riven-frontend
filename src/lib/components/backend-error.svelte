<script lang="ts">
    import * as Alert from "$lib/components/ui/alert";
    import { Button } from "$lib/components/ui/button";
    import AlertTriangle from "@lucide/svelte/icons/alert-triangle";
    import RefreshCw from "@lucide/svelte/icons/refresh-cw";

    interface Props {
        title?: string;
        message: string;
        hint?: string;
        onRetry?: () => void;
    }

    let {
        title = "Unable to Connect",
        message,
        hint = "Please check that the Riven backend is running and accessible.",
        onRetry
    }: Props = $props();

    function handleRetry() {
        if (onRetry) {
            onRetry();
        } else {
            window.location.reload();
        }
    }
</script>

<div class="flex h-full items-center justify-center p-8">
    <Alert.Root variant="destructive" class="max-w-md">
        <AlertTriangle class="h-5 w-5" />
        <Alert.Title class="text-lg">{title}</Alert.Title>
        <Alert.Description class="mt-2 space-y-4">
            <p>{message}</p>
            {#if hint}
                <p class="text-sm opacity-80">{hint}</p>
            {/if}
            <Button onclick={handleRetry} variant="outline" size="sm" class="mt-2 gap-2">
                <RefreshCw class="h-4 w-4" />
                Try Again
            </Button>
        </Alert.Description>
    </Alert.Root>
</div>
