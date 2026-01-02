<script lang="ts">
    import type { ActionData, PageData } from "./$types";
    import { createMeta, setupSvelteKitForm } from "@sjsf/sveltekit/client";
    import { setValue, type Schema } from "@sjsf/form";
    import * as formDefaults from "$lib/components/settings/form-defaults";
    import type { AppSettings, SettingsFormState } from "$lib/components/settings/form-defaults";
    import { setSettingsFormContext } from "$lib/components/settings-form-context";
    import { toast } from "svelte-sonner";
    import { icons } from "@sjsf/lucide-icons";
    import { invalidateAll } from "$app/navigation";
    import SettingsLayout from "$lib/components/settings/settings-layout.svelte";

    setSettingsFormContext();

    let { data }: { data: PageData } = $props();

    const meta = createMeta<ActionData, PageData>().form;

    // ignore warnings because Schema and UISchema are pre-built on the server - static after page load
    // svelte-ignore state_referenced_locally
    const schema = data.form.schema as Schema;
    // svelte-ignore state_referenced_locally
    const uiSchema = data.form.uiSchema;

    // Track pending form resync after successful save
    let pendingResync = $state(false);

    // setupSvelteKitForm infers from meta, but the schema is dynamic from page data
    // so we need to cast the form to the proper type for type-safe usage in components
    const { form: formState } = setupSvelteKitForm(meta, {
        ...formDefaults,
        schema,
        uiSchema,
        icons,
        delayedMs: 500,
        timeoutMs: 30000,
        // Re-fetch settings after save to ensure UI reflects server state.
        // Trade-off: extra network round-trip vs optimistic update (using submitted
        // values directly). Re-fetching guarantees correctness if server transforms data.
        onSuccess: async (result) => {
            if (result.type === "success") {
                toast.success("Settings saved");
                pendingResync = true;
                await invalidateAll();
                // Data sync happens reactively in the $effect below
            } else {
                toast.error("Failed to save settings");
            }
        },
        onFailure: () => {
            toast.error("Something went wrong while saving settings");
        }
    });

    // Sync form state when data updates after a successful save
    $effect(() => {
        // Access data.form.initialValue to establish reactive dependency
        const newValue = data.form.initialValue;
        if (pendingResync && newValue) {
            setValue(formState, newValue as AppSettings);
            pendingResync = false;
        }
    });

    // Cast to SettingsFormState for type-safe component usage
    // This is valid because we know the schema defines AppSettings
    const form = formState as unknown as SettingsFormState;
</script>

<svelte:head>
    <title>Settings - Riven</title>
</svelte:head>

<div class="mt-14 h-[calc(100vh-3.5rem)] w-full">
    <SettingsLayout {form} schema={data.form.schema!} />
</div>
