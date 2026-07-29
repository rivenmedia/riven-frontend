<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { gqlClient } from "$lib/graphql-client";
    import { toast } from "svelte-sonner";
    import type { Snippet } from "svelte";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import WandSparkles from "@lucide/svelte/icons/wand-sparkles";
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import HardDrive from "@lucide/svelte/icons/hard-drive";
    import Newspaper from "@lucide/svelte/icons/newspaper";
    import Magnet from "@lucide/svelte/icons/magnet";
    import SeasonSelector, { type SeasonInfo } from "./season-selector.svelte";
    import { page } from "$app/state";

    interface Props {
        title: string | null | undefined;
        itemId: string | null;
        externalId: string;
        mediaType: "tv" | "movie";
        variant?: "ghost" | "default" | "link" | "destructive" | "outline" | "secondary";
        size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
        class?: string;
        seasons?: SeasonInfo[];
        children?: Snippet;
    }

    interface StreamCandidate {
        key: string;
        title: string;
        infoHash: string;
        magnet: string;
        parsedData?: {
            resolution?: string;
            quality?: string;
            audio?: string[];
            languages?: string[];
            seasons?: number[];
        } | null;
        rank?: number | null;
        fileSizeBytes?: number | null;
        isCached: boolean;
        itemType: "MOVIE" | "SEASON";
        seasonNumber?: number | null;
    }

    /**
     * Usenet releases carry a synthetic `nzb-` info hash (the same marker the
     * backend uses to route them); everything else is a torrent/debrid hash.
     */
    function isUsenet(infoHash: string) {
        return infoHash.startsWith("nzb-");
    }

    const DISCOVER_STREAMS_MUTATION = `mutation($itemType: MediaItemType!, $title: String!, $imdbId: String, $tmdbId: String, $tvdbId: String, $seasons: [Int!], $cachedOnly: Boolean) {
        discoverStreams(itemType: $itemType, title: $title, imdbId: $imdbId, tmdbId: $tmdbId, tvdbId: $tvdbId, seasons: $seasons, cachedOnly: $cachedOnly) {
            key
            title
            infoHash
            magnet
            parsedData
            rank
            fileSizeBytes
            isCached
            itemType
            seasonNumber
        }
    }`;

    const DOWNLOAD_DISCOVERED_STREAM_MUTATION = `mutation($itemType: MediaItemType!, $title: String!, $imdbId: String, $tmdbId: String, $tvdbId: String, $seasonNumber: Int, $seasons: [Int!], $infoHash: String!, $magnet: String!, $parsedData: JSON, $rank: Int) {
        downloadDiscoveredStream(itemType: $itemType, title: $title, imdbId: $imdbId, tmdbId: $tmdbId, tvdbId: $tvdbId, seasonNumber: $seasonNumber, seasons: $seasons, infoHash: $infoHash, magnet: $magnet, parsedData: $parsedData, rank: $rank)
    }`;

    let {
        title,
        itemId,
        externalId,
        mediaType,
        variant = "ghost",
        size = "sm",
        seasons = [],
        children,
        ...restProps
    }: Props = $props();

    let open = $state(false);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let selectedSeasons = $state<number[]>([]);
    let cachedOnly = $state(true);
    let advancedOpen = $state(false);
    let customTmdbId = $state("");
    let customTvdbId = $state("");
    let explicitHash = $state("");
    let streams = $state<StreamCandidate[]>([]);
    let downloadingKey = $state<string | null>(null);

    const hasSeasonSelector = $derived(mediaType === "tv" && seasons.length > 0);
    const visibleStreams = $derived(
        cachedOnly ? streams.filter((stream) => stream.isCached) : streams
    );
    const resolvedTmdbId = $derived(
        mediaType === "movie" ? (clean(customTmdbId) ?? externalId) : null
    );
    const resolvedTvdbId = $derived(
        mediaType === "tv" ? (clean(customTvdbId) ?? externalId) : null
    );
    const cleanedHash = $derived(
        (() => {
            const trimmed = explicitHash.trim();
            if (!trimmed) return null;
            // Extract hash from a full magnet URI
            const btih = trimmed.match(/urn:btih:([a-fA-F0-9]{40}|[a-zA-Z0-9]{32})/i);
            if (btih) return btih[1].toLowerCase();
            // Accept a bare 40- or 64-char hex hash
            if (/^[0-9a-fA-F]{40}$/.test(trimmed) || /^[0-9a-fA-F]{64}$/.test(trimmed))
                return trimmed.toLowerCase();
            return null;
        })()
    );
    const hadExistingItem = $derived(Boolean(itemId));

    function formatBytes(value?: number | null) {
        if (!value) return "Unknown size";
        return value >= 1024 ** 3
            ? `${(value / 1024 ** 3).toFixed(2)} GB`
            : `${(value / 1024 ** 2).toFixed(0)} MB`;
    }

    function shortHash(value: string) {
        return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
    }

    function clean(value: string) {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }

    function toggleSeason(seasonNumber: number) {
        selectedSeasons = selectedSeasons.includes(seasonNumber)
            ? selectedSeasons.filter((value) => value !== seasonNumber)
            : [...selectedSeasons, seasonNumber].sort((a, b) => a - b);
    }

    function reset() {
        loading = false;
        error = null;
        streams = [];
        downloadingKey = null;
        customTmdbId = "";
        customTvdbId = "";
        explicitHash = "";
        advancedOpen = false;
        selectedSeasons = seasons
            .filter((season) => season.status !== "Available")
            .map((season) => season.season_number)
            .sort((a, b) => a - b);
    }

    async function submitDownload(
        key: string,
        vars: {
            itemType: "MOVIE" | "SEASON";
            seasonNumber: number | null;
            seasons?: number[] | null;
            infoHash: string;
            magnet: string;
            parsedData?: StreamCandidate["parsedData"];
            rank?: number | null;
        }
    ) {
        downloadingKey = key;
        error = null;

        try {
            await gqlClient<{ downloadDiscoveredStream: string }>(
                DOWNLOAD_DISCOVERED_STREAM_MUTATION,
                {
                    itemType: vars.itemType,
                    title: title ?? "Unknown",
                    imdbId: null,
                    tmdbId: resolvedTmdbId,
                    tvdbId: resolvedTvdbId,
                    seasonNumber: vars.seasonNumber,
                    seasons: vars.seasons ?? null,
                    infoHash: vars.infoHash,
                    magnet: vars.magnet,
                    parsedData: vars.parsedData ?? null,
                    rank: vars.rank ?? null
                }
            );

            toast.success(
                hadExistingItem
                    ? "Stream queued for download"
                    : "Item created and stream queued for download"
            );
            open = false;
            await invalidateAll();
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to start download";
            toast.error(error);
        } finally {
            downloadingKey = null;
        }
    }

    async function discoverStreams() {
        loading = true;
        error = null;

        try {
            const data = await gqlClient<{ discoverStreams: StreamCandidate[] }>(
                DISCOVER_STREAMS_MUTATION,
                {
                    itemType: mediaType === "movie" ? "MOVIE" : "SHOW",
                    title: title ?? "Unknown",
                    imdbId: null,
                    tmdbId: resolvedTmdbId,
                    tvdbId: resolvedTvdbId,
                    seasons: hasSeasonSelector ? selectedSeasons : null,
                    cachedOnly
                }
            );

            streams = data.discoverStreams ?? [];
            toast.success(streams.length ? "Streams found" : "No streams found");
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to discover streams";
            toast.error(error);
        } finally {
            loading = false;
        }
    }

    function downloadStream(stream: StreamCandidate) {
        // A pack that parses to multiple seasons fills every one it contains;
        // the backend links it to the show rather than a single season.
        const packSeasons = stream.parsedData?.seasons?.filter((n) => n > 0) ?? [];
        return submitDownload(stream.key, {
            itemType: stream.itemType,
            seasonNumber: stream.seasonNumber ?? null,
            seasons: packSeasons.length ? packSeasons : null,
            infoHash: stream.infoHash,
            magnet: stream.magnet,
            parsedData: stream.parsedData,
            rank: stream.rank
        });
    }

    function downloadExplicitHash() {
        if (!cleanedHash) {
            error = "Enter a valid 40-char info hash or paste a magnet link";
            return;
        }

        if (mediaType === "tv" && selectedSeasons.length === 0) {
            error = "Select at least one season before downloading an explicit hash";
            toast.error(error);
            return;
        }

        return submitDownload(`manual:${cleanedHash}`, {
            itemType: mediaType === "movie" ? "MOVIE" : "SEASON",
            seasonNumber: mediaType === "tv" ? selectedSeasons[0] : null,
            seasons: mediaType === "tv" ? selectedSeasons : null,
            infoHash: cleanedHash,
            magnet: `magnet:?xt=urn:btih:${cleanedHash}`,
            parsedData: null
        });
    }

    $effect(() => {
        if (!open) {
            reset();
        }
    });
