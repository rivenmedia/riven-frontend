<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { untrack } from "svelte";
    import {
        Form,
        SubmitButton,
        HiddenIdPrefixInput,
        setFormContext,
        type FormState
    } from "@sjsf/form";
    import { SETTINGS_SECTIONS } from "./settings-sections";
    import SettingsSidebar from "./settings-sidebar.svelte";
    import SettingsSection from "./settings-section.svelte";
    import * as Accordion from "$lib/components/ui/accordion";
    import { MediaQuery } from "svelte/reactivity";

    interface Props {
        // TODO: Generate TypeScript types from the backend's /api/v1/settings/schema endpoint
        // at build time to replace `any` with a proper type. The schema is dynamic (fetched at
        // runtime), so we currently lack compile-time type information for the form data.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form: FormState<any>;
    }

    let { form }: Props = $props();

    // Set form context for child components (must be called synchronously at component init)
    // Using untrack because form is a stable reference - its internal state is reactive, not the reference itself
    untrack(() => setFormContext(form));

    // Use MediaQuery only in browser, default to desktop on SSR
    const mobileQuery = browser ? new MediaQuery("(max-width: 768px)") : null;
    const isMobile = $derived(mobileQuery?.current ?? false);

    // Get initial section from URL or default to first section
    let activeSection = $state(page.url.searchParams.get("section") || SETTINGS_SECTIONS[0].id);

    function setActiveSection(sectionId: string) {
        activeSection = sectionId;
        const url = new URL(page.url);
        url.searchParams.set("section", sectionId);
        // Use history API directly since we're updating query params, not navigating
        history.replaceState(history.state, "", url);
    }
</script>

{#if isMobile}
    <!-- Mobile: Accordion layout -->
    <div class="h-full w-full overflow-auto p-4">
        <Form attributes={{ class: "w-full", method: "POST" }}>
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
                                <SettingsSection {form} {section} />
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
            <Form attributes={{ class: "flex min-h-0 flex-1 flex-col", method: "POST" }}>
                <HiddenIdPrefixInput {form} />
                <div class="min-h-0 flex-1 overflow-y-auto p-6">
                    {#each SETTINGS_SECTIONS as section (section.id)}
                        <div class:hidden={activeSection !== section.id}>
                            <SettingsSection {form} {section} />
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
