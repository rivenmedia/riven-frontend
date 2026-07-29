<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import SettingFieldEditor from "./setting-field-editor.svelte";
    import type { SettingsSection } from "./types";

    let {
        section = $bindable(),
        saving,
        savePlugin
    }: {
        section: SettingsSection;
        saving: boolean;
        savePlugin: (section: SettingsSection) => void;
    } = $props();
</script>

<div class="bg-background/55 rounded-[2rem] border p-6 shadow-lg">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <h3 class="text-xl font-semibold">{section.title}</h3>
            {#if section.version}
                <p class="text-muted-foreground mt-2 text-sm">v{section.version}</p>
            {/if}
        </div>
        <Button
            type="button"
            variant="outline"
            disabled={saving}
            onclick={() => savePlugin(section)}>
            {saving ? "Saving…" : "Save plugin"}
        </Button>
    </div>

    {#if section.schema.length === 0}
        <p class="text-muted-foreground text-sm">This plugin has no configurable fields.</p>
    {:else}
        <div class="grid gap-4 lg:grid-cols-2">
            {#each section.schema as field (field.key)}
                <SettingFieldEditor {field} bind:value={section.values[field.key]} />
            {/each}
        </div>
    {/if}
</div>
