<script lang="ts">
    import { addItems } from "$lib/api";
    import { toast } from "svelte-sonner";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";

    interface Props {
        title: string | null | undefined;
        ids: (string | null | undefined)[];
        mediaType: "movie" | "tv";
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
    let { title, ids, mediaType, variant = "ghost", size = "sm", ...restProps }: Props = $props();

    async function addMediaItem(ids: (string | null | undefined)[], mediaType: "movie" | "tv") {
        console.log("IDs:", ids);
        const validIds = ids.filter((id): id is string => id !== null && id !== undefined);

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

    let open = $state(false);
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Trigger>
        {#snippet child({ props })}
            <Button {variant} {size} {...restProps} {...props}>Request</Button>
        {/snippet}
    </AlertDialog.Trigger>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>
                Requesting "{title ?? "Media Item"}"
            </AlertDialog.Title>
            <AlertDialog.Description>
                This will send a request to Riven to add this media. You will be notified when it's
                available.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
                onclick={async () => {
                    await addMediaItem(ids, mediaType);
                    open = false;
                }}>Request</AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
