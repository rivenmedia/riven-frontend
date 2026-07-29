<script lang="ts">
    import {
        resetItems,
        retryItems,
        removeItems,
        setItemsPaused,
        toNumericIds
    } from "$lib/services/library-mutations";
    import { toast } from "svelte-sonner";
    import { invalidateAll } from "$app/navigation";
    import { createScopedLogger } from "$lib/logger";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import {
        Button,
        type ButtonSize,
        type ButtonVariant
    } from "$lib/components/ui/button/index.js";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import { page } from "$app/state";
    import { type Snippet } from "svelte";

    export type ItemActionKind = "reset" | "retry" | "delete" | "pause";

    interface Props {
        kind: ItemActionKind;
        title: string | null | undefined;
        ids: (string | null | undefined)[];
        /** Only used by kind="pause": the item's current paused state. */
        isPaused?: boolean;
        variant?: ButtonVariant;
        size?: ButtonSize;
        class?: string;
        /** Called after a successful reset/retry. */
        onSuccess?: () => void | Promise<void>;
        children?: Snippet;
    }

    let {
        kind,
        title,
        ids,
        isPaused = false,
        variant = "ghost",
        size = "sm",
        onSuccess,
        children,
        ...restProps
    }: Props = $props();

    const logger = $derived(createScopedLogger(`item-${kind}`));

    // Per-kind wording. `pause` swaps based on the item's current state.
    const presentation = $derived.by(() => {
        switch (kind) {
            case "reset":
                return { heading: "Resetting", label: "Reset", verb: "reset", done: "done" };
            case "retry":
                return { heading: "Retrying", label: "Retry", verb: "retry", done: "done" };
            case "delete":
                return { heading: "Deleting", label: "Delete", verb: "delete", done: "removed" };
            case "pause":
                return isPaused
                    ? { heading: "Resume", label: "Resume", verb: "resume", done: "done" }
                    : { heading: "Pause", label: "Pause", verb: "pause", done: "done" };
        }
    });

    const description = $derived(
        `This will send a request to Riven to ${presentation.verb} this media. ` +
            `You will be notified when it's ${presentation.done}.`
    );

    let open = $state(false);
    let loading = $state(false);

    async function run(): Promise<void> {
        const validIds = toNumericIds(ids);

        try {
            switch (kind) {
                case "reset":
                case "retry": {
                    if (validIds.length === 0) {
                        toast.error(`No media item ID found to ${presentation.verb}.`);
                        return;
                    }
                    const count =
                        kind === "reset" ? await resetItems(validIds) : await retryItems(validIds);
                    if (count > 0) {
                        toast.success(
                            kind === "reset"
                                ? "Media item reset successfully."
                                : "Media item marked for retry."
                        );
                        await onSuccess?.();
                    } else {
                        toast.info(
                            kind === "reset"
                                ? "No matching media items were reset."
                                : "No matching media items were marked for retry."
                        );
                    }
                    return;
                }
                case "delete": {
                    await removeItems(validIds);
                    invalidateAll();
                    toast.success("Media item deleted successfully!");
                    return;
                }
                case "pause": {
                    // `isPaused` is the current state, so resume when paused, else pause.
                    await setItemsPaused(validIds, !isPaused);
                    toast.success(`Media item ${isPaused ? "unpaused" : "paused"} successfully!`);
                    return;
                }
            }
        } catch (e) {
            logger.error(`Error during ${kind}:`, e);
            toast.error(`Failed to ${presentation.verb} media item.`);
        }
    }

    async function confirm() {
        loading = true;
        try {
            await run();
        } finally {
            loading = false;
            open = false;
        }
    }
</script>

{#if page.data.permissions?.canManageLibrary}
    <AlertDialog.Root bind:open>
        <AlertDialog.Trigger>
            {#snippet child({ props })}
                <Button {variant} {size} {...restProps} {...props}>
                    {#if children}
                        {@render children()}
                    {:else}
                        {presentation.label}
                    {/if}
                </Button>
            {/snippet}
        </AlertDialog.Trigger>
        <AlertDialog.Content class="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl">
            <AlertDialog.Header>
                <AlertDialog.Title>
                    {presentation.heading} "{title ?? "Media Item"}"
                </AlertDialog.Title>
                <AlertDialog.Description>
                    {description}
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                <Button disabled={loading} onclick={confirm}>
                    {#if loading}
                        <Loader2 class="mr-1 inline-block animate-spin" />
                    {/if}
                    {presentation.label}
                </Button>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{/if}
