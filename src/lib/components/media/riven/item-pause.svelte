<script lang="ts">
    import providers from "$lib/providers";
    import { toast } from "svelte-sonner";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import Loader2 from "@lucide/svelte/icons/loader-2";

    interface Props {
        title: string | null | undefined;
        ids: (string | null | undefined)[];
        isPaused?: boolean;
        variant?:
            | "ghost"
            | "default"
            | "link"
            | "destructive"
            | "outline"
            | "secondary"
            | undefined;
        size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | undefined;
        class?: string;
    }
    let {
        title,
        ids,
        isPaused = false,
        variant = "ghost",
        size = "sm",
        ...restProps
    }: Props = $props();

    async function togglePauseMediaItem(ids: (string | null | undefined)[]) {
        const validIds = ids.filter((id): id is string => id !== null && id !== undefined);

        const response = isPaused
            ? await providers.riven.POST("/api/v1/items/pause", {
                  body: {
                      ids: validIds
                  }
              })
            : await providers.riven.POST("/api/v1/items/unpause", {
                  body: {
                      ids: validIds
                  }
              });

        if (response.data) {
            toast.success(`Media item ${isPaused ? "unpaused" : "paused"} successfully!`);
        } else {
            console.error("Error response:", response.error);
            toast.error(`Failed to ${isPaused ? "unpause" : "pause"} media item.`);
        }
    }

    let open = $state(false);
    let loading = $state(false);
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Trigger>
        {#snippet child({ props })}
            <Button {variant} {size} {...restProps} {...props}>
                {isPaused ? "Resume" : "Pause"}
            </Button>
        {/snippet}
    </AlertDialog.Trigger>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>
                {isPaused ? "Resume" : "Pause"} "{title ?? "Media Item"}"
            </AlertDialog.Title>
            <AlertDialog.Description>
                This will send a request to Riven to {isPaused ? "resume" : "pause"} this media. You will
                be notified when it's done.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
                disabled={loading}
                onclick={async () => {
                    loading = true;
                    await togglePauseMediaItem(ids);
                    loading = false;
                    open = false;
                }}>
                {#if loading}
                    <Loader2 class="mr-1 inline-block animate-spin" />
                {/if}
                {isPaused ? "Resume" : "Pause"}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
