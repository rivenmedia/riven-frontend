<script lang="ts">
    import { pauseItems, unpauseItems } from "$lib/api";
    import { toast } from "svelte-sonner";
    import MediaActionDialog from "./media-action-dialog.svelte";

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
            ? await unpauseItems({
                  query: {
                      ids: validIds.join(",")
                  }
              })
            : await pauseItems({
                  query: {
                      ids: validIds.join(",")
                  }
              });

        if (response.data) {
            toast.success(`Media item ${isPaused ? "unpaused" : "paused"} successfully!`);
        } else {
            toast.error(`Failed to ${isPaused ? "unpause" : "pause"} media item.`);
        }
    }
</script>

<MediaActionDialog
    title={`${isPaused ? "Resume" : "Pause"} "${title ?? "Media Item"}"`}
    description={`This will send a request to Riven to ${isPaused ? "resume" : "pause"} this media. You will be notified when it's done.`}
    buttonText={isPaused ? "Resume" : "Pause"}
    actionButtonText={isPaused ? "Resume" : "Pause"}
    {variant}
    {size}
    {...restProps}
    onAction={() => togglePauseMediaItem(ids)} />
