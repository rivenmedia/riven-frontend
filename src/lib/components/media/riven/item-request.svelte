<script lang="ts">
    import { addItems } from "$lib/api";
    import { toast } from "svelte-sonner";
    import MediaActionDialog from "./media-action-dialog.svelte";
    import type { ButtonWrapperProps } from "$lib/types/button";
    import { filterValidIds } from "$lib/utils";

    interface Props extends ButtonWrapperProps {
        title: string | null | undefined;
        ids: (string | null | undefined)[];
        mediaType: "movie" | "tv";
    }
    let { title, ids, mediaType, variant = "ghost", size = "sm", ...restProps }: Props = $props();

    async function addMediaItem(ids: (string | null | undefined)[], mediaType: "movie" | "tv") {
        console.log("IDs:", ids);
        const validIds = filterValidIds(ids);

        const response = await addItems({
            query: {
                media_type: mediaType,
                tmdb_ids: mediaType === "movie" ? validIds.join(",") : "",
                tvdb_ids: mediaType === "tv" ? validIds.join(",") : ""
            }
        });

        if (response.data) {
            toast.success("Media item requested successfully!");
        } else {
            toast.error("Failed to request media item.");
        }
    }
</script>

<MediaActionDialog
    title={`Requesting "${title ?? "Media Item"}"`}
    description="This will send a request to Riven to add this media. You will be notified when it's available."
    buttonText="Request"
    actionButtonText="Request"
    {variant}
    {size}
    {...restProps}
    onAction={() => addMediaItem(ids, mediaType)} />
