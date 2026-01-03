<script lang="ts">
    import type { WidgetCommonProps } from "@sjsf/form/fields/widgets";
    import { Label } from "$lib/components/ui/label";

    /**
     * Read-only display widget for fields that shouldn't be editable.
     * Displays the value as plain text instead of an input.
     */

    let { config, value }: WidgetCommonProps<string> = $props();

    const fieldTitle = $derived(config.title || "");
</script>

<div class="space-y-2">
    {#if fieldTitle}
        <Label class="text-sm font-medium">{fieldTitle}</Label>
    {/if}
    <div class="bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm">
        {value || "—"}
    </div>
</div>
