<script lang="ts">
    import { BasicForm } from "@sjsf/form";
    import { Button } from "$lib/components/ui/button";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import type { SectionData } from "./settings-store.svelte";

    interface Props {
        sectionId: string;
        state: SectionData | undefined;
        saving: boolean;
        hasChanges: boolean;
        onSave: () => void;
        onReset: () => void;
        onRetry: () => void;
        wasOpened?: boolean;
        stickyButtons?: boolean;
    }

    const {
        sectionId,
        state,
        saving,
        hasChanges,
        onSave,
        onReset,
        onRetry,
        wasOpened = true,
        stickyButtons = false
    }: Props = $props();
</script>

{#if state?.isLoading}
    <div class="flex items-center justify-center py-8">
        <Loader2 class="h-6 w-6 animate-spin" />
    </div>
{:else if state?.error}
    <div class="py-4 text-center">
        <p class="text-destructive mb-2 text-sm">{state.error}</p>
        <Button variant="outline" size="sm" onclick={onRetry}>Retry</Button>
    </div>
{:else if state?.form}
    <div class="p-6">
        <!-- Key forces remount when section changes. BasicForm doesn't handle
             receiving a different FormState mid-lifecycle. -->
        {#key sectionId}
            <div class="settings-form">
                <BasicForm form={state.form} />
            </div>
        {/key}
        {#if state.clientErrors.length > 0 || state.serverError}
            <div class="mt-4 space-y-2">
                {#if state.clientErrors.length > 0}
                    <div class="border-destructive/50 bg-destructive/10 rounded-md border p-3">
                        <p class="text-destructive mb-1 text-sm font-medium">Validation errors:</p>
                        <ul class="text-destructive list-inside list-disc text-sm">
                            {#each state.clientErrors as error, i (i)}
                                <li>{error}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
                {#if state.serverError}
                    <div class="border-destructive/50 bg-destructive/10 rounded-md border p-3">
                        <p class="text-destructive text-sm">{state.serverError}</p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
    <!-- Save/discard buttons - sticky in desktop mode -->
    <div class="flex gap-2 border-t p-4 {stickyButtons ? 'bg-background sticky bottom-0' : 'mt-4'}">
        <Button onclick={onSave} disabled={saving} class="w-full sm:w-auto">
            {#if saving}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Saving...
            {:else}
                Save Changes
            {/if}
        </Button>
        {#if hasChanges}
            <Button variant="outline" onclick={onReset} disabled={saving} class="w-full sm:w-auto">
                Discard
            </Button>
        {/if}
    </div>
{:else if !wasOpened}
    <div class="flex items-center justify-center py-8">
        <p class="text-muted-foreground text-sm">Expand to load settings...</p>
    </div>
{:else}
    <!-- Brief loading state before effect runs -->
    <div class="flex items-center justify-center py-8">
        <Loader2 class="h-6 w-6 animate-spin" />
    </div>
{/if}
