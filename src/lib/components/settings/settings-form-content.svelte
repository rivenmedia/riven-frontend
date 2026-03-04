<script lang="ts">
    import type { ActionData, PageData } from "../../../routes/(protected)/settings/$types";
    import type { FormState } from "@sjsf/form";
    import { BasicForm } from "@sjsf/form";
    import { createMeta, setupSvelteKitForm } from "@sjsf/sveltekit/client";
    import * as defaults from "./form-defaults";
    import { setShadcnContext } from "$lib/components/shadcn-context";
    import { toast } from "svelte-sonner";
    import { icons } from "@sjsf/lucide-icons";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import HelpCircle from "@lucide/svelte/icons/help-circle";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import Check from "@lucide/svelte/icons/check";
    import AlertCircle from "@lucide/svelte/icons/alert-circle";
    import { get } from "svelte/store";
    import { navigating, page } from "$app/stores";
    import { getTabById } from "./sections";

    interface Props {
        formStore: { set: (f: FormState<unknown>) => void };
    }
    let { formStore }: Props = $props();

    setShadcnContext();

    const meta = createMeta<ActionData, PageData>().form;

    let saveStatus = $state<"idle" | "success" | "error">("idle");

    const { form } = setupSvelteKitForm(meta, {
        ...defaults,
        icons,
        delayedMs: 500,
        timeoutMs: 30000,
        onSuccess: (result: { type: string }) => {
            if (result.type === "success") {
                const tabId = get(page).url.searchParams.get("tab") ?? "general";
                const tab = getTabById(tabId);
                if (tab?.restartRequired) {
                    toast.success("Settings saved. Some changes may take effect after restart.");
                } else {
                    toast.success("Settings saved");
                }
                saveStatus = "success";
            } else {
                toast.error("Failed to save settings");
                saveStatus = "error";
            }
        },
        onFailure: () => {
            toast.error("Something went wrong while saving settings");
            saveStatus = "error";
        }
    });

    const isDirty = $derived(form?.isChanged ?? false);
    const isNavigating = $derived(Boolean($navigating));
    // Defensive check: $page.data.tabs can be temporarily undefined during client-side
    // navigation transitions before the load function reconciles data into the store.
    const activeTab = $derived(
        $page.data.tabs?.find(
            (t: { id: string; label: string; restartRequired?: boolean }) =>
                t.id === $page.data.activeTabId
        )
    );

    $effect(() => {
        if (isDirty) {
            saveStatus = "idle";
        }
    });

    $effect(() => {
        formStore.set(form);
    });

    function submitForm() {
        const formEl = document.querySelector(".settings-form form");
        (formEl as HTMLFormElement)?.requestSubmit();
    }
</script>

<Card.Root class="bg-card border-border/80 shadow-sm">
    <Card.Header class="space-y-3 pb-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
                <Card.Title class="text-base font-semibold text-neutral-100 md:text-lg">
                    {activeTab?.label ?? "Settings"}
                </Card.Title>
                {#if activeTab?.restartRequired}
                    <Badge
                        class="border-amber-500/30 bg-amber-500/20 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        Restart required
                    </Badge>
                {/if}
            </div>

            <div class="flex items-center gap-2" aria-live="polite">
                {#if isNavigating}
                    <Badge variant="outline" class="text-[11px] font-medium">
                        <Loader2 class="size-3.5 animate-spin" />
                        Saving
                    </Badge>
                {:else if saveStatus === "success" && !isDirty}
                    <Badge
                        class="border-emerald-500/30 bg-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Check class="size-3.5" />
                        Saved
                    </Badge>
                {:else if saveStatus === "error"}
                    <Badge
                        class="border-red-500/30 bg-red-500/20 text-[11px] font-medium text-red-600 dark:text-red-400">
                        <AlertCircle class="size-3.5" />
                        Save failed
                    </Badge>
                {:else if isDirty}
                    <Badge variant="outline" class="text-[11px] font-medium">Draft</Badge>
                {:else}
                    <Badge variant="outline" class="text-[11px] font-medium">Current</Badge>
                {/if}
            </div>
        </div>

        <div class="flex items-start gap-2">
            <Card.Description class="text-muted-foreground text-xs md:text-sm">
                Edit this section and save to persist changes to backend settings.
            </Card.Description>
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <HelpCircle
                        class="text-muted-foreground hover:text-foreground mt-0.5 size-4 shrink-0 cursor-help"
                        aria-label="Help" />
                </Tooltip.Trigger>
                <Tooltip.Content side="right" class="max-w-xs text-balance">
                    Changes are scoped to this section. Save only after reviewing all edited values.
                </Tooltip.Content>
            </Tooltip.Root>
        </div>

        {#if saveStatus === "error"}
            <Alert variant="destructive" class="py-2">
                <AlertCircle class="size-4" />
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>
                    Settings were not persisted. Review form errors and retry.
                </AlertDescription>
            </Alert>
        {/if}
    </Card.Header>
    <Card.Content class="space-y-5">
        <BasicForm {form} method="POST" class="settings-form" />
    </Card.Content>
    <Card.Footer
        class="border-border/70 bg-muted/20 flex flex-row items-center justify-between gap-2 border-t px-5 py-3 md:px-6">
        <span class="text-muted-foreground text-xs"
            >{isDirty ? "Unsaved changes" : "No pending changes"}</span>
        <Button
            type="button"
            onclick={submitForm}
            disabled={!isDirty || isNavigating}
            class="min-w-[10rem]">
            {#if isNavigating}
                <Loader2 class="size-4 animate-spin" />
                Saving...
            {:else if isDirty}
                Save changes
            {:else}
                Up to date
            {/if}
        </Button>
    </Card.Footer>
</Card.Root>

<style>
    :global(.settings-form) {
        display: grid;
        gap: 0.875rem;
    }

    :global(.settings-form [data-slot="field"]) {
        border: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent);
        border-radius: 0.625rem;
        background: color-mix(in oklab, var(--color-card) 92%, transparent);
        padding: 0.75rem 0.875rem;
    }

    :global(.settings-form [data-slot="field-label"]) {
        font-weight: 600;
        color: color-mix(in oklab, var(--color-foreground) 90%, transparent);
    }

    :global(.settings-form [data-slot="field-description"]) {
        color: var(--color-muted-foreground);
        font-size: 0.78rem;
        line-height: 1.4;
        margin-top: 0.15rem;
    }

    :global(.settings-form [data-slot="input"]),
    :global(.settings-form [data-slot="textarea"]),
    :global(.settings-form [data-slot="select-trigger"]) {
        min-height: 2.2rem;
    }

    :global(.settings-form :focus-visible) {
        outline: 2px solid var(--color-ring);
        outline-offset: 2px;
    }

    :global(.settings-form [data-slot="field-error"]) {
        font-size: 0.78rem;
        margin-top: 0.25rem;
    }
</style>
