<script lang="ts">
    import { getFormContext, type FieldCommonProps, type SchemaValue } from "@sjsf/form";
    import { FORM_ID_FROM_PATH } from "@sjsf/form/internals";
    import { Switch } from "$lib/components/ui/switch";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import X from "@lucide/svelte/icons/x";
    import Plus from "@lucide/svelte/icons/plus";

    // This component replaces anyOfField for nullable array types (anyOf: [array, null])
    let { config, value = $bindable() }: FieldCommonProps<SchemaValue> = $props();

    const ctx = getFormContext();
    const fieldId = $derived(ctx[FORM_ID_FROM_PATH](config.path));

    // Get field title from config
    const fieldTitle = $derived(config.title || "Filter");

    // Derive enabled state from whether value is an array (not null)
    const isEnabled = $derived(Array.isArray(value));
    const items = $derived(isEnabled ? (value as string[]) : []);

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
                            <button
                                type="button"
                                onclick={() => removeItem(index)}
                                class="text-muted-foreground hover:text-foreground ml-1">
                                <X class="h-3 w-3" />
                            </button>
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
