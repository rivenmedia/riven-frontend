<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { type PageProps } from "./$types";
    import type { ParsedShowDetails } from "$lib/metadata/parser";
    import { fade, fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import Play from "@lucide/svelte/icons/play";
    import FileJson from "@lucide/svelte/icons/file-json";
    import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
    import RefreshCw from "@lucide/svelte/icons/refresh-cw";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import Search from "@lucide/svelte/icons/search";
    import Pause from "@lucide/svelte/icons/pause";
    import Download from "@lucide/svelte/icons/download";
    import { cn } from "$lib/utils";
    import PortraitCard from "$lib/components/media/portrait-card.svelte";
    import ItemRequest from "$lib/components/media/riven/item-request.svelte";
    import ItemAction from "$lib/components/media/riven/item-action.svelte";
    import ItemManualScrape from "$lib/components/media/riven/item-manual-scrape.svelte";
    import CollectionSheet from "$lib/components/media/collection-sheet.svelte";
    import StatusBadge from "$lib/components/media/status-badge.svelte";
    import LiveSeasons from "./live-seasons.svelte";
    import LiveEpisodes from "./live-episodes.svelte";
    import { toast } from "svelte-sonner";
    import X from "@lucide/svelte/icons/x";
    import { gqlClient, gqlSubscribeClient } from "$lib/graphql-client";
    import type { RivenMediaItem } from "$lib/types/riven";
    import {
        MEDIA_ITEM_FULL_BY_TMDB_QUERY,
        MEDIA_ITEM_FULL_BY_TVDB_QUERY,
        RAW_RIVEN_DATA_BY_TMDB_QUERY,
        RAW_RIVEN_DATA_BY_TVDB_QUERY,
        MEDIA_ITEM_STATE_BY_TMDB_QUERY,
        MEDIA_ITEM_STATE_BY_TVDB_QUERY,
        MEDIA_ITEM_STATE_UPDATES_BY_TMDB_SUBSCRIPTION,
        MEDIA_ITEM_STATE_UPDATES_BY_TVDB_SUBSCRIPTION,
        SHOW_INDEXED_SUBSCRIPTION,
        mapMediaItemStateTree,
        mapMediaItemFull,
        type GqlMediaItemFull,
        type GqlMediaItemStateTree,
        type GqlIndexedShow
    } from "$lib/services/riven-media";
    import { untrack } from "svelte";
    import { SvelteMap } from "svelte/reactivity";
    import { resolve } from "$app/paths";

    let { data }: PageProps = $props();

    const externalMeta: Record<string, { name: string; url: string }> = {
        imdb: { name: "IMDb", url: "https://www.imdb.com/title/" },
        facebook: { name: "Facebook", url: "https://www.facebook.com/" },
        instagram: { name: "Instagram", url: "https://www.instagram.com/" },
        twitter: { name: "Twitter", url: "https://www.twitter.com/" },
        reddit: { name: "Reddit", url: "https://www.reddit.com/r/" },
        "themoviedb.com": { name: "TMDB", url: "https://www.themoviedb.org/tv/" },
        eidr: { name: "EIDR", url: "https://ui.eidr.org/view/content?id=" }
    };
    const getExternal = (key: string) => externalMeta[key.replace("_id", "")];

    function mediaHref(id: number | string, mediaType: string) {
        return resolve("/(protected)/details/media/[id]/[mediaType]", {
            id: String(id),
            mediaType
        });
    }

    function entityHref(id: number | string, type: string, query?: string) {
        const path = resolve("/(protected)/details/entity/[id]/[type]", {
            id: String(id),
            type
        });
        return query ? `${path}?${query}` : path;
    }

    let showTrailerOverride = $state(false);
    const showTrailer = $derived(showTrailerOverride && data.mediaDetails?.details?.trailer);

    let liveRiven = $state<RivenMediaItem | undefined>(untrack(() => data.riven));
    let hydratedRiven = $state<RivenMediaItem | undefined>(undefined);
    let liveRivenItemId = $state<number | undefined>(untrack(() => data.riven?.id));
    let rivenPending = $state(untrack(() => Boolean(data.rivenPending)));
    let completedDetailsHydrating = false;
    let lastHydratedCompletedKey = "";
    let rawDataOpen = $state(false);
    let rawRivenLoading = $state(false);
    let rawRivenError = $state<string | undefined>(undefined);
    let rawRivenData = $state<unknown>(undefined);

    const riven = $derived(liveRiven ?? hydratedRiven);
    const rawRivenDisplayData = $derived(
        rawRivenData ?? (rawRivenLoading ? undefined : (hydratedRiven ?? riven))
    );
    const rawRivenJson = $derived(JSON.stringify(rawRivenDisplayData, null, 2));

    const episodeCountBySeasonNumber = $derived.by(() => {
        if (data.mediaDetails?.type !== "tv") return undefined;

        const details = data.mediaDetails.details as ParsedShowDetails;
        const counts = new SvelteMap<number, number>();

        for (const episode of details.episodes ?? []) {
            if (episode.seasonNumber == null) continue;
            counts.set(episode.seasonNumber, (counts.get(episode.seasonNumber) ?? 0) + 1);
        }

        return counts;
    });

    const completedFileCount = $derived.by(() => {
        if (!riven) return 0;
        if (data.mediaDetails?.type === "movie") {
            return riven.state === "Completed" ? 1 : 0;
        }
        return (
            riven.seasons?.reduce(
                (acc, season) =>
                    acc + (season.episodes?.filter((e) => e.state === "Completed").length ?? 0),
                0
            ) ?? 0
        );
    });

    const totalFileCount = $derived.by(() => {
        if (!riven) return 0;
        if (data.mediaDetails?.type === "movie") {
            return 1;
        }

        const details = data.mediaDetails?.details as ParsedShowDetails | undefined;
        return details?.episode_count ?? 0;
    });

    function getInitialSeason() {
        if (data.mediaDetails?.type !== "tv") return "1";
        const requestedSeason = page.url.searchParams.get("season");
        if (requestedSeason && !Number.isNaN(Number(requestedSeason))) {
            return requestedSeason;
        }
        const details = data.mediaDetails?.details as ParsedShowDetails;
        if (!details?.seasons?.length) return "1";

        const hasSeason1 = details.seasons.some((s) => s.number === 1);
        return hasSeason1 ? "1" : (details.seasons[0].number?.toString() ?? "1");
    }

    function getInitialEpisode() {
        if (data.mediaDetails?.type !== "tv") return undefined;
        const requestedEpisode = page.url.searchParams.get("episode");
        return requestedEpisode && !Number.isNaN(Number(requestedEpisode))
            ? requestedEpisode
            : undefined;
    }

    let selectedSeason: string | undefined = $state(getInitialSeason());
    let selectedEpisode: string | undefined = $state(getInitialEpisode());
    let selectedMovieVersionIdx = $state(0);

    function getMovieEntries() {
        const item = hydratedRiven ?? riven;

        return item?.filesystem_entries?.length
            ? item.filesystem_entries
            : item?.filesystem_entry
              ? [item.filesystem_entry]
              : [];
    }

    function humanizeProfileName(name: string | undefined) {
        if (!name) return null;
        return name
            .split(/[_-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
    }

    function getMetadataResolutionLabel(
        metadata: RivenMediaItem["media_metadata"] | undefined
    ): string | null {
        const height = metadata?.video?.resolution_height;
        if (!height) return null;
        if (height >= 2160) return "4K";
        if (height >= 1440) return "1440p";
        if (height >= 1080) return "1080p";
        if (height >= 720) return "720p";
        if (height >= 480) return "480p";
        return `${height}p`;
    }

    function getFilesystemEntryLabel(
        entry:
            | (NonNullable<RivenMediaItem["filesystem_entry"]> & {
                  id?: number;
                  ranking_profile_name?: string;
              })
            | undefined,
        fallback: string
    ) {
        const resolutionLabel = getMetadataResolutionLabel(entry?.media_metadata);
        const profileLabel = humanizeProfileName(entry?.ranking_profile_name);

        if (resolutionLabel && profileLabel) {
            return `${resolutionLabel} (${profileLabel})`;
        }

        return resolutionLabel ?? profileLabel ?? fallback;
    }

    async function deleteFilesystemEntry(id: number, label: string) {
        if (
            !confirm(
                `Remove version "${label}"? This only removes the tracked file entry — the actual file is not deleted.`
            )
        )
            return;
        try {
            await gqlClient<{ deleteFilesystemEntry: boolean }>(
                `mutation DeleteFilesystemEntry($id: Int!) { deleteFilesystemEntry(id: $id) }`,
                { id }
            );
            selectedMovieVersionIdx = 0;
            toast.success(`Version "${label}" removed`);
        } catch {
            toast.error("Failed to remove version");
        }
    }

    async function handleRequestSuccess() {
        if (rivenPending) {
            return;
        }

        await hydrateInitialState();
    }

    $effect(() => {
        // Track ID changes to reset selected season
        selectedSeason = getInitialSeason();
        selectedEpisode = getInitialEpisode();
        selectedMovieVersionIdx = 0;
        liveRiven = data.riven;
        hydratedRiven = undefined;
        liveRivenItemId = data.riven?.id;
        rivenPending = Boolean(data.rivenPending);
        lastHydratedCompletedKey = "";
        completedDetailsHydrating = false;
        rawDataOpen = false;
        rawRivenLoading = false;
        rawRivenError = undefined;
        rawRivenData = undefined;
    });

    let rivenId = $derived(riven?.id ?? data.mediaDetails?.details?.id);

    // For ratings, we need TMDB ID. For TV shows, check external_ids.tmdb first (in case URL has TVDB ID)
    let ratingsId = $derived(
        data.mediaDetails?.type === "tv"
            ? (data.mediaDetails?.details.external_ids?.tmdb ?? Number(page.params.id))
            : Number(page.params.id)
    );
    let mediaType = $derived(data.mediaDetails?.type);

    let ratingsData = $state<{
        scores: Array<{ name: string; image?: string; score: string; url: string }>;
    } | null>(null);
    let ratingsLoading = $state(false);

    $effect(() => {
        if (!browser || !ratingsId || !mediaType) {
            ratingsLoading = false;
            ratingsData = null;
            return;
        }

        const controller = new AbortController();
        ratingsLoading = true;

        gqlClient<{
            ratings: {
                scores: Array<{ name: string; image?: string; score: string; url: string }>;
            };
        }>(
            `query Ratings($id: String!, $mediaType: String!) {
                ratings(indexer: "tmdb", id: $id, mediaType: $mediaType) {
                    scores { name image score url }
                }
            }`,
            { id: String(ratingsId), mediaType },
            controller.signal
        )
            .then(({ ratings }) => {
                ratingsData = ratings;
                ratingsLoading = false;
            })
            .catch((e) => {
                if (e.name !== "AbortError") {
                    ratingsLoading = false;
                    ratingsData = null;
                }
            });

        return () => controller.abort();
    });

    const seasonData = $derived.by(() => {
        if (data.mediaDetails?.type !== "tv" || !data.mediaDetails?.details?.seasons) return [];
        const details = data.mediaDetails.details as ParsedShowDetails;
        const episodeCountBySeason = new SvelteMap<number, number>();
        const seasonsByNumber = new SvelteMap(
            (liveRiven?.seasons ?? []).map((season) => [season.season_number, season])
        );

        for (const episode of details.episodes ?? []) {
            if (episode.seasonNumber == null) continue;
            episodeCountBySeason.set(
                episode.seasonNumber,
                (episodeCountBySeason.get(episode.seasonNumber) ?? 0) + 1
            );
        }

        return details.seasons.map((s) => {
            const rivenSeason = seasonsByNumber.get(s.number ?? 0);
            const episodeCount = episodeCountBySeason.get(s.number ?? 0) ?? 0;
            const completedCount =
                rivenSeason?.episodes?.filter((e) => e.state === "Completed").length ?? 0;
            const isComplete = episodeCount > 0 && completedCount >= episodeCount;
            return {
                id: s.id,
                season_number: s.number ?? 0,
                episode_count: episodeCount,
                completed_count: rivenSeason ? completedCount : undefined,
                name: `Season ${s.number}`,
                status: isComplete ? "Available" : undefined
            };
        });
    });

    const rivenSeasonsByNumber = $derived.by(
        () =>
            new SvelteMap(
                (liveRiven?.seasons ?? []).map((season) => [season.season_number, season])
            )
    );

    const selectedRivenSeason = $derived.by(() =>
        selectedSeason ? rivenSeasonsByNumber.get(Number(selectedSeason)) : undefined
    );

    const selectedRivenEpisodesByNumber = $derived.by(
        () =>
            new SvelteMap(
                (selectedRivenSeason?.episodes ?? []).map((episode) => [
                    episode.episode_number,
                    episode
                ])
            )
    );

    const selectedHydratedSeason = $derived.by(() =>
        selectedSeason
            ? hydratedRiven?.seasons?.find(
                  (season) => season.season_number === Number(selectedSeason)
              )
            : undefined
    );

    const selectedHydratedEpisodesByNumber = $derived.by(
        () =>
            new SvelteMap(
                (selectedHydratedSeason?.episodes ?? []).map((episode) => [
                    episode.episode_number,
                    episode
                ])
            )
    );

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }).format(n);
    const formatSize = (b: number) => `${(b / 1073741824).toFixed(2)} GB`;

    const details = $derived(
        [
            data.mediaDetails?.details.year,
            data.mediaDetails?.details.formatted_runtime,
            data.mediaDetails?.details.original_language?.toUpperCase(),
            data.mediaDetails?.details.certification,
            data.mediaDetails?.details.status
        ].filter(Boolean)
    );

    function getLiveRivenSubscription() {
        if (data.mediaDetails?.type === "movie") {
            return {
                query: MEDIA_ITEM_STATE_UPDATES_BY_TMDB_SUBSCRIPTION,
                variables: { tmdbId: page.params.id },
                resultKey: "mediaItemStateUpdatesByTmdb" as const
            };
        }

        if (data.mediaDetails?.type === "tv" && data.resolvedTvdbId != null) {
            return {
                query: MEDIA_ITEM_STATE_UPDATES_BY_TVDB_SUBSCRIPTION,
                variables: { tvdbId: data.resolvedTvdbId.toString() },
                resultKey: "mediaItemStateUpdatesByTvdb" as const
            };
        }

        return null;
    }

    function getCompletedDetailsRequest() {
        if (data.mediaDetails?.type === "movie") {
            return {
                query: MEDIA_ITEM_FULL_BY_TMDB_QUERY,
                variables: { tmdbId: page.params.id },
                resultKey: "mediaItemFullByTmdb" as const
            };
        }

        if (data.mediaDetails?.type === "tv" && data.resolvedTvdbId != null) {
            return {
                query: MEDIA_ITEM_FULL_BY_TVDB_QUERY,
                variables: { tvdbId: data.resolvedTvdbId.toString() },
                resultKey: "mediaItemFullByTvdb" as const
            };
        }

        return null;
    }

    function getInitialStateRequest() {
        if (data.mediaDetails?.type === "movie") {
            return {
                query: MEDIA_ITEM_STATE_BY_TMDB_QUERY,
                variables: { tmdbId: page.params.id },
                resultKey: "mediaItemStateByTmdb" as const
            };
        }

        if (data.mediaDetails?.type === "tv" && data.resolvedTvdbId != null) {
            return {
                query: MEDIA_ITEM_STATE_BY_TVDB_QUERY,
                variables: { tvdbId: data.resolvedTvdbId.toString() },
                resultKey: "mediaItemStateByTvdb" as const
            };
        }

        return null;
    }

    function getRawDataRequest() {
        if (data.mediaDetails?.type === "movie") {
            return {
                query: RAW_RIVEN_DATA_BY_TMDB_QUERY,
                variables: { tmdbId: page.params.id },
                resultKey: "mediaItemFullByTmdb" as const
            };
        }

        if (data.mediaDetails?.type === "tv" && data.resolvedTvdbId != null) {
            return {
                query: RAW_RIVEN_DATA_BY_TVDB_QUERY,
                variables: { tvdbId: data.resolvedTvdbId.toString() },
                resultKey: "mediaItemFullByTvdb" as const
            };
        }

        return null;
    }

    // A signature of the currently-completed content. Episode file details
    // (filesystem entries, media metadata) aren't carried by the live state
    // subscription, so they must be fetched separately. We key the fetch on the
    // set of completed episodes so partially-completed shows hydrate the episodes
    // that ARE done, and re-hydrate as more episodes complete — without looping
    // forever when a completed item has no filesystem entry yet.
    function completedDetailsSignature(item: RivenMediaItem | undefined) {
        if (!item) {
            return "";
        }

        if (data.mediaDetails?.type === "movie") {
            return item.state === "Completed" ? `m:${item.id}` : "";
        }

        const keys: string[] = [];
        for (const season of item.seasons ?? []) {
            for (const episode of season.episodes ?? []) {
                if (episode.state === "Completed") {
                    keys.push(`${season.season_number}.${episode.episode_number}`);
                }
            }
        }

        return keys.length ? `t:${item.id}:${keys.join(",")}` : "";
    }

    function needsCompletedDetailsHydration(item: RivenMediaItem | undefined) {
        const signature = completedDetailsSignature(item);
        return signature !== "" && signature !== lastHydratedCompletedKey;
    }

    async function hydrateCompletedDetails() {
        if (completedDetailsHydrating) {
            return;
        }

        const signature = completedDetailsSignature(riven);

        if (!signature || signature === lastHydratedCompletedKey) {
            return;
        }

        const request = getCompletedDetailsRequest();

        if (!request) {
            return;
        }

        completedDetailsHydrating = true;

        try {
            const payload = await gqlClient<{
                mediaItemFullByTmdb?: GqlMediaItemFull | null;
                mediaItemFullByTvdb?: GqlMediaItemFull | null;
            }>(request.query, request.variables);
            const full = mapMediaItemFull(payload[request.resultKey]) ?? undefined;

            if (full) {
                hydratedRiven = full;
            }

            lastHydratedCompletedKey = signature;
        } catch {
            // non-critical, ignore
        } finally {
            completedDetailsHydrating = false;
        }
    }

    async function fetchRawRivenData() {
        if (rawRivenLoading || rawRivenData) {
            return;
        }

        const request = getRawDataRequest();

        if (!request) {
            return;
        }

        rawRivenLoading = true;
        rawRivenError = undefined;

        try {
            const payload = await gqlClient<{
                mediaItemFullByTmdb?: unknown;
                mediaItemFullByTvdb?: unknown;
            }>(request.query, request.variables);
            const raw = payload[request.resultKey];

            if (raw) {
                rawRivenData = raw;
            } else {
                rawRivenError = "No full Riven data was returned for this item.";
            }
        } catch (error) {
            rawRivenError =
                error instanceof Error ? error.message : "Failed to load full Riven data.";
        } finally {
            rawRivenLoading = false;
        }
    }

    function applyLiveState(raw: GqlMediaItemStateTree | null | undefined) {
        const nextState = mapMediaItemStateTree(raw) ?? undefined;

        if (nextState && raw) {
            liveRiven = nextState;
            liveRivenItemId = nextState.id;
            return;
        }

        liveRiven = undefined;
        hydratedRiven = undefined;
        liveRivenItemId = undefined;
        lastHydratedCompletedKey = "";
    }

    async function hydrateInitialState() {
        const request = getInitialStateRequest();

        if (!request) {
            return;
        }

        rivenPending = true;

        try {
            const payload = await gqlClient<{
                mediaItemStateByTmdb?: GqlMediaItemStateTree | null;
                mediaItemStateByTvdb?: GqlMediaItemStateTree | null;
            }>(request.query, request.variables);
            applyLiveState(payload[request.resultKey]);
        } catch {
            // non-critical, ignore
        } finally {
            rivenPending = false;
        }
    }

    $effect(() => {
        if (!browser) {
            return;
        }

        const subscription = getLiveRivenSubscription();

        if (!subscription) {
            rivenPending = false;
            return;
        }

        const unsubscribe = gqlSubscribeClient<{
            mediaItemStateUpdatesByTmdb?: GqlMediaItemStateTree | null;
            mediaItemStateUpdatesByTvdb?: GqlMediaItemStateTree | null;
        }>(subscription.query, subscription.variables, {
            onData: (payload) => {
                applyLiveState(payload[subscription.resultKey]);
                rivenPending = false;
            },
            onError: () => {
                void hydrateInitialState();
            }
        });

        return unsubscribe;
    });

    $effect(() => {
        if (!browser || !needsCompletedDetailsHydration(riven)) {
            return;
        }

        void hydrateCompletedDetails();
    });

    $effect(() => {
        if (!browser || !rawDataOpen) {
            return;
        }

        void fetchRawRivenData();
    });

    // When the current show gets indexed (via background queue or indexShow mutation),
    // hydrate the Riven state so the page reflects the transition without a manual refresh.
    $effect(() => {
        if (!browser || data.mediaDetails?.type !== "tv" || !data.resolvedTvdbId) return;

        const targetTvdbId = data.resolvedTvdbId.toString();

        return gqlSubscribeClient<{ showIndexed: GqlIndexedShow }>(
            SHOW_INDEXED_SUBSCRIPTION,
            undefined,
            {
                onData: (payload) => {
                    const indexed = payload.showIndexed;
                    if (indexed?.tvdbId !== targetTvdbId) return;

                    if (!liveRivenItemId) {
                        liveRivenItemId = indexed.id;
                    }
                    void hydrateInitialState();
                },
                onError: () => {
                    void hydrateInitialState();
                }
            }
        );
    });
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet sectionHeading(title: string)}
    <div class="mb-4 flex items-center gap-3">
        <div class="bg-primary h-6 w-1 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]">
        </div>
        <h2 class="text-foreground text-xl font-bold tracking-tight drop-shadow-md">
            {title}
        </h2>
    </div>
{/snippet}

