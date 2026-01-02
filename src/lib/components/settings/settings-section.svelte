<script lang="ts">
    import { Field, type Schema } from "@sjsf/form";
    import { GENERAL_SECTION_ID, type SettingsSection } from "./settings-sections";
    import * as Card from "$lib/components/ui/card";
    import FieldGroups from "./field-groups.svelte";
    import ServicesSection from "./services-section.svelte";
    import NotificationsSection from "./notifications-section.svelte";
    import RankingSection from "./ranking-section.svelte";
    import AdvancedSection from "./advanced-section.svelte";
    import type { SettingsFormState } from "./form-defaults";

    interface Props {
        form: SettingsFormState;
        schema: Schema;
        section: SettingsSection;
    }

    let { form, schema, section }: Props = $props();

    // Sections with custom rendering logic that can't use the generic ServicesSection
    const CUSTOM_SECTIONS = {
        notifications: NotificationsSection,
        ranking: RankingSection,
        advanced: AdvancedSection
    } as const;

    type CustomSectionId = keyof typeof CUSTOM_SECTIONS;

    // Check if this section should use the generic services renderer
    const hasServicesPath = $derived(!!section.servicesPath);
    const isCustomSection = $derived(section.id in CUSTOM_SECTIONS);

    type FieldPath = Parameters<typeof Field>[1]["path"];
</script>

<div class="space-y-6">
    <div>
        <h3 class="flex items-center gap-2 text-xl font-semibold">
            <section.icon class="h-5 w-5" />
            {section.label}
        </h3>
        <p class="text-muted-foreground mt-1 text-sm">{section.description}</p>
    </div>

    {#if isCustomSection}
        <!-- Sections with custom rendering requirements -->
        {@const SectionComponent = CUSTOM_SECTIONS[section.id as CustomSectionId]}
        <SectionComponent {form} {schema} {section} />
    {:else if hasServicesPath}
        <!-- Generic services section (content, scraping, media_servers, downloaders) -->
        <ServicesSection {form} {schema} {section} />
    {:else if section.id === GENERAL_SECTION_ID}
        <!-- General section uses root-level field groups -->
        <FieldGroups {form} {schema} sectionPath="" />
    {:else}
        <!-- Default form field rendering for sections without custom components -->
        <Card.Root>
            <Card.Content class="space-y-6 pt-6">
                {#each section.paths as path (path)}
                    <Field {form} path={[path] as FieldPath} />
                {/each}
            </Card.Content>
        </Card.Root>
    {/if}
</div>
