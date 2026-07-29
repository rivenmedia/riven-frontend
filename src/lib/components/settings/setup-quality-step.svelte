<script lang="ts">
    import * as Accordion from "$lib/components/ui/accordion/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import SetupGeneralField from "./setup-general-field.svelte";
    import type { SetupGeneralSection, SetupProfileView } from "./types";

    let {
        profiles,
        toggleProfileEnabled,
        generalSections,
        general = $bindable(),
        saveGeneralSettings
    }: {
        profiles: SetupProfileView[];
        toggleProfileEnabled: (name: string, enabled: boolean) => void;
        generalSections: SetupGeneralSection[];
        general: Record<string, unknown>;
        saveGeneralSettings: () => void;
    } = $props();
</script>

<div class="mx-auto max-w-4xl space-y-10">
    <div class="space-y-6">
        <div>
            <h3 class="text-lg font-semibold">Pre-configured presets</h3>
            <p class="text-muted-foreground mt-1 text-sm">
                Start with the built-in <code>riven-rs</code> defaults.
            </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {#each profiles as profile (profile.id)}
                <Card.Root
                    class="gap-4 rounded-3xl py-0 text-left transition-colors {profile.enabled
                        ? 'border-white/14 bg-white/4'
                        : 'hover:bg-muted/40'}">
                    <Card.Header class="px-6 pt-6 pb-0">
                        <Card.Title class="text-base">{profile.label}</Card.Title>
                    </Card.Header>
                    <Card.Content class="px-6 pt-0 pb-0">
                        <p class="text-muted-foreground text-sm">{profile.description}</p>
                    </Card.Content>
                    <Card.Footer class="px-6 pt-0 pb-6">
                        <Button
                            type="button"
                            variant="outline"
                            class="w-full"
                            onclick={() => toggleProfileEnabled(profile.id, !profile.enabled)}>
                            {profile.enabled ? "Selected" : "Enable"}
                        </Button>
                    </Card.Footer>
                </Card.Root>
            {/each}
        </div>
    </div>

    <Accordion.Root type="multiple" class="space-y-4">
        {#each generalSections as section (section.title)}
            <Accordion.Item value={section.title} class="rounded-2xl border px-5">
                <Accordion.Trigger class="py-5 text-left no-underline hover:no-underline">
                    <span>
                        <span class="block text-lg font-semibold">{section.title}</span>
                        <span class="text-muted-foreground mt-1 block text-sm">
                            {section.description}
                        </span>
                    </span>
                </Accordion.Trigger>
                <Accordion.Content class="pb-5">
                    <div class="grid gap-4 lg:grid-cols-2">
                        {#each section.fields as field (field.key)}
                            <SetupGeneralField {field} bind:general />
                        {/each}
                    </div>
                </Accordion.Content>
            </Accordion.Item>
        {/each}
    </Accordion.Root>

    <div class="flex justify-end">
        <Button type="button" onclick={saveGeneralSettings}>Save preferences</Button>
    </div>
</div>
