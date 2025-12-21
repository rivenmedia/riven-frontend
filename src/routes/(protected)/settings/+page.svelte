<script lang="ts">
    import type { ActionData, PageData } from "./$types";
    import { createMeta, setupSvelteKitForm } from "@sjsf/sveltekit/client";
    import { setValue } from "@sjsf/form";
    import * as defaults from "$lib/components/settings/form-defaults";
    import { setSettingsFormContext } from "$lib/components/settings-form-context";
    import { toast } from "svelte-sonner";
    import { icons } from "@sjsf/lucide-icons";
    import { invalidateAll } from "$app/navigation";
    import { tick } from "svelte";
    import SettingsLayout from "$lib/components/settings/settings-layout.svelte";

    setSettingsFormContext();

    let { data }: { data: PageData } = $props();

    const meta = createMeta<ActionData, PageData>().form;

    // @ts-expect-error - Schema is provided by page data
    const { form } = setupSvelteKitForm(meta, {
        ...defaults,
        icons,
        delayedMs: 500,
        timeoutMs: 30000,
        // Re-fetch settings after save to ensure UI reflects server state.
        // Trade-off: extra network round-trip vs optimistic update (using submitted
        // values directly). Re-fetching guarantees correctness if server transforms data.
        onSuccess: async (result) => {
            if (result.type === "success") {
                toast.success("Settings saved");
                await invalidateAll();
                await tick();
                // Sync form state with refreshed page data
                if (data.form?.initialValue) {
                    setValue(form, data.form.initialValue);
                }
            } else {
                toast.error("Failed to save settings");
            }
        },
        onFailure: () => {
            toast.error("Something went wrong while saving settings");
        }
    });
</script>

<svelte:head>
    <title>Settings - Riven</title>
</svelte:head>

<div class="mt-14 h-[calc(100vh-3.5rem)] w-full">
    <SettingsLayout {form} />
</div>
