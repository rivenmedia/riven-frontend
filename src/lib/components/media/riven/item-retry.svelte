<script lang="ts">
    import { retryItems } from "$lib/api";
    import { toast } from "svelte-sonner";
    import MediaActionDialog from "./media-action-dialog.svelte";
    import type { ButtonWrapperProps } from "$lib/types/button";

    interface Props extends ButtonWrapperProps {
        title: string | null | undefined;
        ids: (string | null | undefined)[];
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
