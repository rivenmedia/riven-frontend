<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import { type PageProps } from "./$types";
    import Tooltip from "$lib/components/tooltip.svelte";
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as Drawer from "$lib/components/ui/drawer/index.js";
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
    import ItemDelete from "$lib/components/media/riven/item-delete.svelte";
    import ItemPause from "$lib/components/media/riven/item-pause.svelte";
    import ItemReset from "$lib/components/media/riven/item-reset.svelte";
    import ItemRetry from "$lib/components/media/riven/item-retry.svelte";
    import ItemManualScrape from "$lib/components/media/riven/item-manual-scrape.svelte";
    import CollectionSheet from "$lib/components/media/collection-sheet.svelte";
    import LandscapeCard from "$lib/components/media/landscape-card.svelte";
    import StatusBadge from "$lib/components/media/status-badge.svelte";
    import { toast } from "svelte-sonner";

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

    let showTrailerOverride = $state<boolean | null>(null);
    let showTrailer = $derived(
        showTrailerOverride ??
            (!data.mediaDetails?.details.backdrop_path && !!data.mediaDetails?.details.trailer)
    );
    let selectedSeason: string | undefined = $state("1");
    let rivenId = $derived(data.riven?.id ?? data.mediaDetails?.details?.id);
    // For ratings, we need TMDB ID. For TV shows, check external_ids.tmdb first (in case URL has TVDB ID)
    let ratingsId = $derived.by(() => {
        const urlId = Number($page.params.id);
        if (data.mediaDetails?.type === "tv") {
            const tmdbId = (data.mediaDetails?.details as any)?.external_ids?.tmdb;
            if (tmdbId) return Number(tmdbId);
        }
        return urlId || null;
    });
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
        fetch(`/api/ratings/${ratingsId}?type=${mediaType}`, { signal: controller.signal })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!controller.signal.aborted) {
                    ratingsData = d;
                    ratingsLoading = false;
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) ratingsLoading = false;
            });
        return () => controller.abort();
    });

    const getSeasonData = () => {
        if (data.mediaDetails?.type !== "tv" || !data.mediaDetails?.details?.seasons) return [];
        return data.mediaDetails.details.seasons.map((s) => ({
            id: s.id,
            season_number: s.number ?? 0,
            episode_count:
                (data.mediaDetails?.details as any)?.episodes?.filter(
                    (ep: any) => ep.seasonNumber === s.number
                ).length ?? 0,
            name: `Season ${s.number}`,
            status:
                data.riven?.seasons?.find((rs) => rs.season_number === s.number)?.state ===
                "Completed"
                    ? "Available"
                    : undefined
        }));
    };

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }).format(n);
    const formatDuration = (s: number) =>
        `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${Math.floor(s % 60)}s`;
    const formatSize = (b: number) => `${(b / 1073741824).toFixed(2)} GB`;

    const formatSubtitleCodec = (c: string) =>
        c === "subrip" ? "SRT" : c === "hdmv_pgs_subtitle" ? "PGS" : c?.toUpperCase() || "Unknown";
    const details = $derived(
        [
            data.mediaDetails?.details.year,
            data.mediaDetails?.details.formatted_runtime,
            data.mediaDetails?.details.original_language?.toUpperCase(),
            data.mediaDetails?.details.certification,
            data.mediaDetails?.details.status
        ].filter(Boolean)
    );
</script>

