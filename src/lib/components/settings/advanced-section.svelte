<script lang="ts">
    import { Field, getValueSnapshot, type FormState, type UiSchemaRoot } from "@sjsf/form";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { exportSettings } from "./export-settings";
    import { toast } from "svelte-sonner";
    import FileDown from "@lucide/svelte/icons/file-down";

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form: FormState<any>;
        paths: string[];
    }

    let { form, paths }: Props = $props();

    const uiSchema: UiSchemaRoot = {
        "ui:options": {
            title: ""
        }
    };

    function handleExport() {
        const settings = getValueSnapshot(form);
        const timestamp = new Date().toISOString().slice(0, 10);
        exportSettings(settings, `riven-settings-${timestamp}.json`);
        toast.success("Settings exported");
    }
</script>

<div class="space-y-6">
    <Card.Root>
        <Card.Content class="space-y-6 pt-6">
            {#each paths as path (path)}
                <Field {form} path={[path]} {uiSchema} />
            {/each}
        </Card.Content>
    </Card.Root>

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
