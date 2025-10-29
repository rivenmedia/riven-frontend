<script lang="ts">
    import { retryItems } from "$lib/api";
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

    async function retryMediaItem(ids: (string | null | undefined)[]) {
        const validIds = ids.filter((id): id is string => id !== null && id !== undefined);

        const response = await retryItems({
            query: {
                ids: validIds.join(",")
            }
        });

        if (response.data) {
            toast.success("Media item retry successfully!");
        } else {
            toast.error("Failed to retry media item.");
        }
    }
</script>

<MediaActionDialog
    title={`Retrying "${title ?? "Media Item"}"`}
    description="This will send a request to Riven to retry this media. You will be notified when it's done."
    buttonText="Retry"
    actionButtonText="Retry"
    {variant}
    {size}
    {...restProps}
    onAction={() => retryMediaItem(ids)} />
