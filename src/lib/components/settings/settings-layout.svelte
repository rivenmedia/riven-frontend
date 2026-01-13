<script lang="ts">
    import { browser } from "$app/environment";
    import { MediaQuery } from "svelte/reactivity";
    import * as Accordion from "$lib/components/ui/accordion";
    import { SECTION_GROUPS } from "./settings-sections";
    import { getSettingsContext } from "./settings-context";
    import SettingsSidebar from "./settings-sidebar.svelte";
    import SettingsContent from "./settings-content.svelte";
    import SectionForm from "./section-form.svelte";
    import UnsavedChangesDialog from "./unsaved-changes-dialog.svelte";

    const store = getSettingsContext();

    // Use MediaQuery only in browser, default to desktop on SSR
    const mobileQuery = browser ? new MediaQuery("(max-width: 768px)") : null;
    const isMobile = $derived(mobileQuery?.current ?? false);

    // Track which accordion sections have been opened (for lazy loading)
    let openedSections = $state<Record<string, boolean>>({});

    function handleAccordionValueChange(value: string | string[] | undefined) {
        if (!value || typeof value !== "string") return;

        // Mark as opened for lazy loading tracking
        openedSections[value] = true;

        // Use store's navigation (handles unsaved changes check)
        store.navigateTo(value);
    }

    function handleConfirmNavigation() {
        // Mark pending section as opened before confirming
        const pending = store.pendingSection;
        if (pending) {
            openedSections[pending] = true;
        }
        store.confirmNavigation();
    }
</script>

{#if isMobile}
    <!-- Mobile: Accordion layout -->
    <div class="h-full w-full overflow-auto p-4 pt-18">
        <h1 class="mb-4 text-xl font-semibold">Settings</h1>
        <Accordion.Root type="single" class="w-full" onValueChange={handleAccordionValueChange}>
            {#each SECTION_GROUPS as section (section.id)}
                {@const state = store.getSection(section.id)}
                {@const saving = store.savingSectionId === section.id}
                {@const hasChanges = state?.form?.isChanged ?? false}
                <Accordion.Item value={section.id} class="border-b">
                    <Accordion.Trigger class="flex w-full items-center gap-2 py-4">
                        <section.icon class="h-4 w-4" />
                        <span class="flex-1 text-left">{section.title}</span>
                    </Accordion.Trigger>
                    <Accordion.Content>
                        <div class="pb-4">
                            <p class="text-muted-foreground mb-4 text-sm">{section.description}</p>
                            <SectionForm
                                sectionId={section.id}
                                {state}
                                {saving}
                                {hasChanges}
                                onSave={() => store.save(section.id)}
                                onReset={() => store.reset(section.id)}
                                onRetry={() => store.retry(section.id)}
                                wasOpened={!!openedSections[section.id]} />
                        </div>
                    </Accordion.Content>
                </Accordion.Item>
            {/each}
        </Accordion.Root>
    </div>
{:else}
    <!-- Desktop: Sidebar + Content layout -->
    <div class="mt-14 flex h-[calc(100vh-3.5rem)] w-full">
        <SettingsSidebar />
        <SettingsContent />
    </div>
{/if}

<UnsavedChangesDialog
    open={store.showUnsavedDialog}
    onDiscard={handleConfirmNavigation}
    onCancel={() => store.cancelNavigation()} />
