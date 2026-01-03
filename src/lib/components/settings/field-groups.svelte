<script lang="ts">
    import { Field, type Schema } from "@sjsf/form";
    import { getFieldGroupsForSection } from "./ui-schema";
    import type { SettingsFormState } from "./form-defaults";

    interface Props {
        form: SettingsFormState;
        schema: Schema;
        sectionPath: string;
    }

    let { form, schema, sectionPath }: Props = $props();

    // Get field groups validated against schema
    const groups = $derived(getFieldGroupsForSection(schema, sectionPath));

    type FieldPath = Parameters<typeof Field>[1]["path"];

    /**
     * Build the field path based on whether we're at root level or nested.
     * Root-level fields use [fieldName], nested use [sectionPath, fieldName].
     */
    function getFieldPath(fieldName: string): FieldPath {
        return (sectionPath ? [sectionPath, fieldName] : [fieldName]) as FieldPath;
    }

    // Static class lookup - Tailwind purges dynamic classes at build time
    const lgGridCols: Record<number, string> = {
        1: "lg:grid-cols-1",
        2: "lg:grid-cols-2",
        3: "lg:grid-cols-3",
        4: "lg:grid-cols-4"
    };

    /**
     * Get grid class based on field count and layout preference.
     * Groups with 1-2 fields or layout="stack" stay stacked (1 column).
     * Groups with 3+ fields use responsive multi-column layout.
     */
    function getGridClass(fieldCount: number, layout?: "stack" | "grid"): string {
        if (layout === "stack" || fieldCount <= 2) return "";
        const cols = Math.min(fieldCount, 4) as 1 | 2 | 3 | 4;
        return `sm:grid-cols-2 ${lgGridCols[cols]}`;
    }
</script>

{#if groups.length > 0}
    <div class="space-y-4">
        {#each groups as group (group.id)}
            <!-- Fields grouped together - labels come from schema -->
            <div class="bg-muted/30 rounded-lg border p-4">
                <div class="grid gap-4 {getGridClass(group.fields.length, group.layout)}">
                    {#each group.fields as fieldName (fieldName)}
                        <Field {form} path={getFieldPath(fieldName)} />
                    {/each}
                </div>
            </div>
        {/each}
    </div>
{/if}
