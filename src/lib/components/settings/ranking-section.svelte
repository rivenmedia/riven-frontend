<script lang="ts">
    import { Field, type Schema } from "@sjsf/form";
    import * as Card from "$lib/components/ui/card";
    import { getSchemaAtPath, formatKey } from "./schema-utils";
    import type { SettingsFormState } from "./form-defaults";
    import type { SettingsSection } from "./settings-sections";

    interface Props {
        form: SettingsFormState;
        schema: Schema;
        section: SettingsSection;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- props passed for interface consistency
    let { form, schema, section: _section }: Props = $props();

    type FieldPath = Parameters<typeof Field>[1]["path"];

    // Get schema metadata for subsections
    const resolutionsSchema = $derived(getSchemaAtPath(schema, "ranking.resolutions"));
    const optionsSchema = $derived(getSchemaAtPath(schema, "ranking.options"));
    const languagesSchema = $derived(getSchemaAtPath(schema, "ranking.languages"));
    const customRanksSchema = $derived(getSchemaAtPath(schema, "ranking.custom_ranks"));

    // Get category keys and titles from schema
    const categories = $derived.by(() => {
        if (!customRanksSchema?.properties) return [];
        const props = customRanksSchema.properties as Record<string, { title?: string }>;
        return Object.entries(props).map(([key, propSchema]) => ({
            key,
            title: propSchema.title || formatKey(key)
        }));
    });
</script>

<div class="space-y-6">
    <!-- UI grouping: profile name/enabled don't have a schema wrapper object -->
    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Title class="text-base">Profile Settings</Card.Title>
            <Card.Description>Basic ranking profile configuration</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
                <Field {form} path={["ranking", "name"] as FieldPath} />
                <Field {form} path={["ranking", "enabled"] as FieldPath} />
            </div>
        </Card.Content>
    </Card.Root>

    <!-- UI grouping: pattern fields don't have a schema wrapper object -->
    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Title class="text-base">Pattern Filters</Card.Title>
            <Card.Description>Patterns to match, exclude, or prefer in torrents</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
            <Field {form} path={["ranking", "require"] as FieldPath} />
            <Field {form} path={["ranking", "exclude"] as FieldPath} />
            <Field {form} path={["ranking", "preferred"] as FieldPath} />
        </Card.Content>
    </Card.Root>

    <!-- Resolutions - title/description from schema -->
    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Title class="text-base">{resolutionsSchema?.title || "Resolutions"}</Card.Title>
            {#if resolutionsSchema?.description}
                <Card.Description>{resolutionsSchema.description}</Card.Description>
            {/if}
        </Card.Header>
        <Card.Content>
            <Field {form} path={["ranking", "resolutions"] as FieldPath} />
        </Card.Content>
    </Card.Root>

    <!-- Options - title/description from schema -->
    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Title class="text-base">{optionsSchema?.title || "Options"}</Card.Title>
            {#if optionsSchema?.description}
                <Card.Description>{optionsSchema.description}</Card.Description>
            {/if}
        </Card.Header>
        <Card.Content>
            <Field {form} path={["ranking", "options"] as FieldPath} />
        </Card.Content>
    </Card.Root>

    <!-- Languages - title/description from schema -->
    <Card.Root>
        <Card.Header class="pb-2">
            <Card.Title class="text-base">{languagesSchema?.title || "Languages"}</Card.Title>
            {#if languagesSchema?.description}
                <Card.Description>{languagesSchema.description}</Card.Description>
            {/if}
        </Card.Header>
        <Card.Content class="space-y-4">
            <Field {form} path={["ranking", "languages"] as FieldPath} />
        </Card.Content>
    </Card.Root>

    <!-- Custom Ranks - title/description from schema -->
    {#if categories.length > 0}
        <Card.Root>
            <Card.Header class="pb-2">
                <Card.Title class="text-base"
                    >{customRanksSchema?.title || "Custom Ranks"}</Card.Title>
                {#if customRanksSchema?.description}
                    <Card.Description>{customRanksSchema.description}</Card.Description>
                {/if}
            </Card.Header>
            <Card.Content class="space-y-6">
                {#each categories as category (category.key)}
                    <div class="space-y-2">
                        <h4 class="text-sm font-medium">{category.title}</h4>
                        <Field
                            {form}
                            path={["ranking", "custom_ranks", category.key] as FieldPath} />
                    </div>
                {/each}
            </Card.Content>
        </Card.Root>
    {/if}
</div>