{#snippet mediaCarousel(
    items: Array<{
        id: number;
        title: string;
        poster_path: string | null;
        media_type: string;
        year?: number | string | null;
    }>,
    title: string
)}
    <section class="mt-6">
        <h2 class="mb-4 text-xl font-bold tracking-tight drop-shadow-md">{title}</h2>
        <Carousel.Root opts={{ dragFree: true, slidesToScroll: "auto" }}>
            <Carousel.Content class="-ml-4 py-4 pr-4">
                {#each items as item (item.id)}
                    <Carousel.Item class="basis-auto pl-4">
                        <a
                            href="/details/media/{item.id}/{item.media_type}"
                            class="group relative block opacity-80 transition-all duration-300 hover:opacity-100">
                            <PortraitCard
                                title={item.title}
                                subTitle={`${item.media_type === "tv" ? "TV" : "Movie"}${item.year ? ` • ${item.year}` : ""}`}
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

<div class="relative flex min-h-screen flex-col overflow-x-hidden">
    {#if data.mediaDetails?.details.backdrop_path}
        <div class="fixed top-0 left-0 z-0 h-screen w-full">
            <img
                alt=""
                class="h-full w-full object-cover opacity-30 blur-3xl transition-opacity duration-1000"
                src={data.mediaDetails?.details.backdrop_path}
                loading="lazy" />
            <div class="bg-background/80 absolute inset-0 mix-blend-multiply"></div>
            <div
                class="to-background absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent">
            </div>
            <div
                class="to-background absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-transparent to-transparent">
            </div>
        </div>
    {/if}

    <div class="z-10 mt-16 flex h-full w-full flex-col">
        <!-- Hero Banner - full width to match search bar -->
        {#if data.mediaDetails?.details.backdrop_path || data.mediaDetails?.details.trailer}
            <div class="px-2 md:px-4">
                <div
                    class={cn(
                        "relative mb-6 flex h-[35vh] max-h-[500px] min-h-[300px] items-end justify-between overflow-hidden rounded-2xl bg-cover bg-center shadow-2xl transition-all duration-500 md:mb-8 md:max-h-[600px]",
                        !showTrailer && "p-6 md:p-10"
                    )}
                    style="background-image: url('{data.mediaDetails?.details.backdrop_path}');">
                    <div
                        class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
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

                            <div class="flex gap-2">
                                {#if data.riven?.state === "Completed"}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        class="bg-[#e5a00d] font-bold text-black shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-[#cc8e00]">
                                        <img
                                            alt="Plex"
                                            src="https://api.iconify.design/mdi:plex.svg"
                                            class="mr-2 h-4 w-4" />Plex
                                    </Button>
                                {/if}
                                {#if data.mediaDetails?.details.trailer}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        class="bg-muted/40 text-foreground hover:bg-muted/60 font-bold shadow-xl backdrop-blur-md transition-all hover:scale-105"
                                        onclick={() => (showTrailerOverride = !showTrailer)}>
                                        <Play size={16} class="mr-2 fill-current" />Trailer
                                    </Button>
                                {/if}
                            </div>
                        </div>
                    {:else}
                        <iframe
                            class="absolute inset-0 h-full w-full"
                            src="https://www.youtube-nocookie.com/embed/{data.mediaDetails?.details
                                .trailer
                                ?.key}?autoplay=1&controls=1&mute=0&rel=0&modestbranding=1&playsinline=1"
                            title="Trailer"
                            allow="autoplay"
                            allowfullscreen></iframe>
                        <Button
                            variant="ghost"
                            size="icon"
                            class="absolute top-4 right-4 z-20 bg-black/50 text-white hover:bg-black/70"
                            onclick={() => (showTrailerOverride = false)}>
                            <div class="i-lucide-x h-6 w-6"></div>
                        </Button>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Rest of content with padding -->
        <div class="px-4 md:px-8 lg:px-12">
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
                <!-- Poster Column -->
                <div class="hidden lg:mx-0 lg:block">
                    <PortraitCard
                        title={data.mediaDetails?.details.title ?? ""}
                        image={data.mediaDetails?.details.poster_path ||
                            "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg"}
                        class="group w-48 rounded-xl shadow-2xl lg:w-64"
                        showContent={false} />
                </div>

                <!-- Content Column -->
                <div class="flex flex-col gap-3">
                    <!-- Title + Status Row -->
                    <div class="flex flex-wrap items-center gap-3">
                        <h1
                            class="text-2xl font-black tracking-tight text-white drop-shadow-md sm:text-3xl lg:text-4xl">
                            {data.mediaDetails?.details.title}
                        </h1>
                        {#if data.riven?.state}
                            <StatusBadge
                                class="px-2.5 py-1 text-xs font-medium"
                                state={data.riven.state} />
                        {/if}
                    </div>

                    <!-- Actions - Right under title -->
                    <div class="flex flex-wrap items-center gap-2">
                        {#if !data.riven && data.mediaDetails?.type && data.mediaDetails?.details?.id != null}
                            <ItemRequest
                                size="default"
                                class="bg-primary hover:bg-primary/90 px-4 font-bold shadow-md"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}
                                mediaType={data.mediaDetails?.type}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                seasons={getSeasonData()} />
                            <ItemManualScrape
                                size="default"
                                variant="secondary"
                                class="border border-white/20 bg-transparent px-4 text-white/70 hover:bg-white/10 hover:text-white"
                                title={data.mediaDetails?.details?.title}
                                itemId={null}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                mediaType={data.mediaDetails?.type}
                                seasons={getSeasonData()}>
                                <Search class="mr-1.5 h-4 w-4" />
                                Manual Scrape
                            </ItemManualScrape>
                        {:else if data.riven?.id != null}
                            <ItemReset
                                size="default"
                                variant="secondary"
                                class="border border-white/20 bg-transparent px-4 text-white/70 hover:bg-white/10 hover:text-white"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}>
                                <RotateCcw class="mr-1.5 h-4 w-4" />
                                Reset
                            </ItemReset>
                            <ItemRetry
                                size="default"
                                variant="secondary"
                                class="border border-white/20 bg-transparent px-4 text-white/70 hover:bg-white/10 hover:text-white"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}>
                                <RefreshCw class="mr-1.5 h-4 w-4" />
                                Retry
                            </ItemRetry>

                            {#if data.mediaDetails?.type === "tv"}
                                <ItemRequest
                                    size="default"
                                    variant="secondary"
                                    class="border border-white/20 bg-transparent px-4 text-white/70 hover:bg-white/10 hover:text-white"
                                    title={data.mediaDetails?.details.title}
                                    ids={rivenId ? [rivenId.toString()] : []}
                                    mediaType={data.mediaDetails?.type}
                                    externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                    seasons={getSeasonData()}>
                                    <Download class="mr-1.5 h-4 w-4" />
                                    Request More
                                </ItemRequest>
                            {/if}

                            <ItemManualScrape
                                size="default"
                                variant="secondary"
                                class="border border-white/20 bg-transparent px-4 text-white/70 hover:bg-white/10 hover:text-white"
                                title={data.mediaDetails?.details?.title}
                                itemId={rivenId?.toString() ?? null}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                mediaType={data.mediaDetails?.type}
                                seasons={getSeasonData()}>
                                <Search class="mr-1.5 h-4 w-4" />
                                Manual Scrape
                            </ItemManualScrape>

                            {#if data.riven.state !== "Completed"}
                                <ItemPause
                                    size="default"
                                    variant="secondary"
                                    class="border border-white/20 bg-transparent px-4 text-white/70 hover:bg-white/10 hover:text-white"
                                    title={data.mediaDetails?.details.title}
                                    isPaused={data.riven.state === "Paused"}
                                    ids={rivenId ? [rivenId.toString()] : []}>
                                    {#if data.riven.state === "Paused"}
                                        <Play class="mr-1.5 h-4 w-4" /> Resume
                                    {:else}
                                        <Pause class="mr-1.5 h-4 w-4" /> Pause
                                    {/if}
                                </ItemPause>
                            {/if}

                            <ItemDelete
                                size="default"
                                variant="secondary"
                                class="border border-red-500/30 bg-transparent px-4 text-red-400/80 hover:bg-red-500/10 hover:text-red-300"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}>
                                <Trash2 class="mr-1.5 h-4 w-4" />
                                Delete
                            </ItemDelete>

                            <Dialog.Root>
                                <Dialog.Trigger>
                                    {#snippet child({ props })}
                                        <Button
                                            variant="secondary"
                                            size="default"
                                            class="border border-white/20 bg-transparent px-4 text-white/70 hover:bg-white/10 hover:text-white"
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
                                    <div class="bg-muted/50 max-h-100 overflow-auto rounded-lg p-4">
                                        <pre
                                            class="font-mono text-xs break-all whitespace-pre-wrap text-green-400">{JSON.stringify(
                                                data.riven,
                                                null,
                                                2
                                            )}</pre>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onclick={() => {
                                            navigator.clipboard.writeText(
                                                JSON.stringify(data.riven, null, 2)
                                            );
                                            toast.success("Copied!");
                                        }}>Copy JSON</Button>
                                </Dialog.Content>
                            </Dialog.Root>
                        {/if}
                    </div>

                    <!-- Metadata -->
                    <div class="flex items-center gap-x-2 text-sm text-white/50">
                        {#each details as detail, i}
                            <span>{detail}</span>
                            {#if i < details.length - 1}<span class="text-white/20">•</span>{/if}
                        {/each}
                    </div>

                    <!-- Genres -->
                    {#if data.mediaDetails?.details.genres?.length}
                        <div class="flex flex-wrap items-center gap-2">
                            {#each data.mediaDetails?.details.genres.slice(0, 4) as genre (genre.id)}
                                <span
                                    class="rounded-full border border-white/30 px-3 py-1 text-sm text-white/80"
                                    >{genre.name}</span>
                            {/each}
                        </div>
                    {/if}

                    <!-- Ratings -->
                    {#if ratingsData?.scores?.length}
                        <div class="flex items-center gap-4">
                            {#each ratingsData.scores as score (score.name)}
                                <a
                                    href={score.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center gap-1.5 text-white/80 transition-colors hover:text-white">
                                    {#if score.image}<img
                                            src="/rating-logos/{score.image}"
                                            alt={score.name}
                                            class="h-5 w-5 object-contain" />{/if}
                                    <span class="text-sm font-semibold">{score.score}</span>
                                </a>
                            {/each}
                        </div>
                    {:else if ratingsLoading}
                        <div class="flex gap-3">
                            {#each [1, 2, 3] as _}
                                <div class="h-5 w-12 animate-pulse rounded bg-white/10"></div>
                            {/each}
                        </div>
                    {/if}

                    <!-- Description -->
                    <p class="max-w-2xl text-sm leading-relaxed text-white/60">
                        {data.mediaDetails?.details.overview}
                    </p>

                    <!-- Top Cast -->
                    {#if data.mediaDetails?.details.cast?.length}
                        <div class="flex flex-col gap-2">
                            <span class="text-xs font-medium tracking-wide text-white/50 uppercase"
                                >Top Cast</span>
                            <div class="flex flex-wrap gap-3">
                                {#each data.mediaDetails?.details.cast.slice(0, 6) as cast (cast.id)}
                                    <a
                                        href="/details/person/{cast.id}"
                                        class="group flex items-center gap-2 transition-colors hover:text-white">
                                        <Tooltip>
                                            {#snippet trigger()}
                                                <div
                                                    class="size-9 overflow-hidden rounded-full ring-2 ring-white/20 transition-all group-hover:ring-white/40 md:size-10">
                                                    <img
                                                        alt={cast.name}
                                                        class="h-full w-full object-cover"
                                                        src={cast.profile_path ||
                                                            "https://i.pravatar.cc/200"}
                                                        loading="lazy" />
                                                </div>
                                            {/snippet}
                                            {#snippet content()}
                                                <p class="text-sm font-medium">
                                                    {cast.name} as {cast.character}
                                                </p>
                                            {/snippet}
                                        </Tooltip>
                                        <span
                                            class="text-xs text-white/70 group-hover:text-white md:text-sm"
                                            >{cast.name}</span>
                                    </a>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            {#if data.mediaDetails?.type === "movie"}
                {@const movieDetails = data.mediaDetails.details}
                {#if movieDetails.collection}
                    <section class="mt-8 md:mt-12">
                        <h2 class="mb-3 text-lg font-bold drop-shadow-md">Collection</h2>
                        <CollectionSheet
                            collectionId={movieDetails.collection.id}
                            collectionName={movieDetails.collection.name}>
                            {#snippet trigger({ props })}
                                <button
                                    {...props}
                                    class="group relative block w-full overflow-hidden rounded-xl text-left shadow-lg transition-all duration-300">
                                    <div
                                        class="pointer-events-none absolute inset-0 z-50 rounded-xl border border-white/10 transition-colors duration-300 group-hover:border-white/30">
                                    </div>
                                    <img
                                        alt={movieDetails.collection.name}
                                        class="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-44"
                                        src={movieDetails.collection.backdrop_path}
                                        loading="lazy" />
                                    <div
                                        class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent">
                                    </div>
                                    <div
                                        class="absolute inset-0 flex flex-col justify-center p-5 md:p-8">
                                        <span
                                            class="text-primary mb-1 text-[10px] font-bold tracking-widest uppercase"
                                            >Collection</span>
                                        <span
                                            class="text-xl font-black text-white drop-shadow-lg md:text-3xl"
                                            >{movieDetails.collection.name}</span>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            class="mt-3 w-fit backdrop-blur-md"
                                            >View Collection</Button>
                                    </div>
                                </button>
                            {/snippet}
                        </CollectionSheet>
                    </section>
                {/if}
            {/if}

            {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.seasons}
                <section class="mt-6">
                    <h2 class="mb-3 text-lg font-bold drop-shadow-md">Seasons</h2>
                    <Carousel.Root opts={{ dragFree: true, slidesToScroll: "auto" }}>
                        <Carousel.Content>
                            {#each data.mediaDetails?.details.seasons as season (season.id)}
                                {@const rivenSeason = data.riven?.seasons?.find(
                                    (s) => s.season_number === season.number
                                )}
                                <Carousel.Item class="basis-auto">
                                    <button
                                        onclick={() => (selectedSeason = season.number?.toString())}
                                        class={cn(
                                            "group relative block transition-all",
                                            selectedSeason === season.number?.toString()
                                                ? ""
                                                : "opacity-60 hover:opacity-90"
                                        )}>
                                        <PortraitCard
                                            title={season.number === 0
                                                ? "Specials"
                                                : `Season ${season.number}`}
                                            image={season.image}
                                            selected={selectedSeason === season.number?.toString()}
                                            class="w-36 md:w-44 lg:w-48">
                                            {#snippet topRight()}
                                                {#if rivenSeason?.state}
                                                    <StatusBadge state={rivenSeason.state} />
                                                {/if}
                                            {/snippet}
                                        </PortraitCard>
                                    </button>
                                </Carousel.Item>
                            {/each}
                        </Carousel.Content>
                    </Carousel.Root>
                </section>
            {/if}

            {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.episodes}
                <section class="mt-6">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">Episodes</h2>
                    <div
                        class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
                        {#each data.mediaDetails?.details.episodes.filter((ep) => ep.seasonNumber?.toString() === selectedSeason) as episode (episode.id)}
                            {@const rivenSeason = data.riven?.seasons?.find(
                                (s) => s.season_number === Number(selectedSeason)
                            )}
                            {@const rivenEpisode = rivenSeason?.episodes?.find(
                                (e) => e.episode_number === episode.number
                            )}
                            <Drawer.Root direction="bottom">
                                <Drawer.Trigger class="w-full text-left">
                                    <LandscapeCard
                                        title={episode.name}
                                        episodeNumber={episode.number ?? undefined}
                                        image={episode.image}
                                        overview={episode.overview}
                                        class="h-full">
                                        {#snippet topRight()}
                                            {#if rivenEpisode?.state}
                                                <StatusBadge state={rivenEpisode.state} />
                                            {/if}
                                        {/snippet}
                                        {#snippet meta()}
                                            <span
                                                class="border-border/10 bg-muted/30 text-muted-foreground rounded-full border px-2 py-0.5 text-xs"
                                                >{episode.aired}</span>
                                            {#if episode.runtime}
                                                <span
                                                    class="border-border/10 bg-muted/30 text-muted-foreground rounded-full border px-2 py-0.5 text-xs"
                                                    >{episode.runtime} min</span>
                                            {/if}
                                        {/snippet}
                                    </LandscapeCard>
                                </Drawer.Trigger>
                                <Drawer.Content class="max-h-[80vh] md:max-h-[60vh]">
                                    <div class="mx-auto w-full max-w-4xl px-4 pb-6 md:px-6">
                                        <Drawer.Header class="px-0 pt-2 pb-3">
                                            <Drawer.Title class="text-lg font-bold"
                                                >S{episode.seasonNumber}E{episode.number} - {episode.name}</Drawer.Title>
                                            <div class="mt-1 flex flex-wrap items-center gap-2">
                                                <span class="text-muted-foreground text-sm"
                                                    >{data.mediaDetails?.details.title}</span
                                                ><span class="text-muted-foreground">•</span>
                                                {#if episode.aired}<Badge
                                                        variant="outline"
                                                        class="text-xs">{episode.aired}</Badge
                                                    >{/if}
                                                {#if episode.runtime}<Badge
                                                        variant="outline"
                                                        class="text-xs">{episode.runtime} min</Badge
                                                    >{/if}
                                                {#if rivenEpisode}<StatusBadge
                                                        class="text-xs"
                                                        state={rivenEpisode.state} />{/if}
                                            </div>
                                            {#if episode.overview}<p
                                                    class="text-muted-foreground mt-2 text-sm">
                                                    {episode.overview}
                                                </p>{/if}
                                        </Drawer.Header>
                                        <div class="flex flex-col gap-4 md:flex-row md:gap-6">
                                            {#if episode.image}<div
                                                    class="shrink-0 overflow-hidden rounded-lg md:w-80">
                                                    <img
                                                        alt={episode.name}
                                                        class="aspect-video w-full rounded-lg object-cover"
                                                        src={episode.image}
                                                        loading="lazy" />
                                                </div>{/if}
                                            {#if rivenEpisode?.filesystem_entry || rivenEpisode?.media_metadata}
                                                {@const meta = rivenEpisode.media_metadata}
                                                {@const fs = rivenEpisode.filesystem_entry}
                                                {@const video = meta?.video}
                                                <div class="flex flex-1 flex-col">
                                                    {#if meta?.original_filename || fs?.original_filename || meta?.filename}
                                                        <div class="mb-3 space-y-2 text-xs">
                                                            {#if meta?.original_filename || fs?.original_filename}<p
                                                                    class="text-primary font-semibold">
                                                                    Original Filename
                                                                </p>
                                                                <p
                                                                    class="text-muted-foreground break-all">
                                                                    {meta?.original_filename ||
                                                                        fs?.original_filename}
                                                                </p>{/if}
                                                            {#if meta?.filename}<p
                                                                    class="text-primary font-semibold">
                                                                    Current Filename
                                                                </p>
                                                                <p
                                                                    class="text-muted-foreground break-all">
                                                                    {meta.filename}
                                                                </p>{/if}
                                                        </div>
                                                    {/if}
                                                    <div
                                                        class="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                                                        {#if video}
                                                            <div class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Video</span>
                                                                {#if video.resolution_width && video.resolution_height}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >{video.resolution_width}x{video.resolution_height}</Badge
                                                                    >{/if}
                                                                {#if video.codec}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >{video.codec}</Badge
                                                                    >{/if}
                                                                {#if video.bit_depth}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >{video.bit_depth}-bit</Badge
                                                                    >{/if}
                                                                {#if video.hdr_type}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >{video.hdr_type}</Badge
                                                                    >{/if}
                                                                {#if video.frame_rate}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >{video.frame_rate} FPS</Badge
                                                                    >{/if}
                                                            </div>
                                                        {/if}
                                                        {#if meta?.bitrate}<div
                                                                class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Bitrate</span
                                                                ><Badge
                                                                    variant="outline"
                                                                    class="text-xs"
                                                                    >{Math.round(
                                                                        meta.bitrate / 1000000
                                                                    )} Mbps</Badge>
                                                            </div>{/if}
                                                        {#if meta?.audio_tracks?.length}<div
                                                                class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Audio</span
                                                                >{#each meta.audio_tracks.slice(0, 2) as a}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >{a.codec}{a.channels
                                                                            ? ` ${a.channels}ch`
                                                                            : ""}{a.language
                                                                            ? ` (${a.language.toUpperCase()})`
                                                                            : ""}</Badge
                                                                    >{/each}{#if meta.audio_tracks.length > 2}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >+{meta.audio_tracks
                                                                            .length - 2}</Badge
                                                                    >{/if}
                                                            </div>{/if}
                                                        {#if meta?.subtitle_tracks?.length}<div
                                                                class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Subtitles</span
                                                                >{#each meta.subtitle_tracks.slice(0, 3) as s}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >{formatSubtitleCodec(
                                                                            s.codec || ""
                                                                        )}{s.language
                                                                            ? ` (${s.language.toUpperCase()})`
                                                                            : ""}</Badge
                                                                    >{/each}{#if meta.subtitle_tracks.length > 3}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >+{meta.subtitle_tracks
                                                                            .length - 3}</Badge
                                                                    >{/if}
                                                            </div>{/if}
                                                        {#if meta?.quality_source || meta?.container_format?.length || meta?.is_remux || meta?.is_proper || meta?.is_repack}
                                                            <div class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Source</span>
                                                                {#if meta?.quality_source}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >{meta.quality_source}</Badge
                                                                    >{/if}
                                                                {#each meta?.container_format ?? [] as c}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >{c.toUpperCase()}</Badge
                                                                    >{/each}
                                                                {#if meta?.is_remux}<Badge
                                                                        variant="outline"
                                                                        class="text-xs">REMUX</Badge
                                                                    >{/if}
                                                                {#if meta?.is_proper}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >PROPER</Badge
                                                                    >{/if}
                                                                {#if meta?.is_repack}<Badge
                                                                        variant="outline"
                                                                        class="text-xs"
                                                                        >REPACK</Badge
                                                                    >{/if}
                                                            </div>
                                                        {/if}
                                                        {#if fs?.file_size}<div
                                                                class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Size</span
                                                                ><span class="text-muted-foreground"
                                                                    >{formatSize(
                                                                        fs.file_size
                                                                    )}</span>
                                                            </div>{/if}
                                                        {#if meta?.duration}<div
                                                                class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Duration</span
                                                                ><span class="text-muted-foreground"
                                                                    >{formatDuration(
                                                                        meta.duration
                                                                    )}</span>
                                                            </div>{/if}
                                                    </div>
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </Drawer.Content>
                            </Drawer.Root>
                        {/each}
                    </div>
                </section>
            {/if}

            <section class="mt-6">
                <h2 class="mb-4 text-lg font-bold drop-shadow-md">More Details</h2>
                <div class="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
                    {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.budget}
                        <div
                            class="bg-muted/20 hover:bg-muted/30 flex flex-col gap-1 rounded-lg p-4">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                Budget
                            </p>
                            <p class="text-sm font-semibold">
                                {formatCurrency(data.mediaDetails.details.budget)}
                            </p>
                        </div>
                    {/if}
                    {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.revenue}
                        <div
                            class="bg-muted/20 hover:bg-muted/30 flex flex-col gap-1 rounded-lg p-4">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                Revenue
                            </p>
                            <p class="text-sm font-semibold">
                                {formatCurrency(data.mediaDetails.details.revenue)}
                            </p>
                        </div>
                    {/if}
                    {#if data.mediaDetails?.details.homepage}
                        <div
                            class="bg-muted/20 hover:bg-muted/30 flex flex-col gap-1 rounded-lg p-4">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                Homepage
                            </p>
                            <a
                                href={data.mediaDetails.details.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-primary text-sm font-semibold hover:underline"
                                >Visit Website</a>
                        </div>
                    {/if}
                    {#if data.mediaDetails?.details.origin_country?.length}
                        <div
                            class="bg-muted/20 hover:bg-muted/30 flex flex-col gap-1 rounded-lg p-4">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                Origin Country
                            </p>
                            <p class="text-sm font-semibold">
                                {data.mediaDetails.details.origin_country.join(", ")}
                            </p>
                        </div>
                    {/if}
                    {#if data.mediaDetails?.type === "movie" && (data.mediaDetails.details as any).collection}
                        {@const collection = (data.mediaDetails.details as any).collection}
                        <CollectionSheet
                            collectionId={collection.id}
                            collectionName={collection.name}>
                            {#snippet trigger({ props })}
                                <button
                                    class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex w-full flex-col gap-1 rounded-lg border p-4 text-left backdrop-blur-md transition-colors"
                                    {...props}>
                                    <p class="text-muted-foreground text-xs font-medium uppercase">
                                        Collection
                                    </p>
                                    <p class="line-clamp-1 text-sm font-semibold">
                                        {collection.name}
                                    </p>
                                </button>
                            {/snippet}
                        </CollectionSheet>
                    {/if}
                    {#if data.mediaDetails?.details.production_companies?.length}
                        <div
                            class="bg-muted/20 hover:bg-muted/30 flex flex-col gap-1 rounded-lg p-4">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                Production
                            </p>
                            {#if data.mediaDetails?.type === "movie"}
                                <div class="flex flex-wrap gap-2">
                                    {#each data.mediaDetails.details.production_companies as company (company.id)}
                                        <Tooltip>
                                            {#snippet trigger()}<img
                                                    alt={company.name}
                                                    class="h-6 w-auto rounded object-contain opacity-80 hover:scale-105 hover:opacity-100"
                                                    src={company.logo_path ||
                                                        "https://i.pravatar.cc/200"}
                                                    loading="lazy" />{/snippet}
                                            {#snippet content()}<p class="text-sm font-medium">
                                                    {company.name}
                                                </p>{/snippet}
                                        </Tooltip>
                                    {/each}
                                </div>
                            {:else}<p class="text-sm font-semibold">
                                    {data.mediaDetails?.details.production_companies
                                        .map((c) => c.name)
                                        .join(", ")}
                                </p>{/if}
                        </div>
                    {/if}
                    {#if data.mediaDetails?.details.spoken_languages?.length}
                        <div
                            class="bg-muted/20 hover:bg-muted/30 flex flex-col gap-1 rounded-lg p-4">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                Languages
                            </p>
                            <p class="text-sm font-semibold">
                                {data.mediaDetails.details.spoken_languages
                                    .map((l) => l.english_name)
                                    .join(", ")}
                            </p>
                        </div>
                    {/if}
                    {#if data.mediaDetails?.details.external_ids}
                        <div
                            class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                External Links
                            </p>
                            <div class="flex flex-wrap gap-2">
                                {#each Object.entries(data.mediaDetails.details.external_ids) as [key, value]}
                                    {#if value && getExternal(key)}<a
                                            href="{getExternal(key).url}{value}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="text-primary text-sm font-semibold hover:underline"
                                            >{getExternal(key).name}</a
                                        >{/if}
                                {/each}
                            </div>
                        </div>
                    {/if}
                    {#if data.mediaDetails?.details.imdb_id}
                        <div
                            class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                Parental Guide
                            </p>
                            <a
                                href="https://www.imdb.com/title/{data.mediaDetails.details
                                    .imdb_id}/parentalguide/"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-primary text-sm font-semibold hover:underline"
                                >IMDB Parental Guide</a>
                        </div>
                    {/if}
                </div>
            </section>

            {#if data.riven && data.mediaDetails?.type === "movie" && data.riven.media_metadata}
                {@const meta = data.riven.media_metadata}
                {@const fs = data.riven.filesystem_entry}
                {@const video = meta?.video}
                <section class="mt-6">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">File Information</h2>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
                        {#if meta?.original_filename || fs?.original_filename}
                            <div
                                class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md">
                                <p class="text-muted-foreground text-xs font-medium uppercase">
                                    Original Filename
                                </p>
                                <p class="text-sm font-semibold break-all">
                                    {meta?.original_filename || fs?.original_filename}
                                </p>
                            </div>
                        {/if}
                        {#if meta?.filename}
                            <div
                                class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md">
                                <p class="text-muted-foreground text-xs font-medium uppercase">
                                    Current Filename
                                </p>
                                <p class="text-sm font-semibold break-all">{meta.filename}</p>
                            </div>
                        {/if}
                        <div
                            class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md">
                            <p class="text-muted-foreground text-xs font-medium uppercase">Video</p>
                            <div class="flex flex-wrap gap-1.5">
                                {#if video?.resolution_width && video?.resolution_height}<Badge
                                        variant="outline"
                                        class="text-xs"
                                        >{video.resolution_width}x{video.resolution_height}</Badge
                                    >{/if}
                                {#if video?.codec}<Badge variant="outline" class="text-xs"
                                        >{video.codec.toUpperCase()}</Badge
                                    >{/if}
                                {#if video?.bit_depth}<Badge variant="outline" class="text-xs"
                                        >{video.bit_depth}-bit</Badge
                                    >{/if}
                                {#if video?.hdr_type}<Badge variant="outline" class="text-xs"
                                        >{video.hdr_type}</Badge
                                    >{/if}
                                {#if meta?.bitrate}<Badge variant="outline" class="text-xs"
                                        >{Math.round(meta.bitrate / 1000000)} Mbps</Badge
                                    >{/if}
                                {#if video?.frame_rate}<Badge variant="outline" class="text-xs"
                                        >{video.frame_rate} FPS</Badge
                                    >{/if}
                            </div>
                        </div>
                        {#if meta?.audio_tracks?.length}
                            <div
                                class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md">
                                <p class="text-muted-foreground text-xs font-medium uppercase">
                                    Audio
                                </p>
                                <div class="flex flex-wrap gap-1.5">
                                    {#each meta.audio_tracks as a}<Badge
                                            variant="outline"
                                            class="text-xs"
                                            >{a.codec}{a.channels
                                                ? a.channels === 8
                                                    ? " 7.1"
                                                    : a.channels === 6
                                                      ? " 5.1"
                                                      : ` ${a.channels}ch`
                                                : ""}{a.language
                                                ? ` (${a.language.toUpperCase()})`
                                                : ""}</Badge
                                        >{/each}
                                </div>
                            </div>
                        {/if}
                        {#if meta?.subtitle_tracks?.length}
                            <div
                                class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md">
                                <p class="text-muted-foreground text-xs font-medium uppercase">
                                    Subtitles
                                </p>
                                <div class="flex flex-wrap gap-1.5">
                                    {#each meta.subtitle_tracks as s}<Badge
                                            variant="outline"
                                            class="text-xs"
                                            >{formatSubtitleCodec(s.codec || "")}{s.language
                                                ? ` (${s.language.toUpperCase()})`
                                                : ""}</Badge
                                        >{/each}
                                </div>
                            </div>
                        {/if}
                        <div
                            class="bg-muted/20 hover:bg-muted/30 flex flex-col gap-1 rounded-lg p-4">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                Source
                            </p>
                            <div class="flex flex-wrap gap-1.5">
                                {#if meta?.quality_source}<Badge variant="outline" class="text-xs"
                                        >{meta.quality_source}</Badge
                                    >{/if}
                                {#each meta?.container_format ?? [] as c}<Badge
                                        variant="outline"
                                        class="text-xs">{c.toUpperCase()}</Badge
                                    >{/each}
                                {#if meta?.is_remux}<Badge variant="outline" class="text-xs"
                                        >REMUX</Badge
                                    >{/if}
                                {#if meta?.is_proper}<Badge variant="outline" class="text-xs"
                                        >PROPER</Badge
                                    >{/if}
                                {#if meta?.is_repack}<Badge variant="outline" class="text-xs"
                                        >REPACK</Badge
                                    >{/if}
                            </div>
                        </div>
                        {#if fs?.file_size}
                            <div
                                class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md">
                                <p class="text-muted-foreground text-xs font-medium uppercase">
                                    File Size
                                </p>
                                <p class="text-sm font-semibold">{formatSize(fs.file_size)}</p>
                            </div>
                        {/if}
                        {#if meta?.duration}
                            <div
                                class="border-border/10 bg-card/40 hover:border-border/20 hover:bg-card/60 flex flex-col gap-1 rounded-lg border p-4 backdrop-blur-md">
                                <p class="text-muted-foreground text-xs font-medium uppercase">
                                    Duration
                                </p>
                                <p class="text-sm font-semibold">{formatDuration(meta.duration)}</p>
                            </div>
                        {/if}
                    </div>
                </section>
            {/if}

            {#if data.mediaDetails?.details.recommendations?.length}{@render mediaCarousel(
                    data.mediaDetails.details.recommendations,
                    "Recommendations"
                )}{/if}
            {#if data.mediaDetails?.details.similar?.length}{@render mediaCarousel(
                    data.mediaDetails.details.similar,
                    "Similar"
                )}{/if}
            {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.trakt_recommendations?.length}{@render mediaCarousel(
                    data.mediaDetails.details.trakt_recommendations,
                    "More Like This"
                )}{/if}
        </div>
    </div>
</div>
