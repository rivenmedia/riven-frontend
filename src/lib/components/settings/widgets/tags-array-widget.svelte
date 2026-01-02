<script lang="ts">
    import type { WidgetCommonProps } from "@sjsf/form/fields/widgets";
    import { TagsInput } from "$lib/components/ui/extras/tags-input";
    import { Label } from "$lib/components/ui/label";

    /**
     * Tags widget for string arrays using the shadcn TagsInput component.
     * Use for non-nullable array fields like video_extensions.
     */

    let { config, handlers, uiOption, value = $bindable() }: WidgetCommonProps<string[]> = $props();

    const fieldTitle = $derived(typeof config.title === "string" ? config.title : "Items");
    // Get placeholder from ui:options if provided (type extended in widgets/index.ts)
    const placeholder = $derived(uiOption("placeholder") ?? "Add value...");

    // Local state that syncs with form value
    let items = $state(Array.isArray(value) ? value : []);

    // Sync form value changes to local state
    $effect(() => {
        if (Array.isArray(value)) {
            items = value;
        }
    });

    // Sync local changes back to form
    $effect(() => {
        if (items !== value) {
            value = items;
            handlers.onchange?.();
        }
    });
</script>

<div class="space-y-2">
    <Label class="text-sm font-medium">{fieldTitle}</Label>
    <TagsInput bind:value={items} {placeholder} />
</div>
