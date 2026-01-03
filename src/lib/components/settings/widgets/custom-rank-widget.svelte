<script lang="ts">
    import { getFormContext, getId, type FieldCommonProps, type SchemaValue } from "@sjsf/form";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { formatKey } from "../schema-utils";

    type CustomRankValue = {
        fetch?: boolean;
        use_custom_rank?: boolean;
        rank?: number;
    };

    // This component replaces objectField for CustomRank objects
    let { config, value = $bindable() }: FieldCommonProps<SchemaValue> = $props();

    const form = getFormContext();
    const fieldId = $derived(getId(form, config.path));

    // Derive display name from the field key since schema uses $ref without per-field titles
    // (config.title is always "CustomRank" from the $ref definition)
    const displayName = $derived(formatKey(config.path[config.path.length - 1] as string));

    const currentValue = $derived<CustomRankValue>({
        fetch: (value as CustomRankValue)?.fetch ?? true,
        use_custom_rank: (value as CustomRankValue)?.use_custom_rank ?? false,
        rank: (value as CustomRankValue)?.rank ?? 0
    });

    function updateField(field: keyof CustomRankValue, newValue: boolean | number) {
        value = { ...currentValue, [field]: newValue };
    }
</script>

<div class="flex flex-wrap items-center gap-4">
    <span class="w-28 text-sm font-medium">{displayName}</span>
    <div class="flex items-center gap-2">
        <Checkbox
            id={`${fieldId}-fetch`}
            checked={currentValue.fetch}
            onCheckedChange={(checked) => updateField("fetch", !!checked)} />
        <Label for={`${fieldId}-fetch`} class="cursor-pointer text-sm">Fetch</Label>
    </div>

    <div class="flex items-center gap-2">
        <Checkbox
            id={`${fieldId}-use-custom-rank`}
            checked={currentValue.use_custom_rank}
            onCheckedChange={(checked) => updateField("use_custom_rank", !!checked)} />
        <Label for={`${fieldId}-use-custom-rank`} class="cursor-pointer text-sm">Custom Rank</Label>
    </div>

    <div class="flex items-center gap-2">
        <Label for={`${fieldId}-rank`} class="text-sm">Rank:</Label>
        <Input
            id={`${fieldId}-rank`}
            type="number"
            value={currentValue.rank}
            onchange={(e) => {
                const num = e.currentTarget.valueAsNumber;
                updateField("rank", Number.isFinite(num) ? num : 0);
            }}
            class="h-8 w-20" />
    </div>
</div>
