<script lang="ts">
    import { Field, type FormState, type UiSchemaRoot } from "@sjsf/form";
    import type { SettingsSection } from "./settings-sections";
    import * as Card from "$lib/components/ui/card";
    import ContentSourcesSection from "./content-sources-section.svelte";
    import ScrapingSection from "./scraping-section.svelte";
    import MediaServersSection from "./media-servers-section.svelte";
    import DownloadersSection from "./downloaders-section.svelte";
    import NotificationsSection from "./notifications-section.svelte";
    import AdvancedSection from "./advanced-section.svelte";

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form: FormState<any>;
        section: SettingsSection;
    }

    let { form, section }: Props = $props();

    // Map section IDs to their custom components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SECTION_COMPONENTS: Record<string, any> = {
        content: ContentSourcesSection,
        scraping: ScrapingSection,
        media_servers: MediaServersSection,
        downloaders: DownloadersSection,
        notifications: NotificationsSection,
        advanced: AdvancedSection
    };

    // Hide the top-level object title since we show our own section header
    const uiSchema: UiSchemaRoot = {
        "ui:options": {
            title: ""
        }
    };
</script>

<div class="settings-section space-y-6">
    <div>
        <h3 class="flex items-center gap-2 text-xl font-semibold">
            <section.icon class="h-5 w-5" />
            {section.label}
        </h3>
        <p class="text-muted-foreground mt-1 text-sm">{section.description}</p>
    </div>

    {#if SECTION_COMPONENTS[section.id]}
        {@const Component = SECTION_COMPONENTS[section.id]}
        {#if section.id === "advanced"}
            <Component {form} paths={section.paths} />
        {:else}
            <Component {form} />
        {/if}
    {:else}
        <!-- Default form field rendering -->
        <Card.Root>
            <Card.Content class="space-y-6 pt-6">
                {#each section.paths as path (path)}
                    <Field {form} path={[path]} {uiSchema} />
                {/each}
            </Card.Content>
        </Card.Root>
    {/if}
</div>

<style>
    /* Hide model name titles (e.g., "ContentModel", "OverseerrModel") that come from JSON schema.
       These are rendered as <legend> elements inside <fieldset> by @sjsf/shadcn4-theme.
       We show our own section headers so these are redundant. */
    .settings-section :global(fieldset > legend) {
        display: none;
    }
</style>