</script>

{#if page.data.permissions?.canManageLibrary}
    <Dialog.Root bind:open>
        <Dialog.Trigger>
            {#snippet child({ props })}
                <Button {variant} {size} {...restProps} {...props}>{@render children?.()}</Button>
            {/snippet}
        </Dialog.Trigger>
        <Dialog.Content
            class="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden border-white/10 bg-zinc-950/95 backdrop-blur-xl sm:max-h-[80vh]">
            <Dialog.Header>
                <Dialog.Title>Manual Scrape</Dialog.Title>
                <Dialog.Description>
                    Find stream candidates first. Nothing downloads until you choose a specific
                    result.
                </Dialog.Description>
            </Dialog.Header>

            {#if error}
                <p
                    class="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                </p>
            {/if}

            <div class="min-h-0 flex-1 overflow-y-auto pr-1">
                <div class="space-y-5">
                    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div
                            class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div class="space-y-2">
                                <p class="text-base font-semibold text-white">
                                    {title ?? "Unknown item"}
                                </p>
                                <p class="text-xs text-zinc-400">
                                    {mediaType === "movie"
                                        ? "Movie discovery"
                                        : "Season pack discovery"}
                                </p>
                                <button
                                    type="button"
                                    class={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs transition ${
                                        cachedOnly
                                            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                            : "border-white/10 bg-transparent text-zinc-400"
                                    }`}
                                    onclick={() => {
                                        cachedOnly = !cachedOnly;
                                    }}>
                                    Cached only {cachedOnly ? "On" : "Off"}
                                </button>
                                <button
                                    type="button"
                                    class="inline-flex w-fit items-center rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                                    onclick={() => {
                                        advancedOpen = !advancedOpen;
                                    }}>
                                    Advanced {advancedOpen ? "Hide" : "Show"}
                                </button>
                            </div>
                            <Button
                                onclick={discoverStreams}
                                disabled={loading ||
                                    (hasSeasonSelector && selectedSeasons.length === 0)}>
                                {#if loading}
                                    <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                                {:else}
                                    <WandSparkles class="mr-2 h-4 w-4" />
                                {/if}
                                {streams.length ? "Search Again" : "Find Streams"}
                            </Button>
                        </div>

                        {#if hasSeasonSelector}
                            <div class="mt-4 space-y-2">
                                <div class="flex items-center justify-between">
                                    <Label>Seasons</Label>
                                    <button
                                        type="button"
                                        class="text-xs text-zinc-400 transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                                        onclick={() => (selectedSeasons = [])}
                                        disabled={selectedSeasons.length === 0}>
                                        Deselect all
                                    </button>
                                </div>
                                <div
                                    class="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
                                    <SeasonSelector
                                        {seasons}
                                        {selectedSeasons}
                                        onToggle={toggleSeason} />
                                </div>
                            </div>
                        {/if}

                        {#if advancedOpen}
                            <div class="mt-4 grid gap-3 md:grid-cols-2">
                                <div class="space-y-2">
                                    <Label
                                        >{mediaType === "movie"
                                            ? "Custom TMDB ID"
                                            : "Custom TVDB ID"}</Label>
                                    {#if mediaType === "movie"}<Input
                                            bind:value={customTmdbId}
                                            placeholder={externalId} />{:else}<Input
                                            bind:value={customTvdbId}
                                            placeholder={externalId} />{/if}
                                </div>
                                <div class="space-y-2">
                                    <Label>Explicit Stream Hash</Label>
                                    <Input
                                        bind:value={explicitHash}
                                        placeholder="40-char info hash" />
                                </div>
                            </div>
                        {/if}
                        {#if cleanedHash}
                            <div class="mt-4 flex justify-end">
                                <Button
                                    variant="outline"
                                    onclick={downloadExplicitHash}
                                    disabled={downloadingKey !== null}>
                                    {#if downloadingKey === `manual:${cleanedHash}`}<LoaderCircle
                                            class="mr-2 h-4 w-4 animate-spin" />{/if}
                                    Download Explicit Hash
                                </Button>
                            </div>
                        {/if}
                    </div>

                    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div class="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p class="text-sm font-semibold text-white">Stream Candidates</p>
                                <p class="text-xs text-zinc-400">
                                    Fresh discovery results from the scraper plugins.
                                </p>
                            </div>
                            <Badge variant="outline">{visibleStreams.length} found</Badge>
                        </div>

                        {#if !visibleStreams.length}
                            <div
                                class="rounded-xl border border-dashed border-white/15 px-6 py-12 text-center text-sm text-zinc-400">
                                {#if loading}
                                    <LoaderCircle class="mx-auto mb-3 h-5 w-5 animate-spin" />
                                    Waiting for backend results...
                                {:else if streams.length && cachedOnly}
                                    No cached streams matched the current filter.
                                {:else}
                                    Click "Find Streams" to start discovery.
                                {/if}
                            </div>
                        {:else}
                            <div
                                class="max-h-[48vh] overflow-y-auto rounded-xl pr-1 sm:max-h-[52vh]">
                                <div class="space-y-3">
                                    {#each visibleStreams as stream (stream.key)}
                                        <div
                                            class="rounded-xl border border-white/10 bg-black/20 p-4">
                                            <div
                                                class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div class="min-w-0 space-y-2">
                                                    <div class="flex flex-wrap gap-2">
                                                        {#if isUsenet(stream.infoHash)}
                                                            <Badge
                                                                class="border-transparent bg-sky-500/15 text-sky-300">
                                                                <Newspaper class="mr-1 h-3 w-3" />
                                                                Usenet
                                                            </Badge>
                                                        {:else}
                                                            <Badge
                                                                class="border-transparent bg-amber-500/15 text-amber-300">
                                                                <Magnet class="mr-1 h-3 w-3" />
                                                                Torrent
                                                            </Badge>
                                                        {/if}
                                                        {#if stream.seasonNumber != null}
                                                            <Badge variant="outline"
                                                                >Season {stream.seasonNumber}</Badge>
                                                        {/if}
                                                        <Badge
                                                            variant={stream.isCached
                                                                ? "default"
                                                                : "outline"}>
                                                            {stream.isCached
                                                                ? "Cached"
                                                                : "Uncached"}
                                                        </Badge>
                                                        <Badge
                                                            >{stream.parsedData?.resolution ??
                                                                "Unknown"}</Badge>
                                                        {#if stream.parsedData?.quality}
                                                            <Badge variant="outline"
                                                                >{stream.parsedData.quality}</Badge>
                                                        {/if}
                                                        {#if stream.rank != null}
                                                            <Badge variant="outline"
                                                                >Rank {stream.rank}</Badge>
                                                        {/if}
                                                    </div>
                                                    <p class="truncate text-sm text-zinc-200">
                                                        {stream.title}
                                                    </p>
                                                    <p class="truncate text-xs text-zinc-400">
                                                        {shortHash(stream.infoHash)}
                                                    </p>
                                                </div>
                                                <div
                                                    class="flex flex-wrap gap-2 text-xs text-zinc-400 md:justify-end">
                                                    <span class="inline-flex items-center gap-1">
                                                        <HardDrive class="h-3.5 w-3.5" />
                                                        {formatBytes(stream.fileSizeBytes)}
                                                    </span>
                                                    {#if stream.parsedData?.audio?.length}
                                                        <span
                                                            >{stream.parsedData.audio.join(
                                                                ", "
                                                            )}</span>
                                                    {/if}
                                                    {#if stream.parsedData?.languages?.length}
                                                        <span
                                                            >{stream.parsedData.languages
                                                                .join(", ")
                                                                .toUpperCase()}</span>
                                                    {/if}
                                                </div>
                                            </div>
                                            <div class="mt-3 flex justify-end">
                                                <Button
                                                    size="sm"
                                                    onclick={() => downloadStream(stream)}
                                                    disabled={downloadingKey !== null}>
                                                    {#if downloadingKey === stream.key}
                                                        <LoaderCircle
                                                            class="mr-2 h-4 w-4 animate-spin" />
                                                    {/if}
                                                    Download This
                                                </Button>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <div
                class="mt-5 flex shrink-0 items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button variant="outline" onclick={() => (open = false)}>
                    <ChevronLeft class="mr-2 h-4 w-4" />
                    Close
                </Button>
            </div>
        </Dialog.Content>
    </Dialog.Root>
{/if}
