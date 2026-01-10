<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import { type PageProps } from "./$types";
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
    import X from "@lucide/svelte/icons/x";
    import Mountain from "@lucide/svelte/icons/mountain";
    import Video from "@lucide/svelte/icons/video";
    import { cn } from "$lib/utils";
    import PortraitCard from "$lib/components/media/portrait-card.svelte";
    import VideoPlayer from "$lib/components/media/video-player.svelte";
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
    import PageShell from "$lib/components/page-shell.svelte";

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
        return urlId;
    });

    let details = $derived(
        [
            data.mediaDetails?.details.year,
            data.mediaDetails?.details.certification,
            data.mediaDetails?.details.formatted_runtime,
            data.mediaDetails?.details.status
        ].filter(Boolean)
    );

    let ratingsData = $state<any>(null);
    let ratingsLoading = $state(true);

    $effect(() => {
        if (!ratingsId) return;
        ratingsLoading = true;
        fetch(`/api/ratings/${ratingsId}?type=${data.mediaDetails?.type}`)
            .then((r) => r.json())
            .then((d) => {
                ratingsData = d;
                ratingsLoading = false;
            })
            .catch(() => {
                ratingsLoading = false;
            });
    });

    function getExternalMetadata(key: string) {
        const normalizedKey = normalizeExternalIdKey(key);
        return externalMetaData[normalizedKey];
    }

    function toggleTrailer() {
        showTrailerOverride = !showTrailer;
    }

    let showVideoPlayer = $state(false);

    function toggleVideoPlayer() {
        showVideoPlayer = !showVideoPlayer;
    }

    function getSeasonData() {
        if (data.mediaDetails?.type !== "tv" || !data.mediaDetails.details.seasons)
            return undefined;
        return data.mediaDetails.details.seasons
            .filter((s) => s.number != null && s.number > 0)
            .map((s) => ({
                id: s.id,
                name: `Season ${s.number}`,
                season_number: s.number!,
                episode_count:
                    data.mediaDetails?.type === "tv"
                        ? data.mediaDetails.details.episodes.filter(
                              (e) => e.seasonNumber === s.number
                          ).length
                        : 0
            }));
    }

    function formatCurrency(amount: number | null | undefined): string {
        if (amount == null) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }).format(amount);
    }

    function formatSize(bytes: number | null | undefined): string {
        if (bytes == null) return "Unknown";
        const units = ["B", "KB", "MB", "GB", "TB"];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
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
        <h2 class="mb-3 text-xl font-bold tracking-tight drop-shadow-md">{title}</h2>
        <Carousel.Root opts={{ dragFree: true, slidesToScroll: "auto" }}>
            <Carousel.Content class="-ml-3">
                {#each items as item (item.id)}
                    <Carousel.Item class="basis-auto pl-3">
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

    <div class="z-10 flex h-full w-full flex-col">
        <!-- Hero Banner - extends behind search bar -->
        {#if data.mediaDetails?.details.backdrop_path || data.mediaDetails?.details.trailer}
            <div
                class={cn(
                    "relative flex h-96 items-end justify-between overflow-hidden rounded-lg bg-cover bg-center bg-no-repeat lg:h-120 xl:h-128 2xl:h-136",
                    !showTrailer && "p-8"
                )}
                style="background-image: url('{data.mediaDetails?.details.backdrop_path}');">
                {#if showVideoPlayer}
                    <div class="absolute inset-0 z-20 bg-black">
                        <VideoPlayer itemId={rivenId} class="h-full w-full" />
                        <Button
                            variant="ghost"
                            size="icon"
                            class="bg-background/60 text-foreground hover:bg-background/80 absolute top-4 right-4 z-30"
                            onclick={toggleVideoPlayer}>
                            <X class="h-6 w-6" />
                        </Button>
                    </div>
                {/if}

                {#if !showTrailer}
                    {#if data.mediaDetails?.details.logo}
                        <div>
                            <img
                                alt="Movie logo"
                                class="h-8 w-full object-contain drop-shadow-lg md:h-10 lg:h-12"
                                src={data.mediaDetails?.details.logo}
                                loading="lazy" />
                        </div>
                    {:else}
                        <!-- Empty div to maintain layout when no logo -->
                        <div></div>
                    {/if}

                    <div class="flex gap-2">
                        {#if data.riven && data.riven.state === "Completed"}
                            <Button
                                variant="ghost"
                                class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:scale-105"
                                onclick={toggleVideoPlayer}
                                aria-label="Play Video">
                                <Video size={18} />
                                <span class="hidden md:block">Play</span>
                            </Button>
                        {/if}

                        {#if data.mediaDetails?.details.trailer}
                            <Button
                                variant="ghost"
                                class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:scale-105"
                                onclick={toggleTrailer}
                                aria-label="Play Trailer">
                                <Play size={18} />
                                <span class="hidden md:block">Trailer</span>
                            </Button>
                        {/if}
                    </div>
                {:else}
                    <div class="relative h-full w-full">
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
                            class="bg-background/60 text-foreground hover:bg-background/80 absolute top-4 right-4 z-20"
                            onclick={() => (showTrailerOverride = false)}>
                            <div class="i-lucide-x h-6 w-6"></div>
                        </Button>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Rest of content with padding -->
        <div class="px-4 pb-6 md:px-8 md:pb-8 lg:px-12">
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
                <div class="flex flex-col gap-5">
                    <!-- Title + Status Row -->
                    <div class="flex flex-wrap items-center gap-3">
                        <h1
                            class="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
                            {data.mediaDetails?.details.title}
                        </h1>
                        {#if data.riven?.state}
                            <StatusBadge
                                class="px-3 py-1.5 text-sm font-medium"
                                state={data.riven.state} />
                        {/if}
                    </div>

                    <!-- Actions - Right under title -->
                    <div class="flex flex-wrap items-center gap-2">
                        {#if !data.riven && data.mediaDetails?.type && data.mediaDetails?.details?.id != null}
                            <ItemRequest
                                size="default"
                                variant="secondary"
                                class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary border bg-transparent px-4"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}
                                mediaType={data.mediaDetails?.type}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                seasons={getSeasonData()}>
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
                                mediaType={data.mediaDetails?.type}
                                seasons={getSeasonData()}>
                                <Search class="mr-1.5 h-4 w-4" />
                                Manual Scrape
                            </ItemManualScrape>
                        {:else if data.riven?.id != null}
                            <ItemReset
                                size="default"
                                variant="secondary"
                                class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}>
                                <RotateCcw class="mr-1.5 h-4 w-4" />
                                Reset
                            </ItemReset>
                            <ItemRetry
                                size="default"
                                variant="secondary"
                                class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}>
                                <RefreshCw class="mr-1.5 h-4 w-4" />
                                Retry
                            </ItemRetry>

                            {#if data.mediaDetails?.type === "tv"}
                                <ItemRequest
                                    size="default"
                                    variant="secondary"
                                    class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary border bg-transparent px-4"
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
                                class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
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
                                    class="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
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
                                class="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive border bg-transparent px-4"
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
                    <div class="text-muted-foreground flex items-center gap-x-2.5 text-sm">
                        {#each details as detail, i}
                            <span>{detail}</span>
                            {#if i < details.length - 1}<span class="text-border">•</span>{/if}
                        {/each}
                    </div>

                    <!-- Genres -->
                    {#if data.mediaDetails?.details.genres?.length}
                        <div class="flex flex-wrap items-center gap-2">
                            {#each data.mediaDetails?.details.genres as genre (genre.id)}
                                <span
                                    class="border-border bg-muted/50 text-muted-foreground rounded-full border px-3 py-1 text-sm"
                                    >{genre.name}</span>
                            {/each}
                        </div>
                    {/if}

                    <!-- Ratings -->
                    {#if ratingsData?.scores?.length}
                        <div class="flex items-center gap-5">
                            {#each ratingsData.scores as score (score.name)}
                                <a
                                    href={score.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
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
                            {#each [1, 2, 3] as _}
                                <div class="bg-muted h-6 w-14 animate-pulse rounded"></div>
                            {/each}
                        </div>
                    {/if}

                    <!-- Description -->
                    <p class="text-muted-foreground max-w-4xl text-base leading-relaxed">
                        {data.mediaDetails?.details.overview}
                    </p>
                </div>
            </div>

            {#if data.mediaDetails?.type === "movie"}
                {@const movieDetails = data.mediaDetails.details}
                {#if movieDetails.collection}
                    <section class="mt-6 md:mt-8">
                        <h2 class="mb-2 text-xl font-bold drop-shadow-md">Collection</h2>
                        <CollectionSheet
                            collectionId={movieDetails.collection.id}
                            collectionName={movieDetails.collection.name}>
                            {#snippet trigger({ props })}
                                <button
                                    {...props}
                                    class="group border-border/50 relative block min-h-[6rem] w-full overflow-hidden rounded-xl border text-left shadow-lg transition-all duration-300 md:min-h-[9rem]">
                                    <!-- Background Layer -->
                                    <div class="absolute inset-0">
                                        <img
                                            alt={movieDetails.collection.name}
                                            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            src={movieDetails.collection.backdrop_path}
                                            loading="lazy" />
                                        <div
                                            class="from-background/90 via-background/40 absolute inset-0 bg-gradient-to-r to-transparent">
                                        </div>
                                    </div>

                                    <!-- Content Layer -->
                                    <div class="relative flex flex-col justify-center p-4 md:p-8">
                                        <span
                                            class="text-foreground text-xl font-black drop-shadow-lg md:text-3xl"
                                            >{movieDetails.collection.name}</span>
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
                <section class="mt-6">
                    <h2 class="mb-2 text-lg font-bold drop-shadow-md">Seasons</h2>
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
                                                    <StatusBadge
                                                        state={rivenSeason.state}
                                                        size="default" />
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
                    <h2 class="mb-2 text-lg font-bold drop-shadow-md">Episodes</h2>
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
                                                class="border-border/10 bg-muted/30 text-muted-foreground rounded-full border px-2 py-0.5 text-sm"
                                                >{episode.aired}</span>
                                            {#if episode.runtime}
                                                <span
                                                    class="border-border/10 bg-muted/30 text-muted-foreground rounded-full border px-2 py-0.5 text-sm"
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
                                                        class="text-sm">{episode.aired}</Badge
                                                    >{/if}
                                                {#if episode.runtime}<Badge
                                                        variant="outline"
                                                        class="text-sm">{episode.runtime} min</Badge
                                                    >{/if}
                                                {#if rivenEpisode}<StatusBadge
                                                        class="text-sm"
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
                                                <div class="flex flex-1 flex-col gap-3 text-sm">
                                                    <!-- Filenames -->
                                                    {#if meta?.original_filename || fs?.original_filename}
                                                        <div>
                                                            <p class="text-primary font-semibold">
                                                                Original Filename
                                                            </p>
                                                            <p
                                                                class="text-muted-foreground break-all">
                                                                {meta?.original_filename ||
                                                                    fs?.original_filename}
                                                            </p>
                                                        </div>
                                                    {/if}
                                                    {#if meta?.filename}
                                                        <div>
                                                            <p class="text-primary font-semibold">
                                                                Current Filename
                                                            </p>
                                                            <p
                                                                class="text-muted-foreground break-all">
                                                                {meta.filename}
                                                            </p>
                                                        </div>
                                                    {/if}

                                                    <!-- Video -->
                                                    {#if video}
                                                        <div class="flex items-center gap-2">
                                                            <span class="text-primary font-semibold"
                                                                >Video</span>
                                                            {#if video.resolution_width && video.resolution_height}<Badge
                                                                    variant="outline"
                                                                    class="text-sm"
                                                                    >{video.resolution_width}x{video.resolution_height}</Badge
                                                                >{/if}
                                                            {#if video.codec}<Badge
                                                                    variant="outline"
                                                                    class="text-sm"
                                                                    >{video.codec}</Badge
                                                                >{/if}
                                                            {#if video.hdr_type}<Badge
                                                                    variant="outline"
                                                                    class="text-sm"
                                                                    >{video.hdr_type}</Badge
                                                                >{/if}
                                                        </div>
                                                    {/if}

                                                    <!-- Audio - Show ALL tracks -->
                                                    {#if meta?.audio_tracks?.length}
                                                        <div
                                                            class="flex flex-wrap items-center gap-2">
                                                            <span class="text-primary font-semibold"
                                                                >Audio</span>
                                                            {#each meta.audio_tracks as track}
                                                                <Badge
                                                                    variant="outline"
                                                                    class="text-sm"
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
                                                    {/if}

                                                    <!-- Source -->
                                                    {#if meta?.quality_source}
                                                        <div class="flex items-center gap-2">
                                                            <span class="text-primary font-semibold"
                                                                >Source</span>
                                                            <Badge variant="outline" class="text-sm"
                                                                >{meta.quality_source}</Badge>
                                                            {#if meta?.is_remux}<Badge
                                                                    variant="outline"
                                                                    class="text-sm">REMUX</Badge
                                                                >{/if}
                                                        </div>
                                                    {/if}

                                                    <!-- Size -->
                                                    {#if fs?.file_size}
                                                        <div class="flex items-center gap-2">
                                                            <span class="text-primary font-semibold"
                                                                >Size</span>
                                                            <span class="text-muted-foreground"
                                                                >{formatSize(fs.file_size)}</span>
                                                        </div>
                                                    {/if}
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

            <!-- Cast -->
            {#if data.mediaDetails?.details.cast?.length}
                <section class="mt-6">
                    <h2 class="mb-3 text-xl font-bold tracking-tight drop-shadow-md">Cast</h2>
                    <Carousel.Root opts={{ dragFree: true, slidesToScroll: "auto" }}>
                        <Carousel.Content class="-ml-3">
                            {#each data.mediaDetails.details.cast as member (member.id)}
                                <Carousel.Item class="basis-auto pl-3">
                                    <a
                                        href="/details/entity/{member.id}/person"
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
            <section class="mt-6">
                <div class="flex flex-col gap-6 md:flex-row md:gap-16">
                    <!-- More Details Column -->
                    <div>
                        <h2 class="mb-2 text-xl font-bold drop-shadow-md">More Details</h2>
                        <div class="flex flex-col gap-3 text-base">
                            <!-- Budget (movies only) -->
                            {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.budget}
                                <div class="flex items-center gap-2">
                                    <span class="text-primary font-semibold">Budget</span>
                                    <span class="text-muted-foreground"
                                        >{formatCurrency(data.mediaDetails.details.budget)}</span>
                                </div>
                            {/if}

                            <!-- Revenue (movies only) -->
                            {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.revenue}
                                <div class="flex items-center gap-2">
                                    <span class="text-primary font-semibold">Revenue</span>
                                    <span class="text-muted-foreground"
                                        >{formatCurrency(data.mediaDetails.details.revenue)}</span>
                                </div>
                            {/if}

                            <!-- Origin -->
                            {#if data.mediaDetails?.details.origin_country?.length}
                                <div class="flex items-center gap-2">
                                    <span class="text-primary font-semibold">Origin</span>
                                    <span class="text-muted-foreground"
                                        >{data.mediaDetails.details.origin_country.join(
                                            ", "
                                        )}</span>
                                </div>
                            {/if}

                            <!-- Languages -->
                            {#if data.mediaDetails?.details.spoken_languages?.length}
                                <div class="flex items-center gap-2">
                                    <span class="text-primary font-semibold">Languages</span>
                                    <span class="text-muted-foreground"
                                        >{data.mediaDetails.details.spoken_languages
                                            .map((l) => l.english_name)
                                            .join(", ")}</span>
                                </div>
                            {/if}

                            <!-- Production Companies -->
                            {#if data.mediaDetails?.details.production_companies?.length}
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="text-primary font-semibold text-nowrap"
                                        >Production</span>
                                    <span class="text-muted-foreground line-clamp-1"
                                        >{data.mediaDetails.details.production_companies
                                            .map((c) => c.name)
                                            .join(", ")}</span>
                                </div>
                            {/if}

                            <!-- External Links -->
                            {#if data.mediaDetails?.details.homepage || data.mediaDetails?.details.imdb_id || data.mediaDetails?.details.external_ids}
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="text-primary font-semibold">Links</span>
                                    {#if data.mediaDetails?.details.homepage}
                                        <a
                                            href={data.mediaDetails.details.homepage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="text-muted-foreground hover:text-foreground transition-colors"
                                            >Website</a>
                                    {/if}
                                    {#if data.mediaDetails?.details.imdb_id}
                                        <a
                                            href="https://www.imdb.com/title/{data.mediaDetails
                                                .details.imdb_id}/parentalguide/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="text-muted-foreground hover:text-foreground transition-colors"
                                            >Parental Guide</a>
                                    {/if}
                                    {#if data.mediaDetails?.details.external_ids}
                                        {@const validLinks = Object.entries(
                                            data.mediaDetails.details.external_ids
                                        ).filter(([key, value]) => value && getExternal(key))}
                                        {#each validLinks as [key, value]}
                                            <a
                                                href="{getExternal(key).url}{value}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="text-muted-foreground hover:text-foreground transition-colors"
                                                >{getExternal(key).name}</a>
                                        {/each}
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- File Information Column (movies only) -->
                    {#if data.riven && data.mediaDetails?.type === "movie" && data.riven.media_metadata}
                        {@const meta = data.riven.media_metadata}
                        {@const fs = data.riven.filesystem_entry}
                        {@const video = meta?.video}
                        <div>
                            <h2 class="mb-2 text-xl font-bold drop-shadow-md">File Information</h2>
                            <div class="flex flex-col gap-3 text-base">
                                <!-- Filenames -->
                                {#if meta?.original_filename || fs?.original_filename}
                                    <div>
                                        <p class="text-primary font-semibold">Original Filename</p>
                                        <p class="text-muted-foreground break-all">
                                            {meta?.original_filename || fs?.original_filename}
                                        </p>
                                    </div>
                                {/if}
                                {#if meta?.filename}
                                    <div>
                                        <p class="text-primary font-semibold">Current Filename</p>
                                        <p class="text-muted-foreground break-all">
                                            {meta.filename}
                                        </p>
                                    </div>
                                {/if}

                                <!-- Video -->
                                {#if video}
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="text-primary font-semibold">Video</span>
                                        {#if video.resolution_width && video.resolution_height}<Badge
                                                variant="outline"
                                                class="text-sm"
                                                >{video.resolution_width}x{video.resolution_height}</Badge
                                            >{/if}
                                        {#if video.codec}<Badge variant="outline" class="text-sm"
                                                >{video.codec}</Badge
                                            >{/if}
                                        {#if video.bit_depth}<Badge
                                                variant="outline"
                                                class="text-sm">{video.bit_depth}-bit</Badge
                                            >{/if}
                                        {#if video.hdr_type}<Badge variant="outline" class="text-sm"
                                                >{video.hdr_type}</Badge
                                            >{/if}
                                        {#if video.frame_rate}<Badge
                                                variant="outline"
                                                class="text-sm">{video.frame_rate} FPS</Badge
                                            >{/if}
                                    </div>
                                {/if}

                                <!-- Audio - Show ALL tracks -->
                                {#if meta?.audio_tracks?.length}
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="text-primary font-semibold">Audio</span>
                                        {#each meta.audio_tracks as track}
                                            <Badge variant="outline" class="text-sm"
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
                                {/if}

                                <!-- Subtitles - Show ALL tracks -->
                                {#if meta?.subtitle_tracks?.length}
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="text-primary font-semibold">Subtitles</span>
                                        {#each meta.subtitle_tracks as track}
                                            <Badge variant="outline" class="text-sm"
                                                >{track.language
                                                    ? track.language.toUpperCase()
                                                    : "Unknown"}</Badge>
                                        {/each}
                                    </div>
                                {/if}

                                <!-- Source -->
                                {#if meta?.quality_source}
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="text-primary font-semibold">Source</span>
                                        <Badge variant="outline" class="text-sm"
                                            >{meta.quality_source}</Badge>
                                        {#if meta?.is_remux}<Badge variant="outline" class="text-sm"
                                                >REMUX</Badge
                                            >{/if}
                                        {#if meta?.is_proper}<Badge
                                                variant="outline"
                                                class="text-sm">PROPER</Badge
                                            >{/if}
                                        {#if meta?.is_repack}<Badge
                                                variant="outline"
                                                class="text-sm">REPACK</Badge
                                            >{/if}
                                    </div>
                                {/if}

                                <!-- Size & Bitrate -->
                                {#if fs?.file_size || meta?.bitrate}
                                    <div class="flex items-center gap-4">
                                        {#if fs?.file_size}
                                            <div class="flex items-center gap-2">
                                                <span class="text-primary font-semibold">Size</span>
                                                <span class="text-muted-foreground"
                                                    >{formatSize(fs.file_size)}</span>
                                            </div>
                                        {/if}
                                        {#if meta?.bitrate}
                                            <div class="flex items-center gap-2">
                                                <span class="text-primary font-semibold"
                                                    >Bitrate</span>
                                                <span class="text-muted-foreground"
                                                    >{Math.round(meta.bitrate / 1000000)} Mbps</span>
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            </section>

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

{#if data.riven && data.riven.state === "Completed"}
    <Dialog.Root bind:open={showVideoPlayer}>
        <Dialog.Content class="max-w-7xl">
            <Dialog.Header>
                <Dialog.Title>{data.mediaDetails?.details.title}</Dialog.Title>
            </Dialog.Header>
            <div class="mt-4 aspect-video w-full">
                {#if showVideoPlayer && rivenId}
                    <VideoPlayer itemId={rivenId} class="h-full w-full" />
                {/if}
            </div>
        </Dialog.Content>
    </Dialog.Root>
{/if}
