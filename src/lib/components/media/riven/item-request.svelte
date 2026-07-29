<script lang="ts">
    import { gqlClient } from "$lib/graphql-client";
    import { retryItems, toNumericIds } from "$lib/services/library-mutations";
    import { toast } from "svelte-sonner";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import SeasonSelector, { type SeasonInfo } from "./season-selector.svelte";
    import { createScopedLogger } from "$lib/logger";
    import { type Snippet } from "svelte";
    import { page } from "$app/state";

    const logger = createScopedLogger("item-request");

    interface Props {
        title: string | null | undefined;
        ids: (string | null | undefined)[];
        mediaType: string; // "movie" | "tv"
        seasons?: SeasonInfo[];
        buttonLabel?: string;
        externalId?: string; // TVDB or TMDB ID
        variant?: "ghost" | "default" | "link" | "destructive" | "outline" | "secondary";
        size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
        class?: string;
        children?: Snippet;
        onSuccess?: (itemId?: number) => void | Promise<void>;
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
        children,
        onSuccess,
        ...restProps
    }: Props = $props();

    let open = $state(false);
    let loading = $state(false);
    let selectedSeasonNums = $state<number[]>([]);

    // Re-initialize selection each time the dialog opens.
    $effect(() => {
        if (open) {
            selectedSeasonNums = seasons
                .filter((s) => s.status !== "Available")
                .map((s) => s.season_number)
                .filter(Number.isInteger)
                .sort((a, b) => a - b);
        }
    });

    function toggleSeason(n: number) {
        selectedSeasonNums = selectedSeasonNums.includes(n)
            ? selectedSeasonNums.filter((x) => x !== n)
            : [...selectedSeasonNums, n].sort((a, b) => a - b);
    }

    const requestableSeasons = $derived(
        seasons.filter((s) => s.status !== "Available").map((s) => s.season_number)
    );

    const confirmDisabled = $derived(
        loading ||
            (mediaType === "tv" &&
                seasons.length > 0 &&
                requestableSeasons.length > 0 &&
                selectedSeasonNums.length === 0)
    );

    async function handleConfirm() {
        loading = true;
        let requestedItemId: number | undefined;
        const validNumericIds = toNumericIds(ids);

        try {
            if (mediaType === "tv") {
                const result = await gqlClient<{
                    requestShow: { success: boolean; statusText: string; message: string };
                }>(
                    `mutation RequestShow($input: ShowRequestInput!) {
                        requestShow(input: $input) { success statusText message }
                    }`,
                    {
                        input: {
                            title: title ?? "Unknown",
                            tvdbId: externalId,
                            seasons: selectedSeasonNums.length > 0 ? selectedSeasonNums : null
                        }
                    }
                );
                if (result.requestShow.statusText === "CONFLICT") {
                    toast.info("This show has already been requested.");
                    open = false;
                    return;
                }
            } else if (validNumericIds.length > 0) {
                // Item already exists in Riven — clear failed attempts and retry.
                await retryItems(validNumericIds);
                requestedItemId = validNumericIds[0];
            } else {
                const result = await gqlClient<{
                    requestMovie: { success: boolean; statusText: string; message: string };
                }>(
                    `mutation RequestMovie($input: MovieRequestInput!) {
                        requestMovie(input: $input) { success statusText message }
                    }`,
                    {
                        input: {
                            title: title ?? "Unknown",
                            tmdbId: externalId
                        }
                    }
                );
                if (result.requestMovie.statusText === "CONFLICT") {
                    toast.info("This movie has already been requested.");
                    open = false;
                    return;
                }
            }
            toast.success("Requested successfully!");
            open = false;
            void onSuccess?.(requestedItemId);
        } catch (e) {
            logger.error("Request failed", e);
            toast.error("Failed to request media item.");
        } finally {
            loading = false;
        }
    }
</script>

{#if page.data.permissions?.canRequestItems}
    <AlertDialog.Root bind:open>
        <AlertDialog.Trigger>
            {#snippet child({ props })}
                <Button {variant} {size} class={className} {...restProps} {...props}>
                    {#if children}
                        {@render children()}
                    {:else}
                        {buttonLabel}
                    {/if}
                </Button>
            {/snippet}
        </AlertDialog.Trigger>
        <AlertDialog.Content class="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl">
            <AlertDialog.Header>
                <AlertDialog.Title>Requesting "{title ?? "Media Item"}"</AlertDialog.Title>
                <AlertDialog.Description>
                    This will send a request to Riven to add this media.
                </AlertDialog.Description>
            </AlertDialog.Header>

            {#if mediaType === "tv" && seasons.length > 0}
                <div class="my-4 space-y-2">
                    <div class="flex items-center justify-end">
                        <button
                            type="button"
                            class="text-xs text-zinc-400 transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                            onclick={() =>
                                (selectedSeasonNums =
                                    selectedSeasonNums.length > 0 ? [] : [...requestableSeasons])}
                            disabled={requestableSeasons.length === 0}>
                            {selectedSeasonNums.length > 0 ? "Deselect all" : "Select all"}
                        </button>
                    </div>
                    <SeasonSelector
                        {seasons}
                        selectedSeasons={selectedSeasonNums}
                        onToggle={toggleSeason} />
                </div>
            {:else}
                <div class="text-muted-foreground py-4 text-sm">
                    This request will be approved automatically.
                </div>
            {/if}

            <AlertDialog.Footer>
                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                <!-- Plain Button instead of AlertDialog.Action — Action auto-closes the dialog
                     before onclick fires, which would race against the async request. -->
                <Button disabled={confirmDisabled} onclick={handleConfirm}>
                    {#if loading}
                        <Loader2 class="mr-1 inline-block animate-spin" />
                    {/if}
                    {mediaType === "tv" && seasons.length > 0 ? "Request Selected" : "Request"}
                </Button>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{/if}
