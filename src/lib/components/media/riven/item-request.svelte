<script lang="ts">
    import providers from "$lib/providers";
    import { toast } from "svelte-sonner";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import type { ScrapeSeasonRequest } from "$lib/types";

    interface SeasonInfo {
        id: number;
        season_number: number;
        episode_count: number;
        name: string;
        status?: string;
    }

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

    // State for season selection
    let selectedSeasons = $state<Set<number>>(new Set());
    let hasInitialized = $state(false);

    // Initialize selectedSeasons when dialog opens
    $effect(() => {
        if (open && seasons.length > 0 && !hasInitialized) {
            // Single-pass: only select Available seasons
            selectedSeasons = new Set(
                seasons.reduce<number[]>((acc, s) => {
                    if (s.status === "Available") acc.push(s.season_number);
                    return acc;
                }, [])
            );
            hasInitialized = true;
        }
        // Reset hasInitialized when dialog closes so next open re-initializes
        if (!open) {
            hasInitialized = false;
        }
    });

    function toggleSeason(seasonNumber: number) {
        const newSet = new Set(selectedSeasons);
        if (newSet.has(seasonNumber)) {
            newSet.delete(seasonNumber);
        } else {
            newSet.add(seasonNumber);
        }
        selectedSeasons = newSet;
    }

    function toggleAll() {
        // Switch is checked when all seasons are selected
        // Clicking should toggle between all selected and none selected
        if (selectedSeasons.size === seasons.length) {
            // All are selected, deselect all
            selectedSeasons = new Set();
        } else {
            // Not all are selected, select all
            selectedSeasons = new Set(seasons.map((s) => s.season_number));
        }
    }

    async function addMediaItem(ids: (string | null | undefined)[], mediaType: string) {
        const validIds = ids.filter((id): id is string => id !== null && id !== undefined);
        // Use externalId prop if provided, otherwise fallback to first id (for backward compatibility)
        const tvdbOrTmdbId = externalId ?? validIds[0];

        try {
            if (
                mediaType === "tv" &&
                seasons.length > 0 &&
                selectedSeasons.size > 0 &&
                selectedSeasons.size < seasons.length &&
                tvdbOrTmdbId
            ) {
                // Use new ScrapeSeasonRequest if available
                const body: ScrapeSeasonRequest = {
                    tvdb_id: tvdbOrTmdbId,
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
                    console.error("Error response:", response.error);
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
                    console.error("Error response:", response.error);
                    toast.error("Failed to request media item.");
                }
            }
        } catch (e) {
            console.error("Request failed", e);
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
    <AlertDialog.Content class="max-w-2xl">
        <AlertDialog.Header>
            <AlertDialog.Title>
                Requesting "{title ?? "Media Item"}"
            </AlertDialog.Title>
            <AlertDialog.Description>
                This will send a request to Riven to add this media.
            </AlertDialog.Description>
        </AlertDialog.Header>

        {#if mediaType === "tv" && seasons.length > 0}
            <div class="my-4 max-h-[60vh] overflow-y-auto rounded-md border p-2">
                <div class="mb-2 flex items-center justify-between border-b px-2 pb-2">
                    <span class="text-sm font-bold">Select Seasons</span>
                    <div class="flex items-center gap-2">
                        <span class="text-muted-foreground text-xs"
                            >{selectedSeasons.size} selected</span>
                        <Switch
                            checked={selectedSeasons.size === seasons.length}
                            onCheckedChange={toggleAll} />
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    {#each seasons as season (season.id)}
                        <div
                            class="hover:bg-muted/50 flex items-center justify-between rounded-md p-2 transition-colors">
                            <div class="flex items-center gap-4">
                                <Switch
                                    checked={selectedSeasons.has(season.season_number)}
                                    onCheckedChange={() => toggleSeason(season.season_number)} />
                                <div class="flex flex-col">
                                    <span class="font-medium">{season.name}</span>
                                    <span class="text-muted-foreground text-xs"
                                        >{season.episode_count} Episodes</span>
                                </div>
                            </div>
                            {#if season.status}
                                <Badge
                                    variant={season.status === "Available"
                                        ? "default"
                                        : "secondary"}>
                                    {season.status}
                                </Badge>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
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
                {mediaType === "tv" && seasons.length > 0 ? "Select Season(s)" : "Request"}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
