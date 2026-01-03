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
    import Mountain from "@lucide/svelte/icons/mountain";
    import { cn } from "$lib/utils";
    import MediaCard from "$lib/components/media/media-card.svelte";
    import ItemRequest from "$lib/components/media/riven/item-request.svelte";
    import ItemDelete from "$lib/components/media/riven/item-delete.svelte";
    import ItemPause from "$lib/components/media/riven/item-pause.svelte";
    import ItemReset from "$lib/components/media/riven/item-reset.svelte";
    import ItemRetry from "$lib/components/media/riven/item-retry.svelte";
    import ItemManualScrape from "$lib/components/media/riven/item-manual-scrape.svelte";
    import CollectionSheet from "$lib/components/media/collection-sheet.svelte";
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
    let ratingsId = $derived(Number($page.params.id) || null);
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

    const stateVariant = (state: string): "success" | "warning" | "error" =>
        state === "Completed" ? "success" : state === "Unknown" ? "error" : "warning";
    const stateColor = (state: string) =>
        state === "Completed"
            ? "bg-green-600"
            : state === "Unknown"
              ? "bg-red-600"
              : "bg-yellow-600";
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
    <section class="mt-8">
        <h2 class="mb-4 text-lg font-bold drop-shadow-md">{title}</h2>
        <Carousel.Root opts={{ dragFree: true, slidesToScroll: "auto" }}>
            <Carousel.Content>
                {#each items as item (item.id)}
                    <Carousel.Item class="basis-auto">
                        <a
                            href="/details/media/{item.id}/{item.media_type}"
                            class="group relative block opacity-80 transition-all duration-200 hover:opacity-100">
                            <MediaCard
                                title={item.title}
                                subtitle={`${item.media_type === "tv" ? "TV" : "Movie"}${item.year ? ` • ${item.year}` : ""}`}
                                image={item.poster_path} />
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

<div class="relative flex flex-col">
    {#if data.mediaDetails?.details.backdrop_path}
        <div class="fixed bottom-0 left-0 z-1 h-screen w-full">
            <img
                alt=""
                class="h-full w-full object-cover opacity-50 blur-2xl"
                src={data.mediaDetails?.details.backdrop_path}
                loading="lazy" />
            <div class="bg-background/70 absolute inset-0"></div>
            <div class="to-background absolute inset-0 bg-linear-to-b from-transparent"></div>
        </div>
    {/if}

    <div class="z-1 mt-14 flex h-full w-full flex-col p-8 md:px-16">
        {#if data.mediaDetails?.details.backdrop_path || data.mediaDetails?.details.trailer}
            <div
                class={cn(
                    "relative flex h-96 items-end justify-between overflow-hidden rounded-lg bg-cover bg-center lg:h-120 xl:h-128 2xl:h-136",
                    !showTrailer && "p-8"
                )}
                style="background-image: url('{data.mediaDetails?.details.backdrop_path}');">
                {#if !showTrailer}
                    {#if data.mediaDetails?.details.logo}
                        <img
                            alt="Logo"
                            class="h-8 object-contain drop-shadow-lg md:h-10 lg:h-12"
                            src={data.mediaDetails?.details.logo}
                            loading="lazy" />
                    {:else}<div></div>{/if}
                    <div class="flex gap-2">
                        {#if data.riven?.state === "Completed"}
                            <Button
                                variant="ghost"
                                class="flex items-center gap-2 shadow-lg hover:scale-105">
                                <img
                                    alt="Plex"
                                    src="https://api.iconify.design/mdi:plex.svg"
                                    class="h-5 w-5 invert" /><span class="hidden md:block"
                                    >Plex</span>
                            </Button>
                        {/if}
                        {#if data.mediaDetails?.details.trailer}
                            <Button
                                variant="ghost"
                                class="flex items-center gap-2 shadow-lg hover:scale-105"
                                onclick={() => (showTrailerOverride = !showTrailer)}>
                                <Play size={18} /><span class="hidden md:block">Trailer</span>
                            </Button>
                        {/if}
                    </div>
                {:else}
                    <iframe
                        class="h-full w-full"
                        src="https://www.youtube-nocookie.com/embed/{data.mediaDetails?.details
                            .trailer
                            ?.key}?autoplay=1&controls=1&mute=0&rel=0&modestbranding=1&playsinline=1"
                        title="Trailer"
                        allow="autoplay"
                        allowfullscreen></iframe>
                {/if}
            </div>
        {/if}

        <div class="md:px-8 lg:px-16">
            <div class="mt-6 flex flex-row gap-8">
                <img
                    alt={data.mediaDetails?.details.title}
                    class="mr-6 hidden aspect-2/3 w-32 rounded-lg object-cover shadow-md hover:scale-105 sm:w-44 md:block md:w-48 lg:w-52"
                    src={data.mediaDetails?.details.poster_path ||
                        "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg"}
                    loading="lazy" />

                <div class="flex flex-col">
                    <h1 class="mb-2 text-xl font-bold drop-shadow-md">
                        {data.mediaDetails?.details.title}
                    </h1>

                    <div class="mb-2 flex flex-wrap gap-2">
                        {#if !data.riven && data.mediaDetails?.type && data.mediaDetails?.details?.id != null}
                            <ItemRequest
                                class="bg-white/5 hover:bg-white/10"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}
                                mediaType={data.mediaDetails?.type}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                seasons={getSeasonData()} />
                            <ItemManualScrape
                                class="bg-white/5 hover:bg-white/10"
                                title={data.mediaDetails?.details?.title}
                                itemId={null}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                mediaType={data.mediaDetails?.type}
                                seasons={getSeasonData()} />
                        {:else if data.riven?.id != null}
                            <ItemDelete
                                class="bg-white/5 hover:bg-white/10"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}
                                variant="destructive" />
                            <ItemReset
                                class="bg-white/5 hover:bg-white/10"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []} />
                            {#if data.riven.state !== "Completed"}<ItemPause
                                    class="bg-white/5 hover:bg-white/10"
                                    title={data.mediaDetails?.details.title}
                                    isPaused={data.riven.state === "Paused"}
                                    ids={rivenId ? [rivenId.toString()] : []} />{/if}
                            <ItemRetry
                                class="bg-white/5 hover:bg-white/10"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []} />
                            {#if data.mediaDetails?.type === "tv"}
                                <ItemRequest
                                    class="bg-white/5 hover:bg-white/10"
                                    title={data.mediaDetails?.details.title}
                                    ids={rivenId ? [rivenId.toString()] : []}
                                    mediaType={data.mediaDetails?.type}
                                    buttonLabel="Request More"
                                    externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                    seasons={getSeasonData()} />
                            {/if}
                            <ItemManualScrape
                                class="bg-white/5 hover:bg-white/10"
                                title={data.mediaDetails?.details?.title}
                                itemId={rivenId?.toString() ?? null}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                mediaType={data.mediaDetails?.type}
                                seasons={getSeasonData()} />
                            <Dialog.Root>
                                <Dialog.Trigger
                                    >{#snippet child({ props })}<Button
                                            variant="ghost"
                                            size="sm"
                                            class="bg-white/5 hover:bg-white/10"
                                            {...props}>JSON</Button
                                        >{/snippet}</Dialog.Trigger>
                                <Dialog.Content class="w-full max-w-4xl!">
                                    <Dialog.Header
                                        ><Dialog.Title>Raw Riven Data</Dialog.Title></Dialog.Header>
                                    <div class="max-h-100 overflow-auto rounded bg-zinc-800 p-4">
                                        <pre
                                            class="text-sm break-all whitespace-pre-wrap">{JSON.stringify(
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
                                        }}>Copy</Button>
                                </Dialog.Content>
                            </Dialog.Root>
                        {/if}
                    </div>

                    {#if data.riven?.state}<Badge class={cn("mb-2", stateColor(data.riven.state))}
                            >{data.riven.state}</Badge
                        >{/if}
                    {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.status === "Continuing" && data.mediaDetails?.details.airing}
                        <p class="text-muted-foreground mb-2 text-sm">
                            Airs {data.mediaDetails?.details.airing.days.join(", ")} at {data
                                .mediaDetails?.details.airing.time}
                        </p>
                    {/if}
                    {#if data.mediaDetails?.details.tagline}<p
                            class="text-muted-foreground mb-2 text-sm font-semibold italic">
                            {data.mediaDetails?.details.tagline}
                        </p>{/if}

                    <div class="mb-3 flex flex-wrap gap-1.5 text-sm font-semibold">
                        {#each details as detail, i}<span>{detail}</span
                            >{#if i < details.length - 1}<span>•</span>{/if}{/each}
                    </div>

                    {#if data.mediaDetails?.details.genres?.length}
                        <div class="mb-3 flex flex-wrap gap-2">
                            {#each data.mediaDetails?.details.genres as genre (genre.id)}<Badge
                                    variant="outline"
                                    class="border-primary h-5 rounded-md border-[1.5px] px-2.5 py-0 font-semibold"
                                    >{genre.name}</Badge
                                >{/each}
                        </div>
                    {/if}

                    {#if ratingsLoading && !ratingsData}
                        <div class="mb-3 flex gap-3">
                            {#each [1, 2, 3] as _}<div class="flex gap-1.5">
                                    <div class="h-5 w-5 animate-pulse rounded bg-white/20"></div>
                                    <div class="h-4 w-10 animate-pulse rounded bg-white/20"></div>
                                </div>{/each}
                        </div>
                    {:else if ratingsData?.scores?.length}
                        <div class="mb-3 flex flex-wrap gap-3">
                            {#each ratingsData.scores as score (score.name)}
                                <a
                                    href={score.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="flex items-center gap-1.5 opacity-90 hover:opacity-60">
                                    {#if score.image}<img
                                            src="/rating-logos/{score.image}"
                                            alt={score.name}
                                            class="h-5 w-5 object-contain" />{/if}
                                    <span class="text-sm font-semibold">{score.score}</span>
                                </a>
                            {/each}
                        </div>
                    {/if}

                    <p class="max-w-max text-sm leading-relaxed text-gray-200">
                        {data.mediaDetails?.details.overview}
                    </p>

                    {#if data.mediaDetails?.details.cast?.length}
                        <div class="mt-6 flex flex-col gap-3">
                            <h3
                                class="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                                Top Cast
                            </h3>
                            <div class="flex flex-wrap gap-4">
                                {#each data.mediaDetails?.details.cast.slice(0, 8) as cast (cast.id)}
                                    <Tooltip>
                                        {#snippet trigger()}<a href="/details/person/{cast.id}"
                                                ><img
                                                    alt={cast.name}
                                                    class="size-14 rounded-full object-cover shadow-md ring-2 ring-white/10 hover:scale-110 hover:ring-white/30"
                                                    src={cast.profile_path ||
                                                        "https://i.pravatar.cc/200"}
                                                    loading="lazy" /></a
                                            >{/snippet}
                                        {#snippet content()}<p
                                                class="text-center text-sm font-medium">
                                                {cast.name} as {cast.character}
                                            </p>{/snippet}
                                    </Tooltip>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.collection}
                <section class="mt-8">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">Collection</h2>
                    <a
                        href="/details/collection/{data.mediaDetails?.details.collection.id}"
                        class="group relative block overflow-hidden rounded-lg shadow-lg">
                        <img
                            alt={data.mediaDetails?.details.collection.name}
                            class="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            src={data.mediaDetails?.details.collection.backdrop_path}
                            loading="lazy" />
                        <div
                            class="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent">
                        </div>
                        <div class="absolute inset-0 flex items-center p-6">
                            <span
                                class="text-lg font-bold text-white drop-shadow-lg hover:underline"
                                >{data.mediaDetails?.details.collection.name}</span>
                        </div>
                    </a>
                </section>
            {/if}

            {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.seasons}
                <section class="mt-8">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">Seasons</h2>
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
                                        <MediaCard
                                            title={season.number === 0
                                                ? "Specials"
                                                : `Season ${season.number}`}
                                            image={season.image}
                                            badge={rivenSeason?.state
                                                ? {
                                                      text: rivenSeason.state,
                                                      variant: stateVariant(rivenSeason.state)
                                                  }
                                                : null}
                                            selected={selectedSeason ===
                                                season.number?.toString()} />
                                    </button>
                                </Carousel.Item>
                            {/each}
                        </Carousel.Content>
                    </Carousel.Root>
                </section>
            {/if}

            {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.episodes}
                <section class="mt-8">
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
                                    <div
                                        class="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-md transition-all hover:scale-[1.02] hover:border-white/20 hover:shadow-xl">
                                        <div class="relative w-full flex-grow overflow-hidden">
                                            {#if episode.image}<img
                                                    alt={episode.name}
                                                    class="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                                                    src={episode.image}
                                                    loading="lazy" />
                                            {:else}<div
                                                    class="bg-muted/20 flex aspect-video w-full items-center justify-center">
                                                    <Mountain size={32} class="opacity-50" />
                                                </div>{/if}
                                            {#if rivenEpisode?.state}<Badge
                                                    variant="secondary"
                                                    class={cn(
                                                        "absolute top-2 right-2 px-2 py-1 text-xs backdrop-blur-sm",
                                                        rivenEpisode.state === "Completed"
                                                            ? "bg-green-500/90 text-black"
                                                            : rivenEpisode.state === "Unknown"
                                                              ? "bg-red-500/90 text-white"
                                                              : "bg-yellow-500/90 text-white"
                                                    )}>{rivenEpisode.state}</Badge
                                                >{/if}
                                            <div class="absolute inset-0 flex flex-col justify-end">
                                                <div
                                                    class="absolute inset-0 bg-black/90 backdrop-blur-3xl"
                                                    style="mask-image: linear-gradient(to bottom, transparent 20%, black 80%);">
                                                </div>
                                                <div class="relative z-10 flex flex-col gap-2 p-5">
                                                    <h3
                                                        class="line-clamp-1 text-xl font-extrabold text-white drop-shadow-md">
                                                        <span class="text-primary"
                                                            >{episode.number}.</span>
                                                        {episode.name}
                                                    </h3>
                                                    <div class="flex flex-wrap gap-1.5">
                                                        <span
                                                            class="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/80"
                                                            >{episode.aired}</span>
                                                        {#if episode.runtime}<span
                                                                class="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/80"
                                                                >{episode.runtime} min</span
                                                            >{/if}
                                                    </div>
                                                    {#if episode.overview}<p
                                                            class="line-clamp-2 grid grid-rows-[0fr] text-sm text-white/80 opacity-0 transition-all duration-500 group-hover:grid-rows-[1fr] group-hover:opacity-100">
                                                            <span class="overflow-hidden"
                                                                >{episode.overview}</span>
                                                        </p>{/if}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                                                {#if rivenEpisode}<Badge
                                                        class={cn(
                                                            "text-xs",
                                                            stateColor(rivenEpisode.state)
                                                        )}>{rivenEpisode.state}</Badge
                                                    >{/if}
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

            <section class="mt-8">
                <h2 class="mb-4 text-lg font-bold drop-shadow-md">More Details</h2>
                <div class="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
                    {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.budget}
                        <div
                            class="flex flex-col gap-1 rounded-lg bg-white/5 p-4 hover:bg-white/10">
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
                            class="flex flex-col gap-1 rounded-lg bg-white/5 p-4 hover:bg-white/10">
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
                            class="flex flex-col gap-1 rounded-lg bg-white/5 p-4 hover:bg-white/10">
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
                            class="flex flex-col gap-1 rounded-lg bg-white/5 p-4 hover:bg-white/10">
                            <p class="text-muted-foreground text-xs font-medium uppercase">
                                Origin Country
                            </p>
                            <p class="text-sm font-semibold">
                                {data.mediaDetails.details.origin_country.join(", ")}
                            </p>
                        </div>
                    {/if}
                    {#if data.mediaDetails?.details.belongs_to_collection}
                        <CollectionSheet
                            collectionId={data.mediaDetails.details.belongs_to_collection.id}
                            collectionName={data.mediaDetails.details.belongs_to_collection.name}>
                            {#snippet trigger({ props })}
                                <button
                                    class="flex w-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 text-left backdrop-blur-md transition-colors hover:border-white/20 hover:bg-black/60"
                                    {...props}>
                                    <p class="text-muted-foreground text-xs font-medium uppercase">
                                        Collection
                                    </p>
                                    <p class="line-clamp-1 text-sm font-semibold">
                                        {data.mediaDetails.details.belongs_to_collection.name}
                                    </p>
                                </button>
                            {/snippet}
                        </CollectionSheet>
                    {/if}
                    {#if data.mediaDetails?.details.production_companies?.length}
                        <div
                            class="flex flex-col gap-1 rounded-lg bg-white/5 p-4 hover:bg-white/10">
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
                            class="flex flex-col gap-1 rounded-lg bg-white/5 p-4 hover:bg-white/10">
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
                            class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md hover:border-white/20 hover:bg-black/60">
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
                            class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md hover:border-white/20 hover:bg-black/60">
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
                <section class="mt-8">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">File Information</h2>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
                        {#if meta?.original_filename || fs?.original_filename}
                            <div
                                class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md hover:border-white/20 hover:bg-black/60">
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
                                class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md hover:border-white/20 hover:bg-black/60">
                                <p class="text-muted-foreground text-xs font-medium uppercase">
                                    Current Filename
                                </p>
                                <p class="text-sm font-semibold break-all">{meta.filename}</p>
                            </div>
                        {/if}
                        <div
                            class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md hover:border-white/20 hover:bg-black/60">
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
                                class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md hover:border-white/20 hover:bg-black/60">
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
                                class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md hover:border-white/20 hover:bg-black/60">
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
                            class="flex flex-col gap-1 rounded-lg bg-white/5 p-4 hover:bg-white/10">
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
                                class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md hover:border-white/20 hover:bg-black/60">
                                <p class="text-muted-foreground text-xs font-medium uppercase">
                                    File Size
                                </p>
                                <p class="text-sm font-semibold">{formatSize(fs.file_size)}</p>
                            </div>
                        {/if}
                        {#if meta?.duration}
                            <div
                                class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md hover:border-white/20 hover:bg-black/60">
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
