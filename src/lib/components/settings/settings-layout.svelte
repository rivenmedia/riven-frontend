<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { replaceState } from "$app/navigation";
    import { untrack } from "svelte";
    import {
        Form,
        SubmitButton,
        HiddenIdPrefixInput,
        setFormContext,
        type Schema
    } from "@sjsf/form";
    import { SETTINGS_SECTIONS } from "./settings-sections";
    import SettingsSidebar from "./settings-sidebar.svelte";
    import SettingsSection from "./settings-section.svelte";
    import * as Accordion from "$lib/components/ui/accordion";
    import { MediaQuery } from "svelte/reactivity";
    import type { SettingsFormState } from "./form-defaults";

    interface Props {
        form: SettingsFormState;
        schema: Schema;
    }

    let { form, schema }: Props = $props();

    // Set form context for child components (must be called synchronously at component init)
    // Using untrack because form is a stable reference - its internal state is reactive, not the reference itself
    untrack(() => setFormContext(form));

    // Use MediaQuery only in browser, default to desktop on SSR
    const mobileQuery = browser ? new MediaQuery("(max-width: 768px)") : null;
    const isMobile = $derived(mobileQuery?.current ?? false);

    /** Set of valid section IDs for O(1) validation */
    const validSectionIds = new Set(SETTINGS_SECTIONS.map((s) => s.id));
    /** Default section ID to use when an invalid or missing section is requested */
    const defaultSectionId = SETTINGS_SECTIONS[0].id;

    /**
     * Validates a section ID and returns a valid one.
     * @param sectionId - The section ID to validate (may be null from URL params)
     * @returns A valid section ID, falling back to default if invalid
     */
    function getValidSectionId(sectionId: string | null): string {
        return sectionId && validSectionIds.has(sectionId) ? sectionId : defaultSectionId;
    }

    let activeSection = $state(getValidSectionId(page.url.searchParams.get("section")));

    /**
     * Sets the active section and updates the URL query parameter.
     * Invalid section IDs are coerced to the default section.
     * @param sectionId - The section ID to activate
     */
    function setActiveSection(sectionId: string): void {
        const validId = getValidSectionId(sectionId);
        activeSection = validId;
        // Update URL query param without full navigation
        if (browser) {
            const url = new URL(page.url);
            url.searchParams.set("section", validId);
            // eslint-disable-next-line svelte/no-navigation-without-resolve -- shallow update to current URL, not a route navigation
            replaceState(url, {});
        }
    }
</script>

{#if isMobile}
    <!-- Mobile: Accordion layout -->
    <div class="h-full w-full overflow-auto p-4">
        <Form attributes={{ class: "w-full", method: "POST", novalidate: true }}>
            <HiddenIdPrefixInput {form} />
            <Accordion.Root type="single" class="w-full">
                {#each SETTINGS_SECTIONS as section (section.id)}
                    <Accordion.Item value={section.id}>
                        <Accordion.Trigger class="gap-2">
                            <section.icon class="h-4 w-4" />
                            {section.label}
                        </Accordion.Trigger>
                        <Accordion.Content>
                            <div class="pb-4">
                                <SettingsSection {form} {schema} {section} />
                            </div>
                        </Accordion.Content>
                    </Accordion.Item>
                {/each}
            </Accordion.Root>
            <div class="bg-background sticky bottom-0 border-t p-4">
                <SubmitButton />
            </div>
        </Form>
    </div>
{:else}
    <!-- Desktop: Sidebar + Content layout -->
    <div class="flex h-full">
        <SettingsSidebar {activeSection} {form} onSectionChange={setActiveSection} />

        <div class="flex min-h-0 flex-1 flex-col">
            <Form
                attributes={{
                    class: "flex min-h-0 flex-1 flex-col",
                    method: "POST",
                    novalidate: true
                }}>
                <HiddenIdPrefixInput {form} />
                <div class="min-h-0 flex-1 overflow-y-auto p-6">
                    {#each SETTINGS_SECTIONS as section (section.id)}
                        <div class:hidden={activeSection !== section.id}>
                            <SettingsSection {form} {schema} {section} />
                        </div>
                    {/each}
                </div>
                <div class="bg-background border-t p-4">
                    <SubmitButton />
                </div>
            </Form>
        </div>
    </div>
{/if}
