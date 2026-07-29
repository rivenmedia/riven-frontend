<script lang="ts">
    import { toast } from "svelte-sonner";
    import { gqlClient } from "$lib/graphql-client";
    import PageShell from "$lib/components/page-shell.svelte";
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import GeneralTab from "$lib/components/settings/general-tab.svelte";
    import PluginsTab from "$lib/components/settings/plugins-tab.svelte";
    import RankingTab from "$lib/components/settings/ranking-tab.svelte";
    import SystemTab from "$lib/components/settings/system-tab.svelte";
    import { page } from "$app/state";
    import type { PageData } from "./$types";
    import type {
        CustomProfile,
        QualityProfile,
        SettingsSection
    } from "$lib/components/settings/types";
    import {
        UPDATE_SETTINGS,
        SAVE_CUSTOM_PROFILE,
        DELETE_CUSTOM_PROFILE,
        SET_PROFILE_ENABLED,
        UPDATE_PROFILE_SETTINGS,
        CUSTOM_PROFILES
    } from "$lib/components/settings/operations";
    import { untrack } from "svelte";

    let { data }: { data: PageData } = $props();

    const canManageSettings = $derived(page.data.permissions?.canManageSettings ?? false);

    let activeTab = $state("general");

    // Settings sections (general + plugins) — the unified, typed surface.
    let sections = $state<SettingsSection[]>(
        untrack(() => (data.sections ?? []).map((s) => ({ ...s, values: { ...s.values } })))
    );
    const generalSection = $derived(sections.find((s) => s.kind === "general") ?? null);
    const pluginSections = $derived(sections.filter((s) => s.kind === "plugin"));

    // Single write path for the general section and every plugin.
    async function saveSection(section: SettingsSection) {
        try {
            const result = await gqlClient<{ updateSettings: SettingsSection }>(UPDATE_SETTINGS, {
                section: section.id,
                values: section.values
            });
            const updated = result.updateSettings;
            const index = sections.findIndex((s) => s.id === updated.id);
            if (index >= 0) sections[index] = updated;
            toast.success(
                section.kind === "general" ? "General settings saved" : "Plugin settings saved"
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save settings");
        }
    }

    // Ranking is a distinct domain (presets + custom profiles), kept separate.
    let rank = $state<Record<string, unknown>>(
        untrack(() => JSON.parse(JSON.stringify(data.rankSettings ?? {})))
    );
    const qualityProfiles: QualityProfile[] = untrack(() => data.qualityProfiles ?? []);
    let customProfiles = $state<CustomProfile[]>(untrack(() => data.customProfiles ?? []));
    let activeProfileName = $state<string | null>(untrack(() => data.initialProfileName ?? null));
    let newProfileName = $state("");
    let savingProfile = $state(false);

    function applyProfile(settings: Record<string, unknown>, profileName?: string) {
        activeProfileName = profileName ?? null;
        rank = JSON.parse(JSON.stringify(settings)) as Record<string, unknown>;
    }

    async function saveActiveProfileSettings() {
        if (!activeProfileName) return;
        try {
            await gqlClient<{ updateProfileSettings: unknown }>(UPDATE_PROFILE_SETTINGS, {
                name: activeProfileName,
                settings: rank
            });

            const settings = JSON.parse(JSON.stringify(rank)) as Record<string, unknown>;
            const customProfile = customProfiles.find(
                (profile) => profile.name === activeProfileName
            );
            if (customProfile) customProfile.settings = settings;
            const qualityProfile = qualityProfiles.find(
                (profile) => profile.id === activeProfileName
            );
            if (qualityProfile) qualityProfile.settings = settings;
        } catch {
            throw new Error("Failed to update active ranking profile");
        }
    }

    async function saveAsProfile() {
        const name = newProfileName.trim();
        if (!name) return;
        savingProfile = true;
        try {
            const result = await gqlClient<{ saveCustomProfile: CustomProfile }>(
                SAVE_CUSTOM_PROFILE,
                { id: null, name, settings: rank }
            );
            const profile = result.saveCustomProfile;
            const idx = customProfiles.findIndex((p) => p.id === profile.id);
            if (idx >= 0) customProfiles[idx] = profile;
            else customProfiles.push(profile);
            newProfileName = "";
            toast.success(`Profile "${profile.name}" saved`);
        } catch {
            toast.error("Failed to save profile");
        } finally {
            savingProfile = false;
        }
    }

    async function toggleProfileEnabled(name: string, enabled: boolean) {
        try {
            await gqlClient<{ setProfileEnabled: unknown }>(SET_PROFILE_ENABLED, { name, enabled });
            const data = await gqlClient<{ customProfiles: CustomProfile[] }>(CUSTOM_PROFILES);
            customProfiles = data.customProfiles ?? customProfiles;
            toast.success(`Profile "${name}" ${enabled ? "enabled" : "disabled"}`);
        } catch {
            toast.error("Failed to update profile");
        }
    }

    async function deleteCustomProfile(id: number, name: string) {
        try {
            await gqlClient<{ deleteCustomProfile: unknown }>(DELETE_CUSTOM_PROFILE, { id });
            customProfiles = customProfiles.filter((p) => p.id !== id);
            toast.success(`Profile "${name}" deleted`);
        } catch {
            toast.error("Failed to delete profile");
        }
    }
</script>

<svelte:head>
    <title>Settings - Riven</title>
</svelte:head>

<PageShell>
    <div class="mx-auto w-full max-w-5xl">
        <div class="mb-8">
            <h1 class="text-3xl font-semibold tracking-tight">Settings</h1>
            <p class="text-muted-foreground mt-1 text-sm">
                Configure Riven, plugins, and ranking preferences.
            </p>
        </div>

        <Tabs.Root bind:value={activeTab}>
            <Tabs.List class="mb-6 w-full justify-start">
                <Tabs.Trigger value="general">General</Tabs.Trigger>
                <Tabs.Trigger value="plugins">Plugins</Tabs.Trigger>
                <Tabs.Trigger value="ranking">Ranking</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="general">
                {#if generalSection}
                    <GeneralTab section={generalSection} save={saveSection} />
                {/if}
                {#if canManageSettings}
                    <div class="mt-8">
                        <SystemTab />
                    </div>
                {/if}
            </Tabs.Content>

            <Tabs.Content value="plugins">
                <PluginsTab
                    sections={pluginSections}
                    groups={data.setupGroups}
                    save={saveSection} />
            </Tabs.Content>

            <Tabs.Content value="ranking">
                <RankingTab
                    bind:rank
                    rankSchema={data.rankSettingsSchema}
                    {qualityProfiles}
                    bind:customProfiles
                    bind:activeProfileName
                    bind:newProfileName
                    bind:savingProfile
                    {saveAsProfile}
                    {toggleProfileEnabled}
                    {applyProfile}
                    {deleteCustomProfile}
                    {saveActiveProfileSettings} />
            </Tabs.Content>
        </Tabs.Root>
    </div>
</PageShell>
