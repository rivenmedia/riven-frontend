<script lang="ts">
    import providers from "$lib/providers";
    import { toast } from "svelte-sonner";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import type { ScrapeSeasonRequest } from "$lib/types";
    import SeasonSelector, { type SeasonInfo } from "./season-selector.svelte";
    import { createScopedLogger } from "$lib/logger";

    const logger = createScopedLogger("item-request");

    interface Props {
        title: string | null | undefined;
        ids: (string | null | undefined)[];
        mediaType: string; //"movie" | "tv"
        seasons?: SeasonInfo[];
        buttonLabel?: string;
        externalId?: string; // TVDB or TMDB ID for /api/v1/scrape/seasons
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
        seasons = [],
        buttonLabel = "Request",
        externalId,
        variant = "ghost",
        size = "sm",
        class: className = "",
        ...restProps
    }: Props = $props();

    let open = $state(false);
    let loading = $state(false);

    // State for season selection - managed by SeasonSelector component
    let selectedSeasons = $state<Set<number>>(new Set());

    async function addMediaItem(ids: (string | null | undefined)[], mediaType: string) {
        const validIds = ids.filter((id): id is string => id !== null && id !== undefined);

        try {
            if (
                mediaType === "tv" &&
                seasons.length > 0 &&
                selectedSeasons.size > 0 &&
                selectedSeasons.size < seasons.length &&
                externalId
            ) {
                const body: ScrapeSeasonRequest = {
                    tvdb_id: externalId,
                    season_numbers: Array.from(selectedSeasons)
                };

                // HACK: Casting providers.riven to any because the endpoint might not be in the generated client
                const response = await (providers.riven as any).POST("/api/v1/scrape/seasons", {
                    body: body
                });

                if (response.data || response.message) {
                    // adjust check based on actual response
                    toast.success("Media item requested successfully!");
                    open = false;
                } else {
                    logger.error("Error response:", response.error);
                    toast.error("Failed to request media item.");
                }
            } else {
                // Fallback to original add logic for movies or if all/no seasons selected
                const response = await providers.riven.POST("/api/v1/items/add", {
                    body: {
                        media_type: mediaType as "movie" | "tv",
                        tmdb_ids: mediaType === "movie" ? validIds : [],
                        tvdb_ids: mediaType === "tv" ? validIds : []
                    }
                });

                if (response.data) {
                    toast.success("Media item requested successfully!");
                    open = false;
                } else {
                    logger.error("Error response:", response.error);
                    toast.error("Failed to request media item.");
                }
            }
        } catch (e) {
            logger.error("Request failed", e);
            toast.error("Failed to request media item.");
        }
    }
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Trigger>
        {#snippet child({ props })}
            <Button {variant} {size} class={className} {...restProps} {...props}
                >{buttonLabel}</Button>
        {/snippet}
    </AlertDialog.Trigger>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>
                Requesting "{title ?? "Media Item"}"
            </AlertDialog.Title>
            <AlertDialog.Description>
                This will send a request to Riven to add this media.
            </AlertDialog.Description>
        </AlertDialog.Header>

        {#if mediaType === "tv" && seasons.length > 0}
            <SeasonSelector {seasons} {open} bind:selectedSeasons class="my-4" />
        {:else}
            <div class="text-muted-foreground py-4 text-sm">
                This request will be approved automatically.
            </div>
        {/if}

        <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
                disabled={loading ||
                    (mediaType === "tv" && seasons.length > 0 && selectedSeasons.size === 0)}
                onclick={async () => {
                    loading = true;
                    await addMediaItem(ids, mediaType);
                    loading = false;
                    open = false;
                }}>
                {#if loading}
                    <Loader2 class="mr-1 inline-block animate-spin" />
                {/if}
                {mediaType === "tv" && seasons.length > 0 ? "Select Season(s)" : "Request"}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
