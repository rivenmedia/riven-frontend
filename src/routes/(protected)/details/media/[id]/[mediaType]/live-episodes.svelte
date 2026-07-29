<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import * as Drawer from "$lib/components/ui/drawer/index.js";
    import * as Sheet from "$lib/components/ui/sheet/index.js";
    import LandscapeCard from "$lib/components/media/landscape-card.svelte";
    import StatusBadge from "$lib/components/media/status-badge.svelte";
    import { IsMobile } from "$lib/hooks/is-mobile.svelte";
    import type { ParsedShowDetails } from "$lib/metadata/parser";
    import type { FilesystemEntry, MediaMetadata, RivenEpisode } from "$lib/types/riven";
    import { untrack } from "svelte";

    interface Props {
        episodes: ParsedShowDetails["episodes"];
        selectedSeason?: string;
        selectedEpisode?: string;
        showTitle?: string | null;
        stateByEpisodeNumber: Map<number, Pick<RivenEpisode, "episode_number" | "state">>;
        detailsByEpisodeNumber: Map<number, RivenEpisode>;
        formatSize: (bytes: number) => string;
        onDeleteFilesystemEntry: (id: number, label: string) => void | Promise<void>;
    }

    let {
        episodes,
        selectedSeason,
        selectedEpisode,
        showTitle,
        stateByEpisodeNumber,
        detailsByEpisodeNumber,
        formatSize,
        onDeleteFilesystemEntry
    }: Props = $props();

    const isMobile = new IsMobile();
    let openEpisodeOverride = $state<number | null | "unset">(untrack(() => "unset"));
    const openEpisodeNumber = $derived.by<number | null>(() => {
        if (openEpisodeOverride !== "unset") return openEpisodeOverride;
        return selectedEpisode ? Number(selectedEpisode) : null;
    });

    const selectedEpisodes = $derived.by(() =>
        episodes.filter((episode) => episode.seasonNumber?.toString() === selectedSeason)
    );

    let selectedVersionIdxByEpisode = $state<Record<number, number>>({});

    function getEpisodeEntries(rivenEpisode: RivenEpisode | undefined): FilesystemEntry[] {
        return rivenEpisode?.filesystem_entries?.length
            ? rivenEpisode.filesystem_entries
            : rivenEpisode?.filesystem_entry
              ? [rivenEpisode.filesystem_entry]
              : [];
    }

    function setEpisodeOpen(episodeNumber: number | null | undefined, open: boolean) {
        if (episodeNumber == null) return;
        openEpisodeOverride = open ? episodeNumber : null;
    }

    function humanizeProfileName(name: string | undefined) {
        if (!name) return null;
        return name
            .split(/[_-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
    }

    function getMetadataResolutionLabel(metadata: MediaMetadata | undefined): string | null {
        const height = metadata?.video?.resolution_height;
        if (!height) return null;
        if (height >= 2160) return "4K";
        if (height >= 1440) return "1440p";
        if (height >= 1080) return "1080p";
        if (height >= 720) return "720p";
        if (height >= 480) return "480p";
        return `${height}p`;
    }

    function getFsLabel(
        entry: FilesystemEntry | undefined,
        episodeNumber: number | null | undefined
    ) {
        const resolutionLabel = getMetadataResolutionLabel(entry?.media_metadata);
        const profileLabel = humanizeProfileName(entry?.ranking_profile_name);
        const fallback = episodeNumber ? `Episode ${episodeNumber}` : "Episode";

        if (resolutionLabel && profileLabel) {
            return `${resolutionLabel} (${profileLabel})`;
        }

        return resolutionLabel ?? profileLabel ?? fallback;
    }
</script>

{#snippet episodeTrigger(
    episode: ParsedShowDetails["episodes"][number],
    rivenEpisode: RivenEpisode | undefined
)}
    <LandscapeCard
        title={episode.name}
        episodeNumber={episode.number ?? undefined}
        image={episode.image}
        overview={episode.overview}
        class="h-full transition-transform duration-300 group-hover:scale-[1.01] group-hover:shadow-lg">
        {#snippet topRight()}
            {#if rivenEpisode?.state}
                <StatusBadge state={rivenEpisode.state} />
            {/if}
        {/snippet}
        {#snippet meta()}
            <span
                class="text-muted-foreground rounded-xl border border-white/10 bg-white/5 px-2 py-0.5 text-sm backdrop-blur-sm"
                >{episode.aired}</span>
            {#if episode.runtime}
                <span
                    class="text-muted-foreground rounded-xl border border-white/10 bg-white/5 px-2 py-0.5 text-sm backdrop-blur-sm"
                    >{episode.runtime} min</span>
            {/if}
        {/snippet}
    </LandscapeCard>
{/snippet}

{#snippet episodeMetadata(
    episode: ParsedShowDetails["episodes"][number],
    rivenEpisode: RivenEpisode | undefined
)}
    <div class="mt-2 flex flex-wrap items-center gap-2">
        <span class="text-muted-foreground font-serif text-sm">{showTitle}</span>
        <span class="text-muted-foreground">•</span>
        {#if episode.aired}
            <Badge variant="outline" class="font-mono text-xs">{episode.aired}</Badge>
        {/if}
        {#if episode.runtime}
            <Badge variant="outline" class="font-mono text-xs">{episode.runtime} min</Badge>
        {/if}
        {#if rivenEpisode}
            <StatusBadge class="text-xs" state={rivenEpisode.state} />
        {/if}
    </div>
{/snippet}

{#snippet fileDetails(
    allEntries: FilesystemEntry[],
    selectedIdx: number,
    fallbackMeta: MediaMetadata | undefined,
    episodeNumber: number | null | undefined,
    onSelectIdx: (idx: number) => void
)}
    {@const fs = allEntries[selectedIdx] ?? allEntries[0]}
    {@const meta = fs?.media_metadata ?? fallbackMeta}
    <div class="flex flex-col gap-6">
        <div class="mb-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <div
                    class="bg-primary h-6 w-1 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                </div>
                <h2 class="text-foreground text-xl font-bold tracking-tight drop-shadow-md">
                    File Details
                </h2>
            </div>
            {#if allEntries.length > 1}
                <select
                    value={selectedIdx}
                    onchange={(e) => onSelectIdx(Number(e.currentTarget.value))}
                    class="bg-background border-border text-foreground rounded-md border px-2 py-1 font-mono text-xs">
                    {#each allEntries as entry, i (i)}
                        <option value={i}>{getFsLabel(entry, episodeNumber)}</option>
                    {/each}
                </select>
            {/if}
        </div>
        <div class="flex flex-col gap-4 text-sm">
            {#if meta?.filename || fs?.original_filename}
                <div>
                    <p
                        class="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
                        Filename
                    </p>
                    <p class="text-muted-foreground mt-1 font-mono text-xs break-all">
                        {meta?.filename ?? fs?.original_filename}
                    </p>
                </div>
            {/if}

            {#if meta?.video}
                <div class="flex flex-col gap-2">
                    <span
                        class="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
                        Video
                    </span>
                    <div class="flex flex-wrap gap-2">
                        {#if meta.video.resolution_width && meta.video.resolution_height}
                            <Badge variant="outline" class="font-mono text-xs">
                                {meta.video.resolution_width}x{meta.video.resolution_height}
                            </Badge>
                        {/if}
                        {#if meta.video.codec}
                            <Badge variant="outline" class="font-mono text-xs"
                                >{meta.video.codec}</Badge>
                        {/if}
                        {#if meta.video.bit_depth}
                            <Badge variant="outline" class="font-mono text-xs">
                                {meta.video.bit_depth}-bit
                            </Badge>
                        {/if}
                        {#if meta.video.hdr_type}
                            <Badge variant="outline" class="font-mono text-xs"
                                >{meta.video.hdr_type}</Badge>
                        {/if}
                        {#if meta.video.frame_rate}
                            <Badge variant="outline" class="font-mono text-xs">
                                {meta.video.frame_rate} FPS
                            </Badge>
                        {/if}
                    </div>
                </div>
            {/if}

            {#if meta?.audio_tracks?.length}
                <div class="flex flex-col gap-2">
                    <span
                        class="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
                        Audio
                    </span>
                    <div class="flex flex-wrap gap-2">
                        {#each meta.audio_tracks as track, i (i)}
                            <Badge variant="outline" class="font-mono text-xs">
                                {track.codec}{track.channels
                                    ? track.channels === 8
                                        ? " 7.1"
                                        : track.channels === 6
                                          ? " 5.1"
                                          : ` ${track.channels}ch`
                                    : ""}{track.language
                                    ? ` (${track.language.toUpperCase()})`
                                    : ""}
                            </Badge>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if meta?.subtitle_tracks?.length}
                <div class="flex flex-col gap-2">
                    <span
                        class="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
                        Subtitles
                    </span>
                    <div class="flex flex-wrap gap-2">
                        {#each meta.subtitle_tracks as track, i (i)}
                            <Badge variant="outline" class="font-mono text-xs">
                                {track.language ? track.language.toUpperCase() : "Unknown"}
                            </Badge>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if meta?.quality_source || meta?.is_remux || meta?.is_proper || meta?.is_repack}
                <div class="flex flex-col gap-2">
                    <span
                        class="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
                        Source
                    </span>
                    <div class="flex flex-wrap gap-2">
                        {#if meta?.quality_source}
                            <Badge variant="outline" class="font-mono text-xs"
                                >{meta.quality_source}</Badge>
                        {/if}
                        {#if meta?.is_remux}
                            <Badge variant="outline" class="font-mono text-xs">REMUX</Badge>
                        {/if}
                        {#if meta?.is_proper}
                            <Badge variant="outline" class="font-mono text-xs">PROPER</Badge>
                        {/if}
                        {#if meta?.is_repack}
                            <Badge variant="outline" class="font-mono text-xs">REPACK</Badge>
                        {/if}
                    </div>
                </div>
            {/if}

            {#if fs?.file_size || meta?.bitrate || meta?.duration}
                <div class="flex flex-col gap-2">
                    <span
                        class="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
                        Metrics
                    </span>
                    <div class="flex flex-wrap gap-4">
                        {#if fs?.file_size}
                            <div class="flex items-center gap-2">
                                <span class="text-muted-foreground text-xs">Size</span>
                                <span class="font-mono text-xs">{formatSize(fs.file_size)}</span>
                            </div>
                        {/if}
                        {#if meta?.bitrate}
                            <div class="flex items-center gap-2">
                                <span class="text-muted-foreground text-xs">Bitrate</span>
                                <span class="font-mono text-xs"
                                    >{Math.round(meta.bitrate / 1000000)} Mbps</span>
                            </div>
                        {/if}
                        {#if meta?.duration}
                            <div class="flex items-center gap-2">
                                <span class="text-muted-foreground text-xs">Duration</span>
                                <span class="font-mono text-xs">
                                    {Math.floor(meta.duration / 60)}m {meta.duration % 60}s
                                </span>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            {#if meta?.container_format?.length}
                <div class="flex flex-col gap-2">
                    <span
                        class="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
                        Container
                    </span>
                    <div class="flex flex-wrap gap-2">
                        {#each meta.container_format as fmt (fmt)}
                            <Badge variant="outline" class="font-mono text-xs">{fmt}</Badge>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if fs?.provider || fs?.plugin}
                <div class="flex flex-col gap-2">
                    <span
                        class="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
                        Provider
                    </span>
                    <div class="flex flex-wrap gap-2">
                        {#if fs?.provider}
                            <Badge variant="outline" class="font-mono text-xs">{fs.provider}</Badge>
                        {/if}
                        {#if fs?.plugin}
                            <Badge variant="outline" class="font-mono text-xs">{fs.plugin}</Badge>
                        {/if}
                    </div>
                </div>
            {/if}

            {#if fs?.id}
                <div class="flex flex-wrap gap-2">
                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                    <a
                        href={`/media/${fs.id}`}
                        download={fs.original_filename ?? ""}
                        rel="external"
                        class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10">
                        Download
                    </a>
                </div>
            {/if}

            {#if fs?.path}
                <div>
                    <p
                        class="text-primary font-mono text-xs font-semibold tracking-wider uppercase">
                        Path
                    </p>
                    <p class="text-muted-foreground mt-1 font-mono text-xs break-all">{fs.path}</p>
                </div>
            {/if}

            {#if fs?.id}
                <button
                    type="button"
                    class="text-destructive/70 hover:text-destructive border-destructive/30 hover:border-destructive/70 mt-2 rounded-md border px-3 py-1.5 text-xs transition-colors"
                    onclick={() => {
                        if (episodeNumber != null) selectedVersionIdxByEpisode[episodeNumber] = 0;
                        onDeleteFilesystemEntry(fs.id!, getFsLabel(fs, episodeNumber));
                    }}>
                    Remove this version
                </button>
            {/if}
        </div>
    </div>
{/snippet}

{#snippet episodeBody(
    episode: ParsedShowDetails["episodes"][number],
    rivenEpisode: RivenEpisode | undefined
)}
    <div class="mt-6 flex flex-1 flex-col gap-8 overflow-y-auto px-6 pb-36">
        {#if episode.overview}
            <p class="text-muted-foreground text-base leading-relaxed">{episode.overview}</p>
        {/if}

        {#if episode.image}
            <div
                class="relative w-full max-w-160 shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10">
                <img
                    alt={episode.name}
                    class="aspect-video w-full object-cover"
                    src={episode.image}
                    loading="lazy" />
            </div>
        {/if}

        {#if getEpisodeEntries(rivenEpisode).length > 0 || rivenEpisode?.media_metadata}
            {@const allEntries = getEpisodeEntries(rivenEpisode)}
            {@const selectedIdx = Math.min(
                selectedVersionIdxByEpisode[episode.number ?? -1] ?? 0,
                Math.max(allEntries.length - 1, 0)
            )}
            {@render fileDetails(
                allEntries,
                selectedIdx,
                rivenEpisode?.media_metadata,
                episode.number,
                (idx) => {
                    if (episode.number != null) selectedVersionIdxByEpisode[episode.number] = idx;
                }
            )}
        {/if}
    </div>
{/snippet}

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
    {#each selectedEpisodes as episode, i (i)}
        {@const rivenEpisode = stateByEpisodeNumber.get(episode.number ?? 0)}
        {@const detailedEpisode = detailsByEpisodeNumber.get(episode.number ?? 0)}

        {#if isMobile.current}
            <Drawer.Root
                direction="bottom"
                open={openEpisodeNumber === episode.number}
                onOpenChange={(open) => setEpisodeOpen(episode.number, open)}>
                <Drawer.Trigger class="group w-full text-left">
                    {@render episodeTrigger(episode, rivenEpisode)}
                </Drawer.Trigger>
                <Drawer.Content class="max-h-[85vh] outline-none">
                    <div class="mx-auto w-full max-w-4xl px-4 pb-6 md:px-6">
                        <Drawer.Header class="px-0 pt-2 pb-0 text-left">
                            <Drawer.Title class="font-heading text-2xl font-bold tracking-tight">
                                S{episode.seasonNumber}E{episode.number} - {episode.name}
                            </Drawer.Title>
                            {@render episodeMetadata(episode, rivenEpisode)}
                        </Drawer.Header>
                        {@render episodeBody(episode, detailedEpisode)}
                    </div>
                </Drawer.Content>
            </Drawer.Root>
        {:else}
            <Sheet.Root
                open={openEpisodeNumber === episode.number}
                onOpenChange={(open: boolean) => setEpisodeOpen(episode.number, open)}>
                <Sheet.Trigger class="group w-full text-left">
                    {@render episodeTrigger(episode, rivenEpisode)}
                </Sheet.Trigger>
                <Sheet.Content
                    side="right"
                    style="width: min(calc(100vw - 1rem), 46rem); max-width: min(calc(100vw - 1rem), 46rem);"
                    class="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[side=right]:data-[state=open]:slide-in-from-right-10 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[side=right]:data-[state=closed]:slide-out-to-right-10 flex h-full w-full max-w-[min(100vw-1rem,46rem)] flex-col overflow-hidden border-l border-white/10 bg-zinc-950/95 backdrop-blur-2xl duration-300 ease-out">
                    <Sheet.Header class="px-6 pt-6">
                        <Sheet.Title class="font-heading text-2xl font-bold tracking-tight">
                            S{episode.seasonNumber}E{episode.number} - {episode.name}
                        </Sheet.Title>
                        {@render episodeMetadata(episode, rivenEpisode)}
                    </Sheet.Header>
                    {@render episodeBody(episode, detailedEpisode)}
                </Sheet.Content>
            </Sheet.Root>
        {/if}
    {/each}
</div>
