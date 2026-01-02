<script lang="ts">
    import { Field, getValueSnapshot, type Schema } from "@sjsf/form";
    import ServiceCard from "./service-card.svelte";
    import FieldGroups from "./field-groups.svelte";
    import { createToggleHelpers } from "./toggle-helpers";
    import { getServiceFields, getServiceDescription, getServicesFromSchema } from "./schema-utils";
    import type { SettingsFormState, AppSettings } from "./form-defaults";
    import type { SettingsSection } from "./settings-sections";

    interface Props {
        form: SettingsFormState;
        schema: Schema;
        section: SettingsSection;
    }

    let { form, schema, section }: Props = $props();

    // The schema path for this section's services
    const sectionPath = $derived(section.servicesPath ?? section.paths[0]);

    const formValue = $derived(getValueSnapshot(form) as AppSettings);

    const services = $derived(
        section.servicesPath ? getServicesFromSchema(schema, section.servicesPath) : []
    );

    const { getEnabled, setEnabled } = $derived(
        createToggleHelpers(
            () => form,
            () => formValue as Record<string, unknown>,
            sectionPath
        )
    );

    type FieldPath = Parameters<typeof Field>[1]["path"];
</script>

<div class="space-y-6">
    <FieldGroups {form} {schema} {sectionPath} />

    {#if services.length > 0}
        <div class="space-y-4">
            {#if section.servicesLabel}
                <h4 class="text-sm font-medium">{section.servicesLabel}</h4>
            {/if}
            {#each services as service (service.key)}
                {@const isEnabled = getEnabled(service.key)}
                {@const fields = getServiceFields(schema, `${sectionPath}.${service.key}`)}
                {@const description = getServiceDescription(
                    schema,
                    `${sectionPath}.${service.key}`
                )}
                <ServiceCard
                    title={service.title}
                    {description}
                    enabled={isEnabled}
                    onToggle={(enabled) => setEnabled(service.key, enabled)}>
                    <div class="space-y-4">
                        {#each fields as fieldName (fieldName)}
                            <Field
                                {form}
                                path={[sectionPath, service.key, fieldName] as FieldPath} />
                        {/each}
                    </div>
                </ServiceCard>
            {/each}
        </div>
    {/if}
</div>
