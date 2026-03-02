<script lang="ts">
    import type { FormState } from "@sjsf/form";
    import PageShell from "$lib/components/page-shell.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle
    } from "$lib/components/ui/alert-dialog/index.js";
    import SettingsFormContent from "$lib/components/settings/settings-form-content.svelte";
    import { cn } from "$lib/utils";
    import { goto } from "$app/navigation";
    import { navigating, page } from "$app/stores";
    import { writable } from "svelte/store";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import Check from "@lucide/svelte/icons/check";
    import AlertCircle from "@lucide/svelte/icons/alert-circle";
    import RefreshCw from "@lucide/svelte/icons/refresh-cw";

    /** Form ref from keyed SettingsFormContent - updates when tab changes (remount) */
    const formStore = writable<FormState<any> | null>(null);
    const form = $derived($formStore);

    let tabSwitchTarget: string | null = null;
    let showDiscardConfirm = $state(false);

    function submitSettingsForm() {
        if ($navigating) return;
        const formEl = document.querySelector(".settings-form form");
        (formEl as HTMLFormElement)?.requestSubmit();
    }

    function handleTabClick(tabId: string) {
        if (tabId === $page.data.activeTabId) return;
        if (form?.isChanged) {
            tabSwitchTarget = tabId;
            showDiscardConfirm = true;
        } else {
            goto(`/settings?tab=${tabId}`);
        }
    }

    function confirmDiscardAndSwitch() {
        if (tabSwitchTarget) {
            form?.reset();
            goto(`/settings?tab=${tabSwitchTarget}`);
            tabSwitchTarget = null;
        }
        showDiscardConfirm = false;
    }

    function cancelTabSwitch() {
        tabSwitchTarget = null;
        showDiscardConfirm = false;
    }

    /** Form store exposes isChanged (not isDirty) - use for save bar and tab-switch guard */
    const isDirty = $derived(form?.isChanged ?? false);
    const isNavigating = $derived(Boolean($navigating));
    const activeTab = $derived(
        $page.data.tabs?.find(
            (t: { id: string; label: string; restartRequired?: boolean }) =>
                t.id === $page.data.activeTabId
        )
    );
    const saveButtonLabel = $derived(
        isNavigating ? "Saving..." : isDirty ? "Save changes" : "All changes saved"
    );
</script>

<svelte:head>
    <title>Settings - Riven</title>
</svelte:head>

<PageShell class="h-full">
    <Tooltip.Provider>
        <div class="mx-auto max-w-6xl px-4 md:px-6">
            <header
                class="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <p class="text-muted-foreground text-sm font-medium">Admin</p>
                    <div class="mt-1 flex flex-wrap items-center gap-2">
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-50">Settings</h1>
                        {#if activeTab}
                            <Badge variant="outline" class="text-xs font-medium"
                                >{activeTab.label}</Badge>
                        {/if}
                        {#if activeTab?.restartRequired}
                            <Badge
                                class="border-amber-500/30 bg-amber-500/20 text-xs font-medium text-amber-600 dark:text-amber-400">
                                Restart required section
                            </Badge>
                        {/if}
                    </div>
                    <p class="text-muted-foreground mt-2 max-w-3xl text-sm md:text-[0.92rem]">
                        Configure backend behavior with production-safe defaults. Keep changes
                        focused, then save once to apply the current section.
                    </p>
                </div>
                <div class="mt-2 flex items-center gap-2 md:mt-0">
                    {#if isDirty}
                        <div class="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                            <AlertCircle class="size-3.5" />
                            Unsaved changes
                        </div>
                    {:else}
                        <div class="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                            <Check class="size-3.5" />
                            All changes saved
                        </div>
                    {/if}
                    <Button
                        type="button"
                        class="min-w-[11rem]"
                        onclick={submitSettingsForm}
                        disabled={!isDirty || isNavigating}
                        aria-live="polite">
                        {#if isNavigating}
                            <Loader2 class="size-4 animate-spin" />
                        {:else if isDirty}
                            <AlertCircle class="size-4" />
                        {:else}
                            <Check class="size-4" />
                        {/if}
                        {saveButtonLabel}
                    </Button>
                </div>
            </header>

            <Separator class="mb-6 md:mb-8" />

            <div class="flex flex-col gap-6 lg:flex-row lg:gap-8">
                <!-- Left: tab nav -->
                <nav
                    class="flex shrink-0 flex-row flex-wrap gap-1 lg:flex-col lg:flex-nowrap lg:gap-0.5"
                    aria-label="Settings sections">
                    {#each $page.data.tabs as tab}
                        <button
                            type="button"
                            class={cn(
                                "flex items-center gap-1.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                                $page.data.activeTabId === tab.id
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                            onclick={() => handleTabClick(tab.id)}
                            aria-current={$page.data.activeTabId === tab.id ? "true" : undefined}>
                            <span>{tab.label}</span>
                            {#if tab.restartRequired}
                                <span
                                    class="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
                                    title="Changes require restart">Restart</span>
                            {/if}
                        </button>
                    {/each}
                </nav>

                <!-- Right: form - keyed by activeTabId so form remounts and loads correct schema when tab changes -->
                <div
                    class="border-border/70 bg-card/35 relative min-w-0 flex-1 rounded-xl border p-3 md:p-4">
                    <div
                        class="border-border/60 mb-3 flex items-center justify-between gap-2 border-b pb-3">
                        <div class="flex items-center gap-1.5 text-sm font-medium text-neutral-200">
                            <RefreshCw class={cn("size-3.5", isNavigating && "animate-spin")} />
                            {activeTab?.label ?? "Settings"} configuration
                        </div>
                        <Badge variant="outline" class="text-[11px] font-medium">
                            {isDirty ? "Draft" : "Saved"}
                        </Badge>
                    </div>
                    {#if $navigating}
                        <div
                            class="bg-background/60 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]"
                            aria-live="polite">
                            <span
                                class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                                <Loader2 class="size-4 animate-spin" />
                                Loading section…
                            </span>
                        </div>
                    {/if}
                    {#key $page.data.activeTabId}
                        <SettingsFormContent {formStore} />
                    {/key}
                </div>
            </div>

            <!-- Sticky save bar when dirty -->
            {#if isDirty}
                <div
                    class="border-border bg-card/95 fixed right-0 bottom-0 left-0 z-40 flex items-center justify-between gap-4 border-t px-4 py-3 shadow-lg backdrop-blur md:right-4 md:bottom-4 md:left-auto md:max-w-md md:rounded-lg md:border md:shadow-xl"
                    role="status"
                    aria-live="polite">
                    <div class="min-w-0">
                        <span class="text-sm font-medium text-amber-500">Unsaved changes</span>
                        <p class="text-muted-foreground truncate text-xs">
                            Review and save this section to persist updates.
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={() => form?.reset()}
                            disabled={isNavigating}>
                            Discard
                        </Button>
                        <Button size="sm" onclick={submitSettingsForm} disabled={isNavigating}>
                            {#if isNavigating}
                                <Loader2 class="size-4 animate-spin" />
                                Saving...
                            {:else}
                                Save changes
                            {/if}
                        </Button>
                    </div>
                </div>
            {/if}
        </div>

        <AlertDialog bind:open={showDiscardConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have unsaved changes. Discard and switch tabs?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onclick={cancelTabSwitch}>Stay</AlertDialogCancel>
                    <AlertDialogAction onclick={confirmDiscardAndSwitch}
                        >Discard and switch</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </Tooltip.Provider>
</PageShell>
