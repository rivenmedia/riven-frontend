<script lang="ts">
    import { dev } from "$app/environment";
    import { getFormContext, getId, type FieldCommonProps, type SchemaValue } from "@sjsf/form";
    import { Switch } from "$lib/components/ui/switch";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import X from "@lucide/svelte/icons/x";
    import Plus from "@lucide/svelte/icons/plus";

    /**
     * This widget handles nullable array types (anyOf: [array, null]).
     * Currently only supports string[] arrays - items are rendered as text chips
     * with a text input for adding new values.
     */
    let { config, value = $bindable() }: FieldCommonProps<SchemaValue> = $props();

    const form = getFormContext();
    const fieldId = $derived(getId(form, config.path));

    // Get field title from config
    const fieldTitle = $derived(config.title || "Filter");

    // Derive the array item type from schema (anyOf: [{ type: "array", items: { type: "..." } }, { type: "null" }])
    const itemType = $derived.by(() => {
        const anyOf = config.schema.anyOf;
        if (!Array.isArray(anyOf)) return "string";
        const arraySchema = anyOf.find(
            (s) => typeof s === "object" && s !== null && s.type === "array"
        );
        if (!arraySchema || typeof arraySchema !== "object") return "string";
        const items = (arraySchema as { items?: { type?: string } }).items;
        return items?.type ?? "string";
    });

    // Warn in development if using unsupported item type
    $effect(() => {
        if (dev && itemType !== "string") {
            console.warn(
                `[nullable-array-widget] Unsupported item type "${itemType}" for field "${config.path.join(".")}". ` +
                    `This widget only supports string arrays. Non-string items will be converted to strings.`
            );
        }
    });

    // Derive enabled state from whether value is an array (not null)
    const isEnabled = $derived(Array.isArray(value));
    // Convert items to strings for display; this widget only properly supports string[]
    const items = $derived(isEnabled ? (value as unknown[]).map((item) => String(item)) : []);

    let newItem = $state("");

    function toggleEnabled(checked: boolean) {
        if (checked) {
            // Enable: set to empty array
            value = [];
        } else {
            // Disable: set to null
            value = null;
        }
    }

    function addItem() {
        if (!newItem.trim()) return;
        value = [...items, newItem.trim()];
        newItem = "";
    }

    function removeItem(index: number) {
        value = items.filter((_, i) => i !== index);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            addItem();
        }
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
        <div class="space-y-2 pl-1">
            <!-- Existing items -->
            {#if items.length > 0}
                <div class="flex flex-wrap gap-2">
                    {#each items as item, index (index)}
                        <div class="bg-muted flex items-center gap-1 rounded-md px-2 py-1 text-sm">
                            <span>{item}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onclick={() => removeItem(index)}
                                aria-label="Remove item"
                                class="ml-1 h-4 w-4">
                                <X class="h-3 w-3" />
                            </Button>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Add new item -->
            <div class="flex gap-2">
                <Input
                    id={`${fieldId}-new`}
                    type="text"
                    placeholder="Add value..."
                    bind:value={newItem}
                    onkeydown={handleKeydown}
                    class="h-8 flex-1" />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onclick={addItem}
                    disabled={!newItem.trim()}
                    class="h-8">
                    <Plus class="h-4 w-4" />
                </Button>
            </div>
        </div>
    {/if}
</div>
