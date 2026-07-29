<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import SettingFieldEditor from "./setting-field-editor.svelte";
    import { buildGeneralSections } from "./helpers";
    import type { SettingsSection } from "./types";

    let {
        section,
        save
    }: {
        section: SettingsSection;
        save: (section: SettingsSection) => Promise<void>;
    } = $props();

    let saving = $state(false);
    const groupedSchema = $derived(buildGeneralSections(section.schema ?? []));

    async function onSave() {
        saving = true;
        await save(section);
        saving = false;
    }
</script>

<div class="space-y-8">
    {#each groupedSchema as group, i (group.title || `__default-${i}`)}
        <section class="space-y-4">
            {#if group.title}
                <h2 class="text-lg font-semibold tracking-tight">{group.title}</h2>
            {/if}
            {#each group.fields as field (field.key)}
                <SettingFieldEditor {field} bind:value={section.values[field.key]} />
            {/each}
        </section>
    {/each}

    <div class="flex flex-wrap gap-3">
        <Button type="button" disabled={saving} onclick={onSave}>
            {saving ? "Saving…" : "Save general settings"}
        </Button>
    </div>
</div>
