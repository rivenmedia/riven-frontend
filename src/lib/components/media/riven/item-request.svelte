<script lang="ts">
    import providers from "$lib/providers";
    import { toast } from "svelte-sonner";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import Loader2 from "@lucide/svelte/icons/loader-2";

    interface Props {
        title: string | null | undefined;
        ids: (string | null | undefined)[];
        mediaType: string; //"movie" | "tv"
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
        mediaType,
        variant = "ghost",
        size = "sm",
        class: className = "",
        ...restProps
    }: Props = $props();

    async function addMediaItem(ids: (string | null | undefined)[], mediaType: string) {
        const validIds = ids.filter((id): id is string => id !== null && id !== undefined);

        const response = await providers.riven.POST("/api/v1/items/add", {
            body: {
                media_type: mediaType as "movie" | "tv",
                tmdb_ids: mediaType === "movie" ? validIds : [],
                tvdb_ids: mediaType === "tv" ? validIds : []
            }
        });

        if (response.data) {
            toast.success("Media item requested successfully!");
        } else {
            console.error("Error response:", response.error);
            toast.error("Failed to request media item.");
        }
    }

    let open = $state(false);
    let loading = $state(false);
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Trigger>
        {#snippet child({ props })}
            <Button {variant} {size} class={className} {...restProps} {...props}>Request</Button>
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
                disabled={loading}
                onclick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loading = true;
                    await addMediaItem(ids, mediaType);
                    loading = false;
                    open = false;
                }}>
                {#if loading}
                    <Loader2 class="mr-1 inline-block animate-spin" />
                {/if}
                Request
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
