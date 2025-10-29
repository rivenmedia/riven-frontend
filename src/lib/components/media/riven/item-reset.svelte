<script lang="ts">
    import { resetItems } from "$lib/api";
    import { toast } from "svelte-sonner";
    import MediaActionDialog from "./media-action-dialog.svelte";
    import type { ButtonWrapperProps } from "$lib/types/button";
    import { filterValidIds } from "$lib/utils";

    interface Props extends ButtonWrapperProps {
        title: string | null | undefined;
        ids: (string | null | undefined)[];
    }
    let { title, ids, variant = "ghost", size = "sm", ...restProps }: Props = $props();

    async function resetMediaItem(ids: (string | null | undefined)[]) {
        const validIds = filterValidIds(ids);

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