{#snippet mediaCarousel(
    items: Array<{
        id: number;
        title: string;
        poster_path: string | null;
        media_type: string;
        year?: number | string | null;
    }>,
    title: string,
    delay: number = 600
)}
    <section
        class="mt-8 md:mt-12"
        in:fly|global={{ y: 20, duration: 400, delay, easing: cubicOut }}>
        {@render sectionHeading(title)}
        <Carousel.Root opts={{ dragFree: true, slidesToScroll: "auto" }}>
            <Carousel.Content class="-ml-3">
                {#each items as item (`${item.media_type}-${item.id}`)}
                    <Carousel.Item class="basis-auto pl-3">
                        <a
                            href={mediaHref(item.id, item.media_type)}
                            class="group relative block opacity-80 transition-all duration-300 hover:opacity-100">
                            <PortraitCard
                                title={item.title}
                                subtitle={`${item.media_type === "tv" ? "TV" : "Movie"}${item.year ? ` • ${item.year}` : ""}`}
                                image={item.poster_path}
                                class="w-36 md:w-44 lg:w-48" />
                        </a>
                    </Carousel.Item>
                {/each}
            </Carousel.Content>
        </Carousel.Root>
    </section>
{/snippet}

<svelte:head>
    <title>{data.mediaDetails?.details.title} ({data.mediaDetails?.details.year}) - Riven</title>
</svelte:head>

{#key data.mediaDetails?.details.id}
    <div class="relative flex min-h-screen flex-col overflow-x-hidden">
        {#if data.mediaDetails?.details.backdrop_path}
            <div class="fixed top-0 left-0 z-0 h-screen w-full">
                <img
                    alt=""
                    in:fade={{ duration: 1000, easing: cubicOut }}
                    class="h-full w-full object-cover opacity-30 blur-3xl transition-opacity duration-1000"
                    src={data.mediaDetails?.details.backdrop_path}
                    loading="lazy" />
                <div class="bg-background/80 absolute inset-0 mix-blend-multiply"></div>
                <div
                    class="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/50 to-transparent">
                </div>
                <div
                    class="absolute inset-0 bg-linear-to-b from-zinc-950/20 via-transparent to-transparent">
                </div>
            </div>
        {/if}

        <div class="z-10 mx-auto flex h-full w-full max-w-600 flex-col">
            <!-- Hero Banner - extends behind search bar -->
            {#if data.mediaDetails?.details.backdrop_path || data.mediaDetails?.details.trailer}
                <div class="px-2 md:px-4">
                    <div
                        class={cn(
                            "relative mb-6 flex h-[40vh] max-h-150 min-h-87.5 items-end justify-between overflow-hidden rounded-3xl bg-cover bg-center shadow-2xl transition-all duration-500 md:mb-10",
                            !showTrailer && "p-6 md:p-12"
                        )}
                        style="background-image: url('{data.mediaDetails?.details
                            .backdrop_path}');">
                        <div
                            class="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent">
                        </div>
                        <!-- Border Overlay to prevent bright edge glitch -->
                        <div
                            class="border-border/10 pointer-events-none absolute inset-0 rounded-2xl border">
                        </div>

                        {#if !showTrailer}
                            <div class="relative z-10 flex w-full items-end justify-between">
                                {#if data.mediaDetails?.details.logo}
                                    <img
                                        alt="Logo"
                                        class="max-h-16 max-w-[60%] object-contain drop-shadow-2xl md:max-h-28 lg:max-h-36"
                                        src={data.mediaDetails?.details.logo}
                                        loading="lazy" />
                                {:else}<div></div>{/if}

                                <div class="flex gap-2 md:gap-4">
                                    {#if data.mediaDetails?.details.trailer}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            class="border border-white/10 bg-white/10 px-6 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20"
                                            onclick={() => (showTrailerOverride = !showTrailer)}>
                                            <Play size={14} class="mr-2 fill-current" />Trailer
                                        </Button>
                                    {/if}
                                </div>
                            </div>
                        {:else}
                            <iframe
                                class="absolute inset-0 h-full w-full"
                                src="https://www.youtube-nocookie.com/embed/{data.mediaDetails
                                    ?.details.trailer
                                    ?.key}?autoplay=1&controls=1&mute=0&rel=0&modestbranding=1&playsinline=1"
                                title="Trailer"
                                allow="autoplay"
                                allowfullscreen></iframe>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="bg-background/60 text-foreground hover:bg-background/80 absolute top-4 right-4 z-20"
                                onclick={() => (showTrailerOverride = false)}>
                                <X class="h-6 w-6" />
                            </Button>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Rest of content with padding -->
            <div class="px-8 pb-24 md:px-20 lg:px-24">
                <div class="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
                    <!-- Poster Column -->
                    <div
                        class="hidden lg:mx-0 lg:block"
                        in:fly|global={{ y: 20, duration: 400, delay: 50, easing: cubicOut }}>
                        <PortraitCard
                            title={data.mediaDetails?.details.title ?? ""}
                            image={data.mediaDetails?.details.poster_path ||
                                "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg"}
                            class="group w-48 rounded-xl shadow-2xl lg:w-64"
                            showContent={false} />
                    </div>

                    <!-- Content Column -->
                    <div class="flex flex-col gap-5">
                        <!-- Title + Status Row -->
                        <div
                            class="flex flex-wrap items-center gap-3"
                            in:fly|global={{ y: 20, duration: 400, delay: 100, easing: cubicOut }}>
                            <h1
                                class="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
                                {data.mediaDetails?.details.title}
                            </h1>
                            {#if riven?.state}
                                <StatusBadge
                                    class="px-3 py-1.5 text-sm font-medium"
                                    state={riven.state} />
                            {/if}
                            {#if totalFileCount > 0}
                                <span
                                    class="text-muted-foreground border-border rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums">
                                    {completedFileCount}/{totalFileCount} files
                                </span>
                            {/if}
                        </div>

                        <!-- Actions - Right under title -->
                        <div
                            class="flex flex-wrap items-center gap-2"
                            in:fly|global={{ y: 20, duration: 400, delay: 150, easing: cubicOut }}>
                            {#if data.mediaDetails?.type && data.mediaDetails?.details?.id != null && !riven && !rivenPending}
                                <ItemRequest
                                    size="default"
                                    variant="secondary"
                                    class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary border bg-transparent px-4"
                                    title={data.mediaDetails?.details.title}
                                    ids={[]}
                                    mediaType={data.mediaDetails?.type}
                                    externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                    seasons={seasonData}
                                    onSuccess={handleRequestSuccess}>
                                    <Download class="mr-1.5 h-4 w-4" />
                                    Request
                                </ItemRequest>
                                <ItemManualScrape
                                    size="default"
                                    variant="secondary"
                                    class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                                    title={data.mediaDetails?.details?.title}
                                    itemId={null}
                                    externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                    mediaType={data.mediaDetails?.type ?? "movie"}
                                    seasons={seasonData}>
                                    <Search class="mr-1.5 h-4 w-4" />
                                    Manual Scrape
                                </ItemManualScrape>
                            {/if}
                            {#if riven?.id != null}
                                <ItemAction
                                    kind="reset"
                                    size="default"
                                    variant="secondary"
                                    class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                                    title={data.mediaDetails?.details.title}
                                    ids={rivenId ? [rivenId.toString()] : []}
                                    onSuccess={hydrateInitialState}>
                                    <RotateCcw class="mr-1.5 h-4 w-4" />
                                    Reset
                                </ItemAction>
                                <ItemAction
                                    kind="retry"
                                    size="default"
                                    variant="secondary"
                                    class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                                    title={data.mediaDetails?.details.title}
                                    ids={rivenId ? [rivenId.toString()] : []}
                                    onSuccess={hydrateInitialState}>
                                    <RefreshCw class="mr-1.5 h-4 w-4" />
                                    Retry
                                </ItemAction>

                                {#if data.mediaDetails?.type === "tv"}
                                    <ItemRequest
                                        size="default"
                                        variant="secondary"
                                        class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary border bg-transparent px-4"
                                        title={data.mediaDetails?.details.title}
                                        ids={rivenId ? [rivenId.toString()] : []}
                                        mediaType={data.mediaDetails?.type}
                                        externalId={data.mediaDetails?.details?.id?.toString() ??
                                            ""}
                                        seasons={seasonData}
                                        onSuccess={handleRequestSuccess}>
                                        <Download class="mr-1.5 h-4 w-4" />
                                        Request More
                                    </ItemRequest>
                                {/if}

                                <ItemManualScrape
                                    size="default"
                                    variant="secondary"
                                    class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                                    title={data.mediaDetails?.details?.title}
                                    itemId={rivenId?.toString() ?? null}
                                    externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                    mediaType={data.mediaDetails?.type ?? "movie"}
                                    seasons={seasonData}>
                                    <Search class="mr-1.5 h-4 w-4" />
                                    Manual Scrape
                                </ItemManualScrape>

                                {#if riven.state !== "Completed"}
                                    <ItemAction
                                        kind="pause"
                                        size="default"
                                        variant="secondary"
                                        class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                                        title={data.mediaDetails?.details.title}
                                        isPaused={riven.state === "Paused"}
                                        ids={rivenId ? [rivenId.toString()] : []}>
                                        {#if riven.state === "Paused"}
                                            <Play class="mr-1.5 h-4 w-4" /> Resume
                                        {:else}
                                            <Pause class="mr-1.5 h-4 w-4" /> Pause
                                        {/if}
                                    </ItemAction>
                                {/if}

                                <ItemAction
                                    kind="delete"
                                    size="default"
                                    variant="secondary"
                                    class="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive border bg-transparent px-4"
                                    title={data.mediaDetails?.details.title}
                                    ids={rivenId ? [rivenId.toString()] : []}>
                                    <Trash2 class="mr-1.5 h-4 w-4" />
                                    Delete
                                </ItemAction>

                                <Dialog.Root bind:open={rawDataOpen}>
                                    <Dialog.Trigger>
                                        {#snippet child({ props })}
                                            <Button
                                                variant="secondary"
                                                size="default"
                                                class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                                                {...props}>
                                                <FileJson class="mr-1.5 h-4 w-4" />
                                                Raw Data
                                            </Button>
                                        {/snippet}
                                    </Dialog.Trigger>
                                    <Dialog.Content
                                        class="border-border bg-background w-full max-w-4xl">
                                        <Dialog.Header>
                                            <Dialog.Title>Raw Riven Data</Dialog.Title>
                                        </Dialog.Header>
                                        <div
                                            class="bg-muted/50 max-h-100 overflow-auto rounded-lg p-4">
                                            {#if rawRivenLoading && !rawRivenData}
                                                <p class="text-muted-foreground text-sm">
                                                    Loading full Riven data...
                                                </p>
                                            {:else if rawRivenError}
                                                <p class="text-destructive text-sm">
                                                    {rawRivenError}
                                                </p>
                                            {/if}
                                            {#if rawRivenJson}
                                                <pre
                                                    class="font-mono text-xs break-all whitespace-pre-wrap text-green-400">{rawRivenJson}</pre>
                                            {/if}
                                        </div>
                                        <Button
                                            variant="outline"
                                            disabled={!rawRivenJson}
                                            onclick={() => {
                                                navigator.clipboard.writeText(rawRivenJson);
                                                toast.success("Copied!");
                                            }}>Copy JSON</Button>
                                    </Dialog.Content>
                                </Dialog.Root>
                            {/if}
                        </div>

                        <!-- Metadata -->
                        <div
                            class="text-muted-foreground flex items-center gap-x-2.5 text-sm"
                            in:fly|global={{ y: 20, duration: 400, delay: 200, easing: cubicOut }}>
                            {#each details as detail, i (i)}
                                <span>{detail}</span>
                                {#if i < details.length - 1}<span class="text-border">•</span>{/if}
                            {/each}
                        </div>

                        <!-- Genres -->
                        {#if data.mediaDetails?.details.genres?.length}
                            <div
                                class="flex flex-wrap items-center gap-2"
                                in:fly|global={{
                                    y: 20,
                                    duration: 400,
                                    delay: 250,
                                    easing: cubicOut
                                }}>
                                {#each data.mediaDetails?.details.genres as genre (genre.id)}
                                    <span
                                        class="border-border bg-muted/50 text-muted-foreground rounded-xl border px-3 py-1 text-sm"
                                        >{genre.name}</span>
                                {/each}
                            </div>
                        {/if}

                        <!-- Ratings -->
                        {#if ratingsData?.scores?.length}
                            <div
                                class="flex items-center gap-5"
                                in:fly|global={{
                                    y: 20,
                                    duration: 400,
                                    delay: 300,
                                    easing: cubicOut
                                }}>
                                {#each ratingsData.scores as score (score.name)}
                                    <a
                                        href={score.url}
                                        target="_blank"
                                        rel="external noopener noreferrer"
                                        class="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors">
                                        {#if score.image}<img
                                                src="/rating-logos/{score.image}"
                                                alt={score.name}
                                                class="h-6 w-6 object-contain" />{/if}
                                        <span class="text-base font-semibold">{score.score}</span>
                                    </a>
                                {/each}
                            </div>
                        {:else if ratingsLoading}
                            <div class="flex gap-4">
                                {#each [1, 2, 3] as i (i)}
                                    <div class="bg-muted h-6 w-14 animate-pulse rounded"></div>
                                {/each}
                            </div>
                        {/if}

                        <!-- Description -->
                        <p
                            class="text-muted-foreground max-w-4xl text-base leading-relaxed"
                            in:fly|global={{ y: 20, duration: 400, delay: 350, easing: cubicOut }}>
                            {data.mediaDetails?.details.overview}
                        </p>
                    </div>
                </div>

                {#if data.mediaDetails?.type === "movie"}
                    {@const movieDetails = data.mediaDetails.details}
                    {#if movieDetails.collection}
                        <section
                            class="mt-8 md:mt-12"
                            in:fly|global={{ y: 20, duration: 400, delay: 400, easing: cubicOut }}>
                            {@render sectionHeading("Collection")}
                            <CollectionSheet
                                collectionId={movieDetails.collection.id}
                                collectionName={movieDetails.collection.name}
                                onRequested={handleRequestSuccess}>
                                {#snippet trigger({ props })}
                                    <button
                                        {...props}
                                        class="group border-border/50 relative block min-h-24 w-full overflow-hidden rounded-xl border text-left shadow-lg transition-all duration-300 md:min-h-36">
                                        <!-- Background Layer -->
                                        <div class="absolute inset-0">
                                            <img
                                                alt={movieDetails.collection?.name}
                                                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                src={movieDetails.collection?.backdrop_path}
                                                loading="lazy" />
                                            <div
                                                class="from-background/90 via-background/40 absolute inset-0 bg-linear-to-r to-transparent">
                                            </div>
                                        </div>

                                        <!-- Content Layer -->
                                        <div
                                            class="relative flex flex-col justify-center p-4 md:p-8">
                                            <span
                                                class="text-foreground text-xl font-black drop-shadow-lg md:text-3xl"
                                                >{movieDetails.collection?.name}</span>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                class="border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-3 w-fit border bg-transparent backdrop-blur-md"
                                                >View</Button>
                                        </div>
                                    </button>
                                {/snippet}
                            </CollectionSheet>
                        </section>
                    {/if}
                {/if}

                {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.seasons}
                    <section
                        class="mt-8 md:mt-12"
                        in:fly|global={{ y: 20, duration: 400, delay: 450, easing: cubicOut }}>
                        {@render sectionHeading("Seasons")}
                        <LiveSeasons
                            seasons={data.mediaDetails.details.seasons}
                            {selectedSeason}
                            stateBySeasonNumber={rivenSeasonsByNumber}
                            {episodeCountBySeasonNumber}
                            onSelectSeason={(season) => (selectedSeason = season)} />
                    </section>
                {/if}

                {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.episodes}
                    <section
                        class="mt-8 md:mt-12"
                        in:fly|global={{ y: 20, duration: 400, delay: 500, easing: cubicOut }}>
                        {@render sectionHeading("Episodes")}
                        <LiveEpisodes
                            episodes={data.mediaDetails.details.episodes}
                            {selectedSeason}
                            {selectedEpisode}
                            showTitle={data.mediaDetails.details.title}
                            stateByEpisodeNumber={selectedRivenEpisodesByNumber}
                            detailsByEpisodeNumber={selectedHydratedEpisodesByNumber}
                            {formatSize}
                            onDeleteFilesystemEntry={deleteFilesystemEntry} />
                    </section>
                {/if}

                <!-- Cast -->
                {#if data.mediaDetails?.details.cast?.length}
                    <section
                        class="mt-8 md:mt-12"
                        in:fly|global={{ y: 20, duration: 400, delay: 550, easing: cubicOut }}>
                        {@render sectionHeading("Cast")}
                        <Carousel.Root opts={{ dragFree: true, slidesToScroll: "auto" }}>
                            <Carousel.Content class="-ml-3">
                                {#each data.mediaDetails.details.cast as member, i (i)}
                                    <Carousel.Item class="basis-auto pl-3">
                                        <a
                                            href={entityHref(
                                                member.id,
                                                "person",
                                                member.external_source === "tvdb"
                                                    ? "indexer=tvdb"
                                                    : undefined
                                            )}
                                            class="group relative block opacity-80 transition-all duration-300 hover:opacity-100">
                                            <PortraitCard
                                                title={member.name}
                                                subtitle={member.character}
                                                image={member.profile_path}
                                                class="w-32 md:w-36 lg:w-40" />
                                        </a>
                                    </Carousel.Item>
                                {/each}
                            </Carousel.Content>
                        </Carousel.Root>
                    </section>
                {/if}

                <!-- Details Section - Side by Side -->
                <section
                    class="mt-8 md:mt-12"
                    in:fly|global={{ y: 20, duration: 400, delay: 600, easing: cubicOut }}>
                    <div class="flex max-w-7xl flex-col gap-8 lg:flex-row lg:gap-12">
                        <!-- More Details Column -->
                        <div class="min-w-0 flex-1">
                            {@render sectionHeading("More Details")}
                            <div class="flex flex-col gap-6 text-sm">
                                <!-- Financials Row -->
                                {#if data.mediaDetails?.type === "movie" && (data.mediaDetails?.details.budget || data.mediaDetails?.details.revenue)}
                                    <div class="flex flex-wrap gap-12">
                                        {#if data.mediaDetails.details.budget}
                                            <div class="flex min-w-30 flex-col gap-1">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Budget</span>
                                                <span class="text-foreground font-mono"
                                                    >{formatCurrency(
                                                        data.mediaDetails.details.budget
                                                    )}</span>
                                            </div>
                                        {/if}
                                        {#if data.mediaDetails.details.revenue}
                                            <div class="flex min-w-30 flex-col gap-1">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Revenue</span>
                                                <span class="text-foreground font-mono"
                                                    >{formatCurrency(
                                                        data.mediaDetails.details.revenue
                                                    )}</span>
                                            </div>
                                        {/if}
                                    </div>
                                {/if}

                                <!-- Region & Language Row -->
                                {#if data.mediaDetails?.details.origin_country?.length || data.mediaDetails?.details.spoken_languages?.length}
                                    <div class="flex flex-wrap gap-12">
                                        {#if data.mediaDetails?.details.origin_country?.length}
                                            <div class="flex min-w-30 flex-col gap-1">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Origin</span>
                                                <span class="text-foreground"
                                                    >{data.mediaDetails.details.origin_country.join(
                                                        ", "
                                                    )}</span>
                                            </div>
                                        {/if}
                                        {#if data.mediaDetails?.details.spoken_languages?.length}
                                            <div class="flex min-w-30 flex-col gap-1">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Languages</span>
                                                <span class="text-foreground"
                                                    >{data.mediaDetails.details.spoken_languages
                                                        .map((l) => l.english_name)
                                                        .join(", ")}</span>
                                            </div>
                                        {/if}
                                    </div>
                                {/if}

                                <!-- Production Companies -->
                                {#if data.mediaDetails?.details.production_companies?.length}
                                    <div class="flex flex-col gap-2">
                                        <span
                                            class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                            >Production</span>
                                        <div class="flex flex-wrap gap-2">
                                            {#each data.mediaDetails.details.production_companies as company, i (i)}
                                                <span
                                                    class="text-muted-foreground rounded border border-white/10 bg-white/5 px-2 py-1 text-xs">
                                                    {company.name}
                                                </span>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}

                                <!-- External Links -->
                                {#if data.mediaDetails?.details.homepage || data.mediaDetails?.details.imdb_id || data.mediaDetails?.details.external_ids}
                                    <div class="flex flex-col gap-2">
                                        <span
                                            class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                            >Links</span>
                                        <div class="flex flex-wrap gap-2">
                                            {#if data.mediaDetails?.details.homepage}
                                                <a
                                                    href={data.mediaDetails.details.homepage?.startsWith(
                                                        "http"
                                                    )
                                                        ? data.mediaDetails.details.homepage
                                                        : data.mediaDetails.details.homepage}
                                                    target="_blank"
                                                    rel="external noopener noreferrer"
                                                    class="text-foreground rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
                                                    >Website</a>
                                            {/if}
                                            {#if data.mediaDetails?.details.imdb_id}
                                                <a
                                                    href="https://www.imdb.com/title/{data
                                                        .mediaDetails.details
                                                        .imdb_id}/parentalguide/"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="text-foreground rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
                                                    >Parental Guide</a>
                                            {/if}
                                            {#if data.mediaDetails?.details.external_ids}
                                                {@const validLinks = Object.entries(
                                                    data.mediaDetails.details.external_ids
                                                ).filter(
                                                    ([key, value]) => value && getExternal(key)
                                                )}
                                                {#each validLinks as [key, value] (key)}
                                                    <a
                                                        href={`${getExternal(key).url}${value}`}
                                                        target="_blank"
                                                        rel="external noopener noreferrer"
                                                        class="text-foreground rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
                                                        >{getExternal(key).name}</a>
                                                {/each}
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- File Information Column (movies only) -->
                        {#if riven && data.mediaDetails?.type === "movie" && getMovieEntries().length > 0}
                            {@const allEntries = getMovieEntries()}
                            <div class="min-w-0 flex-1">
                                <div class="mb-4 flex items-center justify-between gap-3">
                                    {@render sectionHeading("File Information")}
                                    {#if allEntries.length > 1}
                                        <select
                                            onchange={(e) => {
                                                selectedMovieVersionIdx = Number(
                                                    e.currentTarget.value
                                                );
                                            }}
                                            class="bg-background border-border text-foreground rounded-md border px-2 py-1 font-mono text-xs">
                                            {#each allEntries as entry, i (i)}
                                                <option
                                                    value={i}
                                                    selected={i === selectedMovieVersionIdx}
                                                    >{getFilesystemEntryLabel(
                                                        entry,
                                                        `Version ${i + 1}`
                                                    )}</option>
                                            {/each}
                                        </select>
                                    {/if}
                                </div>
                                {#key selectedMovieVersionIdx}
                                    {@const fs =
                                        allEntries[
                                            selectedMovieVersionIdx < allEntries.length
                                                ? selectedMovieVersionIdx
                                                : 0
                                        ] ?? allEntries[0]}
                                    {@const meta = fs?.media_metadata ?? riven?.media_metadata}
                                    {@const video = meta?.video}
                                    <div class="flex flex-col gap-6 text-sm">
                                        <!-- Filename -->
                                        {#if meta?.filename || fs?.original_filename}
                                            <div class="flex flex-col gap-1">
                                                <p
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                                                    Filename
                                                </p>
                                                <p
                                                    class="text-foreground font-mono text-xs break-all">
                                                    {meta?.filename ?? fs?.original_filename}
                                                </p>
                                            </div>
                                        {/if}

                                        <!-- Video -->
                                        {#if video}
                                            <div class="flex flex-col gap-2">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Video</span>
                                                <div class="flex flex-wrap gap-2">
                                                    {#if video.resolution_width && video.resolution_height}<Badge
                                                            variant="secondary"
                                                            class="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                                                            >{video.resolution_width}x{video.resolution_height}</Badge
                                                        >{/if}
                                                    {#if video.codec}<Badge
                                                            variant="secondary"
                                                            class="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                                                            >{video.codec}</Badge
                                                        >{/if}
                                                    {#if video.bit_depth}<Badge
                                                            variant="secondary"
                                                            class="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                                                            >{video.bit_depth}-bit</Badge
                                                        >{/if}
                                                    {#if video.hdr_type}<Badge
                                                            variant="secondary"
                                                            class="border border-purple-500/20 bg-purple-500/10 font-mono text-xs text-purple-200 backdrop-blur-sm"
                                                            >{video.hdr_type}</Badge
                                                        >{/if}
                                                    {#if video.frame_rate}<Badge
                                                            variant="secondary"
                                                            class="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                                                            >{video.frame_rate} FPS</Badge
                                                        >{/if}
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Audio -->
                                        {#if meta?.audio_tracks?.length}
                                            <div class="flex flex-col gap-2">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Audio</span>
                                                <div class="flex flex-wrap gap-2">
                                                    {#each meta.audio_tracks as track, i (i)}
                                                        <Badge
                                                            variant="secondary"
                                                            class="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                                                            >{track.codec}{track.channels
                                                                ? track.channels === 8
                                                                    ? " 7.1"
                                                                    : track.channels === 6
                                                                      ? " 5.1"
                                                                      : ` ${track.channels}ch`
                                                                : ""}{track.language
                                                                ? ` (${track.language.toUpperCase()})`
                                                                : ""}</Badge>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Subtitles -->
                                        {#if meta?.subtitle_tracks?.length}
                                            <div class="flex flex-col gap-2">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Subtitles</span>
                                                <div class="flex flex-wrap gap-2">
                                                    {#each meta.subtitle_tracks as track, i (i)}
                                                        <Badge
                                                            variant="secondary"
                                                            class="text-muted-foreground border border-white/10 bg-white/5 text-[10px] backdrop-blur-sm"
                                                            >{track.language
                                                                ? track.language.toUpperCase()
                                                                : "Unknown"}</Badge>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Source -->
                                        {#if meta?.quality_source || meta?.is_remux || meta?.is_proper || meta?.is_repack}
                                            <div class="flex flex-col gap-2">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Source</span>
                                                <div class="flex flex-wrap gap-2">
                                                    {#if meta?.quality_source}<Badge
                                                            variant="secondary"
                                                            class="border border-blue-500/20 bg-blue-500/10 text-xs font-bold text-blue-200 backdrop-blur-sm"
                                                            >{meta.quality_source}</Badge
                                                        >{/if}
                                                    {#if meta?.is_remux}<Badge
                                                            variant="secondary"
                                                            class="border border-amber-500/20 bg-amber-500/10 text-xs font-bold text-amber-200 backdrop-blur-sm"
                                                            >REMUX</Badge
                                                        >{/if}
                                                    {#if meta?.is_proper}<Badge
                                                            variant="secondary"
                                                            class="border border-green-500/20 bg-green-500/10 text-xs font-bold text-green-200 backdrop-blur-sm"
                                                            >PROPER</Badge
                                                        >{/if}
                                                    {#if meta?.is_repack}<Badge
                                                            variant="secondary"
                                                            class="border border-green-500/20 bg-green-500/10 text-xs font-bold text-green-200 backdrop-blur-sm"
                                                            >REPACK</Badge
                                                        >{/if}
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Metrics -->
                                        {#if fs?.file_size || meta?.bitrate || meta?.duration}
                                            <div class="flex flex-col gap-2">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Metrics</span>
                                                <div class="flex flex-wrap gap-4">
                                                    {#if fs?.file_size}
                                                        <div class="flex items-center gap-2">
                                                            <span
                                                                class="text-muted-foreground text-xs"
                                                                >Size</span>
                                                            <span class="text-foreground font-mono"
                                                                >{formatSize(fs.file_size)}</span>
                                                        </div>
                                                    {/if}
                                                    {#if meta?.bitrate}
                                                        <div class="flex items-center gap-2">
                                                            <span
                                                                class="text-muted-foreground text-xs"
                                                                >Bitrate</span>
                                                            <span class="text-foreground font-mono"
                                                                >{Math.round(
                                                                    meta.bitrate / 1000000
                                                                )} Mbps</span>
                                                        </div>
                                                    {/if}
                                                    {#if meta?.duration}
                                                        <div class="flex items-center gap-2">
                                                            <span
                                                                class="text-muted-foreground text-xs"
                                                                >Duration</span>
                                                            <span class="text-foreground font-mono"
                                                                >{Math.floor(meta.duration / 60)}m {meta.duration %
                                                                    60}s</span>
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Container -->
                                        {#if meta?.container_format?.length}
                                            <div class="flex flex-col gap-2">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Container</span>
                                                <div class="flex flex-wrap gap-2">
                                                    {#each meta.container_format as fmt (fmt)}
                                                        <Badge
                                                            variant="secondary"
                                                            class="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                                                            >{fmt}</Badge>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Provider -->
                                        {#if fs?.provider || fs?.plugin}
                                            <div class="flex flex-col gap-2">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Provider</span>
                                                <div class="flex flex-wrap gap-2">
                                                    {#if fs?.provider}<Badge
                                                            variant="secondary"
                                                            class="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                                                            >{fs.provider}</Badge
                                                        >{/if}
                                                    {#if fs?.plugin}<Badge
                                                            variant="secondary"
                                                            class="text-muted-foreground border border-white/10 bg-white/5 font-mono text-xs backdrop-blur-sm"
                                                            >{fs.plugin}</Badge
                                                        >{/if}
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Download (full file to local disk; works for debrid + usenet) -->
                                        {#if fs?.id}
                                            <div class="flex flex-col gap-2">
                                                <span
                                                    class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >Download</span>
                                                <div class="flex flex-wrap gap-2">
                                                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                                                    <a
                                                        href={`/media/${fs.id}`}
                                                        download={fs.original_filename ?? ""}
                                                        rel="external"
                                                        class="text-foreground rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
                                                        >Download</a>
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Delete version -->
                                        {#if allEntries.length > 1 && fs?.id}
                                            <button
                                                type="button"
                                                class="text-destructive/70 hover:text-destructive border-destructive/30 hover:border-destructive/70 mt-2 rounded-md border px-3 py-1.5 text-xs transition-colors"
                                                onclick={() =>
                                                    deleteFilesystemEntry(
                                                        fs!.id!,
                                                        getFilesystemEntryLabel(
                                                            fs,
                                                            `Version ${selectedMovieVersionIdx + 1}`
                                                        )
                                                    )}>
                                                Remove this version
                                            </button>
                                        {/if}
                                    </div>
                                {/key}
                            </div>
                        {/if}
                    </div>
                </section>

                {#if data.mediaDetails?.details.recommendations?.length}{@render mediaCarousel(
                        data.mediaDetails.details.recommendations,
                        "Recommendations",
                        600
                    )}{/if}
                {#if data.mediaDetails?.details.similar?.length}{@render mediaCarousel(
                        data.mediaDetails.details.similar,
                        "Similar",
                        650
                    )}{/if}
                {#if data.mediaDetails?.details.trakt_recommendations?.length}{@render mediaCarousel(
                        data.mediaDetails.details.trakt_recommendations,
                        "More Like This",
                        700
                    )}{/if}
            </div>
        </div>
    </div>
{/key}

<!-- eslint-enable svelte/no-navigation-without-resolve -->
