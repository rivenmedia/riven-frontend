<script lang="ts">
    import { resetItems } from "$lib/api";
    import { toast } from "svelte-sonner";
    import MediaActionDialog from "./media-action-dialog.svelte";

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
</script>

<MediaActionDialog
    title={`Resetting "${title ?? "Media Item"}"`}
    description="This will send a request to Riven to reset this media. You will be notified when it's done."
    buttonText="Reset"
    actionButtonText="Reset"
    {variant}
    {size}
    {...restProps}
    onAction={() => resetMediaItem(ids)} />
