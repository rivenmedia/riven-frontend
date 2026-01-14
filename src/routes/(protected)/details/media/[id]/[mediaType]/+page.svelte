<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import { type PageProps } from "./$types";
    import type { ParsedShowDetails } from "$lib/providers/parser";
    import { fade, fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
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
    import VideoPlayer from "$lib/components/media/video-player.svelte";
    import { toast } from "svelte-sonner";
    import X from "@lucide/svelte/icons/x";

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

    let showTrailerOverride = $state(false);
    const showTrailer = $derived(showTrailerOverride && data.mediaDetails?.details?.trailer);

    let showVideoPlayer = $state(false);
    function toggleVideoPlayer() {
        showVideoPlayer = !showVideoPlayer;
    }

    function getInitialSeason() {
        if (data.mediaDetails?.type !== "tv") return "1";
        const details = data.mediaDetails?.details as ParsedShowDetails;
        if (!details?.seasons?.length) return "1";

        const hasSeason1 = details.seasons.some((s) => s.number === 1);
        return hasSeason1 ? "1" : (details.seasons[0].number?.toString() ?? "1");
    }

    let selectedSeason: string | undefined = $state(getInitialSeason());

    $effect(() => {
        // Track ID changes to reset selected season
        selectedSeason = getInitialSeason();
    });

    let rivenId = $derived(data.riven?.id ?? data.mediaDetails?.details?.id);

    // For ratings, we need TMDB ID. For TV shows, check external_ids.tmdb first (in case URL has TVDB ID)
    let ratingsId = $derived(
        data.mediaDetails?.type === "tv"
            ? (data.mediaDetails?.details.external_ids?.tmdb ?? Number($page.params.id))
            : Number($page.params.id)
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

        fetch(`/api/ratings/${ratingsId}?type=${mediaType}`, { signal: controller.signal })
            .then(async (r) => {
                if (r.ok) {
                    ratingsData = await r.json();
                } else {
                    ratingsData = null;
                }
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
        return details.seasons.map((s) => ({
            id: s.id,
            season_number: s.number ?? 0,
            episode_count:
                details.episodes?.filter((ep) => ep.seasonNumber === s.number).length ?? 0,
            name: `Season ${s.number}`,
            status:
                data.riven?.seasons?.find((rs) => rs.season_number === s.number)?.state ===
                "Completed"
                    ? "Available"
                    : undefined
        }));
    });

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
</script>

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
                {#each items as item (item.id)}
                    <Carousel.Item class="basis-auto pl-3">
                        <a
                            href="/details/media/{item.id}/{item.media_type}"
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
                <div class="px-2 md:px-4">
                    <div
                        class={cn(
                            "relative mb-6 flex h-[35vh] max-h-[500px] min-h-[300px] items-end justify-between overflow-hidden rounded-2xl bg-cover bg-center shadow-2xl transition-all duration-500 md:mb-8 md:max-h-[600px]",
                            !showTrailer && "p-6 md:p-10"
                        )}
                        style="background-image: url('{data.mediaDetails?.details
                            .backdrop_path}');">
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

                                <div class="flex gap-2 md:gap-4">
                                    {#if data.riven?.state === "Completed"}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            class="border border-white/10 bg-white/10 px-4 text-sm font-bold text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20"
                                            onclick={toggleVideoPlayer}>
                                            <Play class="mr-1.5 h-4 w-4 fill-current md:mr-2" />
                                            Play
                                        </Button>
                                    {/if}
                                    {#if data.mediaDetails?.details.trailer}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            class="border border-white/10 bg-white/10 px-4 text-sm font-bold text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20"
                                            onclick={() => (showTrailerOverride = !showTrailer)}>
                                            <Play
                                                size={14}
                                                class="mr-1.5 fill-current md:mr-2" />Trailer
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
            <div class="px-4 pb-6 md:px-8 md:pb-8 lg:px-12">
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
                            {#if data.riven?.state}
                                <StatusBadge
                                    class="px-3 py-1.5 text-sm font-medium"
                                    state={data.riven.state} />
                            {/if}
                        </div>

                        <!-- Actions - Right under title -->
                        <div
                            class="flex flex-wrap items-center gap-2"
                            in:fly|global={{ y: 20, duration: 400, delay: 150, easing: cubicOut }}>
                            {#if !data.riven && data.mediaDetails?.type && data.mediaDetails?.details?.id != null}
                                <ItemRequest
                                    size="default"
                                    variant="secondary"
                                    class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary border bg-transparent px-4"
                                    title={data.mediaDetails?.details.title}
                                    ids={rivenId ? [rivenId.toString()] : []}
                                    mediaType={data.mediaDetails?.type}
                                    externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                    seasons={seasonData}>
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
                                    seasons={seasonData}>
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
                                        externalId={data.mediaDetails?.details?.id?.toString() ??
                                            ""}
                                        seasons={seasonData}>
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
                                    seasons={seasonData}>
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
                                        <div
                                            class="bg-muted/50 max-h-100 overflow-auto rounded-lg p-4">
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
                        <div
                            class="text-muted-foreground flex items-center gap-x-2.5 text-sm"
                            in:fly|global={{ y: 20, duration: 400, delay: 200, easing: cubicOut }}>
                            {#each details as detail, i}
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
                                        class="border-border bg-muted/50 text-muted-foreground rounded-full border px-3 py-1 text-sm"
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
                                {#each [1, 2, 3]}
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
                                collectionName={movieDetails.collection.name}>
                                {#snippet trigger({ props })}
                                    <button
                                        {...props}
                                        class="group border-border/50 relative block min-h-[6rem] w-full overflow-hidden rounded-xl border text-left shadow-lg transition-all duration-300 md:min-h-[9rem]">
                                        <!-- Background Layer -->
                                        <div class="absolute inset-0">
                                            <img
                                                alt={movieDetails.collection?.name}
                                                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                src={movieDetails.collection?.backdrop_path}
                                                loading="lazy" />
                                            <div
                                                class="from-background/90 via-background/40 absolute inset-0 bg-gradient-to-r to-transparent">
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
                        <Carousel.Root opts={{ dragFree: true, slidesToScroll: "auto" }}>
                            <Carousel.Content>
                                {#each data.mediaDetails?.details.seasons as season (season.id)}
                                    {@const rivenSeason = data.riven?.seasons?.find(
                                        (s) => s.season_number === season.number
                                    )}
                                    <Carousel.Item class="basis-auto">
                                        <button
                                            onclick={() =>
                                                (selectedSeason = season.number?.toString())}
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
                                                selected={selectedSeason ===
                                                    season.number?.toString()}
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
                    <section
                        class="mt-8 md:mt-12"
                        in:fly|global={{ y: 20, duration: 400, delay: 500, easing: cubicOut }}>
                        {@render sectionHeading("Episodes")}
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
                                    <Drawer.Trigger class="group w-full text-left">
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
                                                    class="text-muted-foreground rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-sm backdrop-blur-sm"
                                                    >{episode.aired}</span>
                                                {#if episode.runtime}
                                                    <span
                                                        class="text-muted-foreground rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-sm backdrop-blur-sm"
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
                                                            class="text-sm"
                                                            >{episode.runtime} min</Badge
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
                                                                <p
                                                                    class="text-primary font-semibold">
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
                                                                <p
                                                                    class="text-primary font-semibold">
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
                                                                <span
                                                                    class="text-primary font-semibold"
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
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Audio</span>
                                                                {#each meta.audio_tracks as track}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-sm"
                                                                        >{track.codec}{track.channels
                                                                            ? track.channels === 8
                                                                                ? " 7.1"
                                                                                : track.channels ===
                                                                                    6
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
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Source</span>
                                                                <Badge
                                                                    variant="outline"
                                                                    class="text-sm"
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
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Size</span>
                                                                <span class="text-muted-foreground"
                                                                    >{formatSize(
                                                                        fs.file_size
                                                                    )}</span>
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
                    <section
                        class="mt-8 md:mt-12"
                        in:fly|global={{ y: 20, duration: 400, delay: 550, easing: cubicOut }}>
                        {@render sectionHeading("Cast")}
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
                                            <div class="flex min-w-[120px] flex-col gap-1">
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
                                            <div class="flex min-w-[120px] flex-col gap-1">
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
                                            <div class="flex min-w-[120px] flex-col gap-1">
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
                                            <div class="flex min-w-[120px] flex-col gap-1">
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
                                            {#each data.mediaDetails.details.production_companies as company}
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
                                                    href={data.mediaDetails.details.homepage}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
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
                                                {#each validLinks as [key, value]}
                                                    <a
                                                        href="{getExternal(key).url}{value}"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
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
                        {#if data.riven && data.mediaDetails?.type === "movie" && data.riven.media_metadata}
                            {@const meta = data.riven.media_metadata}
                            {@const fs = data.riven.filesystem_entry}
                            {@const video = meta?.video}
                            <div class="min-w-0 flex-1">
                                {@render sectionHeading("File Information")}
                                <div class="flex flex-col gap-6 text-sm">
                                    <!-- Filenames -->
                                    {#if meta?.filename}
                                        <div class="flex flex-col gap-1">
                                            <p
                                                class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                                                Current Filename
                                            </p>
                                            <p class="text-foreground font-mono text-xs break-all">
                                                {meta.filename}
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

                                    <!-- Audio - Show ALL tracks -->
                                    {#if meta?.audio_tracks?.length}
                                        <div class="flex flex-col gap-2">
                                            <span
                                                class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                >Audio</span>
                                            <div class="flex flex-wrap gap-2">
                                                {#each meta.audio_tracks as track}
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

                                    <!-- Subtitles - Show ALL tracks -->
                                    {#if meta?.subtitle_tracks?.length}
                                        <div class="flex flex-col gap-2">
                                            <span
                                                class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                >Subtitles</span>
                                            <div class="flex flex-wrap gap-2">
                                                {#each meta.subtitle_tracks as track}
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
                                    {#if meta?.quality_source}
                                        <div class="flex flex-col gap-2">
                                            <span
                                                class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                >Source</span>
                                            <div class="flex flex-wrap gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    class="border border-blue-500/20 bg-blue-500/10 text-xs font-bold text-blue-200 backdrop-blur-sm"
                                                    >{meta.quality_source}</Badge>
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

                                    <!-- Size & Bitrate -->
                                    {#if fs?.file_size || meta?.bitrate}
                                        <div class="flex flex-col gap-2">
                                            <span
                                                class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                >Metrics</span>
                                            <div class="flex flex-wrap gap-4">
                                                {#if fs?.file_size}
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-muted-foreground text-xs"
                                                            >Size</span>
                                                        <span class="text-foreground font-mono"
                                                            >{formatSize(fs.file_size)}</span>
                                                    </div>
                                                {/if}
                                                {#if meta?.bitrate}
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-muted-foreground text-xs"
                                                            >Bitrate</span>
                                                        <span class="text-foreground font-mono"
                                                            >{Math.round(meta.bitrate / 1000000)} Mbps</span>
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
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
                {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.trakt_recommendations?.length}{@render mediaCarousel(
                        data.mediaDetails.details.trakt_recommendations,
                        "More Like This",
                        700
                    )}{/if}
            </div>
        </div>
    </div>

    <!-- Video Player Dialog -->
    <Dialog.Root bind:open={showVideoPlayer}>
        <Dialog.Content class="border-border/50 max-w-5xl overflow-hidden bg-black p-0">
            <Dialog.Header class="sr-only">
                <Dialog.Title>Video Player</Dialog.Title>
                <Dialog.Description>Playing {data.mediaDetails?.details.title}</Dialog.Description>
            </Dialog.Header>
            <div class="aspect-video w-full">
                {#if showVideoPlayer && rivenId}
                    <VideoPlayer itemId={rivenId} class="h-full w-full" />
                {/if}
            </div>
        </Dialog.Content>
    </Dialog.Root>
{/key}
