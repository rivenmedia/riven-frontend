<script lang="ts">
    import { Field, getValueSnapshot, setValue, type Schema } from "@sjsf/form";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { exportSettings } from "./export-settings";
    import { toast } from "svelte-sonner";
    import FileDown from "@lucide/svelte/icons/file-down";
    import CollapsibleCard from "./collapsible-card.svelte";
    import { getSchemaAtPath, getServiceFields } from "./schema-utils";
    import type { SettingsFormState, AppSettings } from "./form-defaults";
    import type { SettingsSection } from "./settings-sections";

    interface Props {
        form: SettingsFormState;
        schema: Schema;
        section: SettingsSection;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- props passed for interface consistency
    let { form, schema, section: _section }: Props = $props();

    type FieldPath = Parameters<typeof Field>[1]["path"];

    const formValue = $derived(getValueSnapshot(form) as AppSettings);

    // Get descriptions from schema
    const loggingSchema = $derived(getSchemaAtPath(schema, "logging"));
    const streamSchema = $derived(getSchemaAtPath(schema, "stream"));
    const indexerSchema = $derived(getSchemaAtPath(schema, "indexer"));
    const subtitleSchema = $derived(getSchemaAtPath(schema, "post_processing.subtitle"));

    // Get field lists from schema
    const loggingFields = $derived(getServiceFields(schema, "logging"));
    const streamFields = $derived(getServiceFields(schema, "stream"));
    const indexerFields = $derived(getServiceFields(schema, "indexer"));
    const subtitleFields = $derived(getServiceFields(schema, "post_processing.subtitle"));

    // Section states
    const logging = $derived(formValue?.logging);
    const subtitle = $derived(formValue?.post_processing?.subtitle);

    function toggleLogging(enabled: boolean) {
        const currentLogging = formValue?.logging ?? {};
        setValue(form, {
            ...formValue,
            logging: { ...currentLogging, enabled }
        } as AppSettings);
    }

    function toggleSubtitle(enabled: boolean) {
        const currentPostProcessing = formValue?.post_processing ?? {};
        const currentSubtitle = currentPostProcessing.subtitle ?? {};
        setValue(form, {
            ...formValue,
            post_processing: {
                ...currentPostProcessing,
                subtitle: { ...currentSubtitle, enabled }
            }
        } as AppSettings);
    }

    function handleExport() {
        try {
            const settings = getValueSnapshot(form);
            const timestamp = new Date().toISOString().slice(0, 10);
            exportSettings(settings, `riven-settings-${timestamp}.json`);
            toast.success("Settings exported");
        } catch (error) {
            console.error("Failed to export settings:", error);
            toast.error("Failed to export settings");
        }
    }
</script>

<div class="space-y-4">
    <!-- File Logging -->
    <CollapsibleCard
        title={loggingSchema?.title || "File Logging"}
        description={loggingSchema?.description}
        hasToggle
        enabled={logging?.enabled ?? false}
        onToggle={toggleLogging}
        contentClass="grid gap-4 sm:grid-cols-2">
        {#each loggingFields as fieldName (fieldName)}
            <Field {form} path={["logging", fieldName] as FieldPath} />
        {/each}
    </CollapsibleCard>

    <!-- Streaming -->
    <CollapsibleCard
        title={streamSchema?.title || "Streaming"}
        description={streamSchema?.description}
        contentClass="grid gap-4 sm:grid-cols-2">
        {#each streamFields as fieldName (fieldName)}
            <Field {form} path={["stream", fieldName] as FieldPath} />
        {/each}
    </CollapsibleCard>

    <!-- Indexer (not collapsible) -->
    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Title class="text-base">{indexerSchema?.title || "Indexer"}</Card.Title>
            {#if indexerSchema?.description}
                <Card.Description>{indexerSchema.description}</Card.Description>
            {/if}
        </Card.Header>
        <Card.Content class="space-y-4">
            {#each indexerFields as fieldName (fieldName)}
                <Field {form} path={["indexer", fieldName] as FieldPath} />
            {/each}
        </Card.Content>
    </Card.Root>

    <!-- Subtitles -->
    <CollapsibleCard
        title={subtitleSchema?.title || "Subtitles"}
        description={subtitleSchema?.description}
        hasToggle
        enabled={subtitle?.enabled ?? false}
        onToggle={toggleSubtitle}
        contentClass="space-y-4">
        {#each subtitleFields as fieldName (fieldName)}
            <Field {form} path={["post_processing", "subtitle", fieldName] as FieldPath} />
        {/each}
    </CollapsibleCard>

    <!-- Export -->
    <Card.Root>
        <Card.Header>
            <Card.Title class="text-base">Export Settings</Card.Title>
            <Card.Description>
                Download your settings as a JSON file. Sensitive values (API keys, tokens) will be
                redacted.
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <Button variant="outline" onclick={handleExport}>
                <FileDown class="mr-2 h-4 w-4" />
                Export Settings
            </Button>
        </Card.Content>
    </Card.Root>
</div>
