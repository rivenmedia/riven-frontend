<script lang="ts">
    import { resetItems } from "$lib/api";
    import { toast } from "svelte-sonner";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";

    interface Props {
        title: string | null | undefined;
        ids: (string | null | undefined)[];
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
    let { title, ids, variant = "ghost", size = "sm", ...restProps }: Props = $props();

    async function resetMediaItem(ids: (string | null | undefined)[]) {
        const validIds = ids.filter((id): id is string => id !== null && id !== undefined);

        const response = await resetItems({
            query: {
                ids: validIds.join(",")
            }
        });

        if (response.data) {
            toast.success("Media item reset successfully!");
        } else {
            toast.error("Failed to reset media item.");
        }
    }

    let open = $state(false);
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Trigger>
        {#snippet child({ props })}
            <Button {variant} {size} {...restProps} {...props}>Reset</Button>
        {/snippet}
    </AlertDialog.Trigger>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>
                Resetting "{title ?? "Media Item"}"
            </AlertDialog.Title>
            <AlertDialog.Description>
                This will send a request to Riven to reset this media. You will be notified when
                it's done.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
                onclick={async () => {
                    await resetMediaItem(ids);
                    open = false;
                }}>Reset</AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
