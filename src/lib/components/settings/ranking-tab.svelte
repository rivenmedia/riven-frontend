<script lang="ts">
    import { untrack } from "svelte";
    import { toast } from "svelte-sonner";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import { settingsSwitchClass } from "./helpers";
    import SettingFieldEditor from "./setting-field-editor.svelte";
    import type { CustomProfile, QualityProfile, SettingFieldDef } from "./types";

    let {
        rank = $bindable(),
        rankSchema,
        qualityProfiles,
        customProfiles = $bindable(),
        activeProfileName = $bindable(),
        newProfileName = $bindable(),
        savingProfile = $bindable(),
        saveAsProfile,
        toggleProfileEnabled,
        applyProfile,
        deleteCustomProfile,
        saveActiveProfileSettings
    }: {
        rank: Record<string, unknown>;
        rankSchema: SettingFieldDef[];
        qualityProfiles: QualityProfile[];
        customProfiles: CustomProfile[];
        activeProfileName: string | null;
        newProfileName: string;
        savingProfile: boolean;
        saveAsProfile: () => Promise<void>;
        toggleProfileEnabled: (name: string, enabled: boolean) => Promise<void>;
        applyProfile: (settings: Record<string, unknown>, profileName?: string) => void;
        deleteCustomProfile: (id: number, name: string) => Promise<void>;
        saveActiveProfileSettings: () => Promise<void>;
    } = $props();

    let savedRankJson = $state("");
    let savingRanking = $state(false);

    const customProfileCount = $derived(
        customProfiles.filter((profile) => !profile.is_builtin).length
    );
    const activeProfileLabel = $derived(
        qualityProfiles.find((profile) => profile.id === activeProfileName)?.label ??
            activeProfileName ??
            "Global ranking"
    );
    const activeProfileDescription = $derived(
        qualityProfiles.find((profile) => profile.id === activeProfileName)?.description ??
            (activeProfileName
                ? "Custom ranking rules for this profile."
                : "Default ranking rules used when no profile override is active.")
    );
    const rankJson = $derived(JSON.stringify(rank));
    const hasUnsavedChanges = $derived(savedRankJson !== "" && rankJson !== savedRankJson);
    const saveLabel = $derived(activeProfileName ? "Save profile" : "Save");

    $effect(() => {
        void activeProfileName;
        savedRankJson = untrack(() => JSON.stringify(rank));
    });

    function profileEnabled(name: string) {
        return customProfiles.find((profile) => profile.name === name)?.enabled ?? false;
    }

    function selectProfile(settings: Record<string, unknown>, profileName?: string) {
        applyProfile(settings, profileName);
    }

    async function setProfileEnabled(name: string, enabled: boolean) {
        await toggleProfileEnabled(name, enabled);
    }

    function discardChanges() {
        if (!savedRankJson) return;
        rank = JSON.parse(savedRankJson) as Record<string, unknown>;
    }

    async function saveRankingSettings() {
        if (!hasUnsavedChanges || savingRanking) return;

        savingRanking = true;
        try {
            await saveActiveProfileSettings();
            savedRankJson = JSON.stringify(rank);
            toast.success("Changes saved");
        } catch {
            toast.error("Couldn't save changes");
        } finally {
            savingRanking = false;
        }
    }
</script>

