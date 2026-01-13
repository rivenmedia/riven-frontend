<script lang="ts">
    import { getFormContext, getId, type FieldCommonProps, type SchemaValue } from "@sjsf/form";
    import { Switch } from "$lib/components/ui/switch";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";

    // This component replaces anyOfField for nullable primitive types (anyOf: [type, null])
    let { config, value = $bindable() }: FieldCommonProps<SchemaValue> = $props();

    const form = getFormContext();
    const fieldId = $derived(getId(form, config.path));

    // Get field title and determine type from schema
    const fieldTitle = $derived(config.title || "Filter");

    // Check what type this field expects (from the non-null anyOf option)
    const valueType = $derived.by(() => {
        const anyOf = config.schema.anyOf;
        if (!anyOf || !Array.isArray(anyOf)) return "number";
        const nonNullOption = anyOf.find(
            (s) => typeof s === "object" && s !== null && s.type !== "null"
        );
        if (typeof nonNullOption === "object" && nonNullOption !== null) {
            if (nonNullOption.type === "boolean") return "boolean";
            if (nonNullOption.type === "integer") return "integer";
            if (nonNullOption.type === "number") return "number";
        }
        return "number";
    });

    // Derive enabled state
    const isEnabled = $derived(value !== null && value !== undefined);

    function toggleEnabled(checked: boolean) {
        value = checked ? (valueType === "boolean" ? false : 0) : null;
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
                <!-- Boolean value: use a second switch for Yes/No -->
                <div class="flex items-center gap-2">
                    <Switch
                        id={`${fieldId}-value`}
                        checked={value === true}
                        onCheckedChange={(checked) => (value = checked)} />
                    <Label for={`${fieldId}-value`} class="text-sm">
                        {value === true ? "Yes" : "No"}
                    </Label>
                </div>
            {:else}
                <Input
                    id={`${fieldId}-value`}
                    type="number"
                    step={valueType === "integer" ? "1" : "any"}
                    value={value ?? ""}
                    onchange={(e) => {
                        const raw = e.currentTarget.valueAsNumber;
                        if (Number.isNaN(raw)) {
                            value = 0;
                        } else if (valueType === "integer") {
                            value = Math.round(raw);
                        } else {
                            value = raw;
                        }
                    }}
                    class="h-8 w-32" />
            {/if}
        </div>
    {/if}
</div>
