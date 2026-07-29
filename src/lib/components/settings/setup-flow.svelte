<script lang="ts">
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { untrack } from "svelte";
    import { toast } from "svelte-sonner";
    import { gqlClient } from "$lib/graphql-client";
    import {
        buildGeneralSections,
        buildPluginSections,
        buildSetupSteps,
        createSetupState
    } from "./helpers";
    import {
        UPDATE_SETTINGS,
        INSTANCE_STATUS,
        SET_PROFILE_ENABLED,
        COMPLETE_INITIAL_SETUP
    } from "./operations";
    import SetupPluginGroupStep from "./setup-plugin-group-step.svelte";
    import SetupQualityStep from "./setup-quality-step.svelte";
    import SetupReviewStep from "./setup-review-step.svelte";
    import SetupShell from "./setup-shell.svelte";
    import SetupWelcomeStep from "./setup-welcome-step.svelte";
    import type { CustomProfile, InstanceStatus, SettingsSection, SetupData } from "./types";

    let { data }: { data: SetupData } = $props();
    const initial = untrack(() => createSetupState(JSON.parse(JSON.stringify(data)) as SetupData));

    let stepIndex = $state(0);
    let generalSection = $state<SettingsSection | null>(initial.general);
    let plugins = $state<SettingsSection[]>(initial.plugins);
    let customProfiles = $state<CustomProfile[]>(initial.customProfiles);
    let savingMap = $state<Record<string, boolean>>({});

    // Setup readiness is owned by the backend (`instanceStatus`); refreshed after edits.
    let status = $state<InstanceStatus>(
        untrack(() => ({ ...(data.instanceStatus as InstanceStatus) }))
    );

    const pluginSections = $derived(
        buildPluginSections(plugins, savingMap, data.setupGroups ?? [])
    );
    const generalSections = $derived(buildGeneralSections(generalSection?.schema ?? []));
    const steps = $derived(buildSetupSteps(pluginSections));
    const currentStep = $derived(steps[stepIndex] ?? steps[0]);
    const currentPluginSection = $derived(
        pluginSections.find((section) => section.id === currentStep?.id) ?? null
    );
    const qualityProfiles = $derived(
        (data.qualityProfiles ?? []).map((profile) => ({
            ...profile,
            enabled: customProfiles.some((entry) => entry.name === profile.id && entry.enabled)
        }))
    );

    $effect(() => {
        if (steps.length === 0) return;
        if (stepIndex >= steps.length) stepIndex = steps.length - 1;
    });

    $effect(() => {
        if (currentStep?.id === "finish") void refreshStatus();
    });

    async function refreshStatus() {
        try {
            const data = await gqlClient<{ instanceStatus: InstanceStatus }>(INSTANCE_STATUS);
            status = data.instanceStatus;
        } catch {
            // keep the previous snapshot on transient failure
        }
    }

    async function savePlugin(section: SettingsSection) {
        savingMap = { ...savingMap, [section.id]: true };
        try {
            const result = await gqlClient<{ updateSettings: SettingsSection }>(UPDATE_SETTINGS, {
                section: section.id,
                values: section.values
            });
            const updated = result.updateSettings;
            plugins = plugins.map((plugin) => (plugin.id === updated.id ? updated : plugin));
            toast.success(`${section.title} saved`);
            void refreshStatus();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to save ${section.title}`);
        } finally {
            savingMap = { ...savingMap, [section.id]: false };
        }
    }

    async function saveGeneralSettings() {
        if (!generalSection) return;
        try {
            await gqlClient<{ updateSettings: SettingsSection }>(UPDATE_SETTINGS, {
                section: "general",
                values: generalSection.values
            });
            toast.success("General settings saved");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save general settings");
        }
    }

    async function toggleProfileEnabled(name: string, enabled: boolean) {
        try {
            await gqlClient(SET_PROFILE_ENABLED, { name, enabled });
            customProfiles = customProfiles.map((profile) =>
                profile.name === name ? { ...profile, enabled } : profile
            );
            toast.success(`Profile "${name}" ${enabled ? "enabled" : "disabled"}`);
            void refreshStatus();
        } catch {
            toast.error("Failed to update profile");
        }
    }

    function nextStep() {
        if (stepIndex < steps.length - 1) stepIndex += 1;
    }
    function previousStep() {
        if (stepIndex > 0) stepIndex -= 1;
    }
    function goToStep(index: number) {
        stepIndex = index;
    }

    async function finishSetup() {
        try {
            await gqlClient(COMPLETE_INITIAL_SETUP);
            await goto(resolve("/"));
        } catch {
            toast.error("Failed to complete setup");
        }
    }
</script>

<svelte:head>
    <title>Initial Setup - Riven</title>
</svelte:head>

<SetupShell {steps} {stepIndex} {goToStep} {previousStep} {nextStep}>
    {#if currentStep?.id === "welcome"}
        <SetupWelcomeStep />
    {:else if currentPluginSection}
        <SetupPluginGroupStep section={currentPluginSection} {savePlugin} />
    {:else if currentStep?.id === "quality"}
        <SetupQualityStep
            profiles={qualityProfiles}
            {generalSections}
            general={generalSection?.values ?? {}}
            {saveGeneralSettings}
            {toggleProfileEnabled} />
    {:else}
        <SetupReviewStep
            validPluginCount={status.enabledValidPluginCount}
            enabledProfileCount={status.enabledProfileCount}
            readyToComplete={status.readyToComplete}
            blockers={status.blockers}
            {finishSetup} />
    {/if}
</SetupShell>
