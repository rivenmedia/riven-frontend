<script lang="ts">
    import { removeItem } from "$lib/api";
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

    async function removeMediaItem(ids: (string | null | undefined)[]) {
        const validIds = ids.filter((id): id is string => id !== null && id !== undefined);

        const response = await removeItem({
            query: {
                ids: validIds.join(",")
            }
        });

        if (response.data) {
            toast.success("Media item deleted successfully!");
        } else {
            toast.error("Failed to delete media item.");
        }
    }
</script>

<MediaActionDialog
    title={`Deleting "${title ?? "Media Item"}"`}
    description="This will send a request to Riven to delete this media. You will be notified when it's removed."
    buttonText="Delete"
    actionButtonText="Delete"
    {variant}
    {size}
    {...restProps}
    onAction={() => removeMediaItem(ids)} />
