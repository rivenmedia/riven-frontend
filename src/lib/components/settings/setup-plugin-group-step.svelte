<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import SetupPluginCard from "./setup-plugin-card.svelte";
    import type { SettingsSection, SetupPluginSection } from "./types";

    let {
        section,
        savePlugin
    }: {
        section: SetupPluginSection;
        savePlugin: (section: SettingsSection) => void;
    } = $props();

    let activePluginName = $state<string | null>(null);

    $effect(() => {
        const preferred =
            section.plugins.find((view) => view.section.enabled)?.section.id ??
            section.plugins[0]?.section.id ??
            null;

        if (
            !activePluginName ||
            !section.plugins.some((view) => view.section.id === activePluginName)
        ) {
            activePluginName = preferred;
        }
    });

    const activeCard = $derived(
        section.plugins.find((view) => view.section.id === activePluginName) ?? null
    );
</script>

<div class="space-y-8">
    {#if section.plugins.length === 0}
        <div class="mx-auto max-w-2xl rounded-3xl border border-dashed p-8 text-center">
            <p class="text-muted-foreground text-sm md:text-base">{section.emptyMessage}</p>
        </div>
    {:else}
        <div class="mx-auto grid w-full max-w-4xl gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {#each section.plugins as view (view.section.id)}
                <Card.Root
                    class="gap-4 rounded-3xl py-0 transition-colors {view.section.id ===
                    activePluginName
                        ? 'border-white/14 bg-white/4'
                        : 'bg-background/40 hover:bg-background/65'}">
                    <Card.Header class="px-5 pt-5 pb-0">
                        <Card.Title class="text-lg capitalize">{view.section.title}</Card.Title>
                    </Card.Header>
                    <Card.Content class="px-5 pt-0 pb-0">
                        <p class="text-muted-foreground text-sm">
                            {#if view.section.version}v{view.section.version}{/if}
                            {#if view.badge.label !== "Inactive"}
                                · {view.badge.label.toLowerCase()}{/if}
                        </p>
                    </Card.Content>
                    <Card.Footer class="px-5 pt-0 pb-5">
                        <Button
                            type="button"
                            variant="outline"
                            class="w-full"
                            onclick={() => (activePluginName = view.section.id)}>
                            {view.section.id === activePluginName ? "Selected" : "Configure"}
                        </Button>
                    </Card.Footer>
                </Card.Root>
            {/each}
        </div>

        {#if activeCard}
            <div class="mx-auto w-full max-w-4xl">
                <SetupPluginCard
                    section={activeCard.section}
                    saving={activeCard.saving}
                    {savePlugin} />
            </div>
        {/if}
    {/if}

    {#if section.plugins.length > 1}
        <div class="mx-auto max-w-2xl">
            <p class="text-muted-foreground text-sm">Choose one provider to configure.</p>
        </div>
    {/if}
</div>
