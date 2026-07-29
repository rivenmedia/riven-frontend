<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import SettingFieldEditor from "./setting-field-editor.svelte";
    import { pluginStatus } from "./helpers";
    import type { SettingsSection, SetupGroup } from "./types";

    let {
        sections,
        groups,
        save
    }: {
        sections: SettingsSection[];
        groups: SetupGroup[];
        save: (section: SettingsSection) => Promise<void>;
    } = $props();

    let selectedId = $state<string | null>(null);
    let saving = $state(false);
    const selected = $derived(sections.find((s) => s.id === selectedId) ?? sections[0] ?? null);

    // Group plugins by their backend category, in the backend-defined group
    // order (media → sources → services), each sorted by name. Anything with an
    // unknown/missing category lands in a trailing "Other" group.
    const grouped = $derived.by(() => {
        const byName = (a: SettingsSection, b: SettingsSection) => a.title.localeCompare(b.title);
        const knownIds = new Set(groups.map((group) => group.id));

        const result = groups
            .map((group) => ({
                title: group.title,
                sections: sections.filter((s) => s.category === group.id).sort(byName)
            }))
            .filter((group) => group.sections.length > 0);

        const other = sections.filter((s) => !s.category || !knownIds.has(s.category)).sort(byName);
        if (other.length > 0) result.push({ title: "Other", sections: other });

        return result;
    });

    async function savePlugin() {
        if (!selected) return;
        saving = true;
        await save(selected);
        saving = false;
    }
</script>

{#if sections.length === 0}
    <p class="text-muted-foreground text-sm">No plugins registered.</p>
{:else}
    <div class="flex gap-6">
        <aside class="w-48 shrink-0 space-y-4">
            {#each grouped as group (group.title)}
                <div class="space-y-1">
                    <p
                        class="text-muted-foreground px-3 pb-0.5 text-xs font-medium tracking-wide uppercase">
                        {group.title}
                    </p>
                    {#each group.sections as section (section.id)}
                        <button
                            type="button"
                            onclick={() => (selectedId = section.id)}
                            class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors {selectedId ===
                            section.id
                                ? 'bg-accent text-accent-foreground'
                                : 'hover:bg-muted'}">
                            <span
                                class="h-2 w-2 shrink-0 rounded-full {section.enabled
                                    ? section.valid
                                        ? 'bg-green-500'
                                        : 'bg-amber-500'
                                    : 'bg-zinc-500'}">
                            </span>
                            {section.title}
                        </button>
                    {/each}
                </div>
            {/each}
        </aside>

        <Separator orientation="vertical" class="h-auto" />

        <div class="min-w-0 flex-1">
            {#if selected}
                {@const status = pluginStatus(selected)}
                <div class="mb-4 flex items-center gap-3">
                    <h2 class="text-lg font-medium">{selected.title}</h2>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {#if selected.version}
                        <span class="text-muted-foreground text-xs">v{selected.version}</span>
                    {/if}
                </div>

                <div class="space-y-4">
                    {#each selected.schema as field (field.key)}
                        <SettingFieldEditor {field} bind:value={selected.values[field.key]} />
                    {/each}
                </div>

                <div class="mt-6">
                    <Button type="button" disabled={saving} onclick={savePlugin}>
                        {saving ? "Saving…" : "Save plugin settings"}
                    </Button>
                </div>
            {/if}
        </div>
    </div>
{/if}