<div>
    <div class="space-y-8">
        {#if qualityProfiles.length > 0 || customProfiles.length > 0}
            <section class="space-y-4">
                <div>
                    <h2 class="text-lg font-semibold">Ranking Profiles</h2>
                </div>

                {#if qualityProfiles.length > 0}
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {#each qualityProfiles as profile (profile.id)}
                            {@const enabled = profileEnabled(profile.id)}
                            {@const selected = activeProfileName === profile.id}
                            <div
                                class="group rounded-lg border p-3 transition-colors {selected
                                    ? 'border-primary bg-primary/10 shadow-sm'
                                    : enabled
                                      ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                                      : 'border-border hover:bg-muted/40'}">
                                <button
                                    type="button"
                                    class="w-full text-left"
                                    aria-pressed={selected}
                                    onclick={() => selectProfile(profile.settings, profile.id)}>
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="min-w-0">
                                            <span class="block truncate text-sm font-semibold"
                                                >{profile.label}</span>
                                            <span
                                                class="text-muted-foreground mt-1 line-clamp-2 block text-xs">
                                                {profile.description}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                                <div
                                    class="mt-3 flex items-center justify-between border-t pt-3 text-xs">
                                    <span class="text-muted-foreground">
                                        {selected ? "Editing" : "Edit"}
                                    </span>
                                    <Switch
                                        class={settingsSwitchClass}
                                        checked={enabled}
                                        onCheckedChange={(next) =>
                                            setProfileEnabled(profile.id, next)} />
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if customProfileCount > 0}
                    <h3 class="pt-1 text-sm font-medium">Custom Profiles</h3>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {#each customProfiles.filter((p) => !p.is_builtin) as profile (profile.name)}
                            {@const selected = activeProfileName === profile.name}
                            <div
                                class="group relative rounded-lg border transition-colors {selected
                                    ? 'border-primary bg-primary/10 shadow-sm'
                                    : profile.enabled
                                      ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                                      : 'border-border hover:bg-muted/40'}">
                                <button
                                    type="button"
                                    class="w-full p-3 pb-0 text-left"
                                    aria-pressed={selected}
                                    onclick={() => selectProfile(profile.settings, profile.name)}>
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="min-w-0">
                                            <span class="block truncate text-sm font-semibold">
                                                {profile.name}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                                <div
                                    class="mx-3 mt-3 flex items-center justify-between border-t pt-3 pb-3 text-xs">
                                    <span class="flex items-center gap-3">
                                        <span class="text-muted-foreground">
                                            {selected ? "Editing" : "Edit"}
                                        </span>
                                        <button
                                            type="button"
                                            onclick={() =>
                                                deleteCustomProfile(profile.id, profile.name)}
                                            class="text-muted-foreground hover:text-destructive">
                                            Delete
                                        </button>
                                    </span>
                                    <Switch
                                        class={settingsSwitchClass}
                                        checked={profile.enabled}
                                        onCheckedChange={(next) =>
                                            setProfileEnabled(profile.name, next)} />
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </section>

            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Label class="text-sm font-medium sm:w-28">New profile</Label>
                <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                        placeholder="Profile name..."
                        bind:value={newProfileName}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                saveAsProfile();
                            }
                        }}
                        class="w-full sm:w-56" />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={savingProfile || !newProfileName.trim()}
                        onclick={saveAsProfile}>
                        {savingProfile ? "Saving..." : "Create"}
                    </Button>
                </div>
            </div>

            <Separator />
        {/if}

        <div
            class="bg-background/95 sticky top-4 z-10 rounded-lg border p-4 shadow-sm backdrop-blur">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                    <h2 class="truncate text-lg font-semibold">{activeProfileLabel}</h2>
                    <p class="text-muted-foreground mt-1 text-sm">{activeProfileDescription}</p>
                </div>
                <div class="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                        class="rounded-md border px-2.5 py-1 text-xs {hasUnsavedChanges
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground'}">
                        {hasUnsavedChanges ? "Unsaved changes" : "Saved"}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!hasUnsavedChanges || savingRanking}
                        onclick={discardChanges}>
                        Discard
                    </Button>
                    <Button
                        type="button"
                        disabled={!hasUnsavedChanges || savingRanking}
                        onclick={saveRankingSettings}>
                        {savingRanking ? "Saving..." : saveLabel}
                    </Button>
                </div>
            </div>
        </div>

        <div class="grid gap-4">
            {#each rankSchema as field (field.key)}
                <SettingFieldEditor
                    {field}
                    bind:value={
                        () => rank[field.key], (next) => (rank = { ...rank, [field.key]: next })
                    } />
            {/each}
        </div>
    </div>
</div>
