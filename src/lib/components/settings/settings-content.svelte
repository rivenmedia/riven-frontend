<script lang="ts">
    import { SECTION_GROUPS } from "./settings-sections";
    import { getSettingsContext } from "./settings-context";
    import SectionForm from "./section-form.svelte";

    const store = getSettingsContext();

    const sectionInfo = $derived(SECTION_GROUPS.find((s) => s.id === store.activeSection));
    const state = $derived(store.getSection(store.activeSection));
    const isSaving = $derived(store.savingSectionId === store.activeSection);
    const hasChanges = $derived(state?.form?.isChanged ?? false);
</script>

<div class="flex min-h-0 flex-1 flex-col">
    <!-- Header -->
    {#if sectionInfo}
        <div class="border-b p-6">
            <h1 class="flex items-center gap-2 text-xl font-semibold">
                <sectionInfo.icon class="h-5 w-5" />
                {sectionInfo.title}
            </h1>
            <p class="text-muted-foreground mt-1 text-sm">{sectionInfo.description}</p>
        </div>
    {/if}

    <!-- Form Content -->
    <div class="min-h-0 flex-1 overflow-y-auto">
        <SectionForm
            sectionId={store.activeSection}
            {state}
            saving={isSaving}
            {hasChanges}
            onSave={() => store.save()}
            onReset={() => store.reset()}
            onRetry={() => store.retry()}
            stickyButtons />
    </div>
</div>
