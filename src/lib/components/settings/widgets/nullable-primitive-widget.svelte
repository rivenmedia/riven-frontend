<script lang="ts">
    import { getFormContext, type FieldCommonProps, type SchemaValue } from "@sjsf/form";
    import { FORM_ID_FROM_PATH } from "@sjsf/form/internals";
    import { Switch } from "$lib/components/ui/switch";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";

    // This component replaces anyOfField for nullable primitive types (anyOf: [type, null])
    let { config, value = $bindable() }: FieldCommonProps<SchemaValue> = $props();

    const ctx = getFormContext();
    const fieldId = $derived(ctx[FORM_ID_FROM_PATH](config.path));

    // Get field title and determine type from schema
    const fieldTitle = $derived(config.title || "Filter");

    // Check what type this field expects (from the first anyOf option)
    const valueType = $derived.by(() => {
        const anyOf = config.schema.anyOf;
        if (!anyOf || !Array.isArray(anyOf)) return "number";
        const firstOption = anyOf[0];
        if (typeof firstOption === "object" && firstOption !== null) {
            if (firstOption.type === "boolean") return "boolean";
            if (firstOption.type === "integer" || firstOption.type === "number") return "number";
        }
        return "number";
    });

    // Derive enabled state
    const isEnabled = $derived(value !== null && value !== undefined);

    function toggleEnabled(checked: boolean) {
        if (checked) {
            // Enable with default value based on type
            value = valueType === "boolean" ? false : 0;
        } else {
            value = null;
        }
    }

    function updateValue(newValue: number | boolean) {
        value = newValue;
    }
</script>

<div class="space-y-2">
    <div class="flex items-center gap-3">
        <Switch id={`${fieldId}-toggle`} checked={isEnabled} onCheckedChange={toggleEnabled} />
        <Label for={`${fieldId}-toggle`} class="cursor-pointer text-sm font-medium">
            {fieldTitle}
        </Label>
    </div>

    {#if isEnabled}
        <div class="pl-9">
            {#if valueType === "boolean"}
                <Select.Root
                    type="single"
                    value={value === true ? "true" : "false"}
                    onValueChange={(v) => updateValue(v === "true")}>
                    <Select.Trigger class="w-24">
                        {value === true ? "Yes" : "No"}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="true">Yes</Select.Item>
                        <Select.Item value="false">No</Select.Item>
                    </Select.Content>
                </Select.Root>
            {:else}
                <Input
                    id={`${fieldId}-value`}
                    type="number"
                    value={String(value ?? "")}
                    onchange={(e) => updateValue(parseInt(e.currentTarget.value) || 0)}
                    class="h-8 w-32" />
            {/if}
        </div>
    {/if}
</div>
