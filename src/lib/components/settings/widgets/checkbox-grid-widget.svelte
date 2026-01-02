<script lang="ts">
    import { getFormContext, getId } from "@sjsf/form";
    import type { WidgetCommonProps } from "@sjsf/form/fields/widgets";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Label } from "$lib/components/ui/label";
    import { formatKey } from "../schema-utils";

    type BooleanRecord = Record<string, boolean>;

    let { config, handlers, value = $bindable({}) }: WidgetCommonProps<BooleanRecord> = $props();

    const form = getFormContext();
    const fieldId = $derived(getId(form, config.path));

    const keys = $derived.by(() => {
        const props = config.schema.properties as Record<string, unknown> | undefined;
        return props ? Object.keys(props) : [];
    });

    function getLabel(key: string): string {
        // Prefer schema title, fallback to formatted key
        const props = config.schema.properties as Record<string, { title?: string }> | undefined;
        const schemaTitle = props?.[key]?.title;
        return schemaTitle || formatKey(key);
    }

    function updateKey(key: string, checked: boolean) {
        value = { ...value, [key]: checked };
        handlers.onchange?.();
    }
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
    {#each keys as key (key)}
        <div class="flex items-center space-x-2">
            <Checkbox
                id={`${fieldId}-${key}`}
                checked={value[key] ?? false}
                onCheckedChange={(checked) => updateKey(key, !!checked)} />
            <Label for={`${fieldId}-${key}`} class="cursor-pointer text-sm">
                {getLabel(key)}
            </Label>
        </div>
    {/each}
</div>
