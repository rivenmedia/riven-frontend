<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import { type PageProps } from "./$types";
    import Tooltip from "$lib/components/tooltip.svelte";
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import Play from "@lucide/svelte/icons/play";
    import { Button } from "$lib/components/ui/button/index.js";
    import X from "@lucide/svelte/icons/x";
    import Mountain from "@lucide/svelte/icons/mountain";
    import { cn } from "$lib/utils";
    import MediaCard from "$lib/components/media/media-card.svelte";
    import ItemRequest from "$lib/components/media/riven/item-request.svelte";
    import ItemDelete from "$lib/components/media/riven/item-delete.svelte";
    import ItemPause from "$lib/components/media/riven/item-pause.svelte";
    import ItemReset from "$lib/components/media/riven/item-reset.svelte";
    import ItemRetry from "$lib/components/media/riven/item-retry.svelte";
    import ItemManualScrape from "$lib/components/media/riven/item-manual-scrape.svelte";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as Drawer from "$lib/components/ui/drawer/index.js";
    import { toast } from "svelte-sonner";

    let { data }: PageProps = $props();

    const externalMetaData: Record<string, { name: string; baseUrl: string }> = {
        imdb: {
            name: "IMDb",
            baseUrl: "https://www.imdb.com/title/"
        },
        facebook: {
            name: "Facebook",
            baseUrl: "https://www.facebook.com/"
        },
        instagram: {
            name: "Instagram",
            baseUrl: "https://www.instagram.com/"
        },
        twitter: {
            name: "Twitter",
            baseUrl: "https://www.twitter.com/"
        },
        reddit: {
            name: "Reddit",
            baseUrl: "https://www.reddit.com/r/"
        },
        "themoviedb.com": {
            name: "TMDB",
            baseUrl: "https://www.themoviedb.org/tv/"
        },
        eidr: {
            name: "EIDR",
            baseUrl: "https://ui.eidr.org/view/content?id="
        }
    };

    function normalizeExternalIdKey(key: string): string {
        // Convert TMDB key format to standard format
        if (key.endsWith("_id")) {
            return key.replace("_id", "");
        }
        return key;
    }

    function getExternalMetadata(key: string) {
        const normalizedKey = normalizeExternalIdKey(key);
        return externalMetaData[normalizedKey];
    }

    let showTrailerDefault = $derived(
        !data.mediaDetails?.details.backdrop_path && !!data.mediaDetails?.details.trailer
    );
    let showTrailerOverride = $state<boolean | null>(null);
    let showTrailer = $derived(showTrailerOverride ?? showTrailerDefault);

    function toggleTrailer() {
        showTrailerOverride = !showTrailer;
    }

    let selectedSeason: string | undefined = $state("1");
    let rivenId = $derived(data.riven?.id ?? data.mediaDetails?.details?.id);
    // Use the TMDB ID from route params for ratings (works for both movies and TV shows)
    let ratingsId = $derived(Number($page.params.id) || null);
    let mediaType = $derived(data.mediaDetails?.type);

    // Ratings data fetched client-side only
    let ratingsData = $state<{
        scores: Array<{ name: string; image?: string; score: string; url: string }>;
    } | null>(null);
    let ratingsLoading = $state(false);

    $effect(() => {
        if (!browser) return;
        const id = ratingsId;
        const type = mediaType;
        if (!id || !type) {
            ratingsLoading = false;
            ratingsData = null;
            return;
        }

        const controller = new AbortController();
        ratingsLoading = true;

        (async () => {
            try {
                const response = await fetch(`/api/ratings/${id}?type=${type}`, {
                    signal: controller.signal
                });
                if (!controller.signal.aborted) {
                    ratingsData = response.ok ? await response.json() : null;
                    ratingsLoading = false;
                }
            } catch (e) {
                if (!controller.signal.aborted) {
                    ratingsLoading = false;
                }
            }
        })();

        return () => controller.abort();
    });
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
            <span>
                <img
                    alt={data.mediaDetails?.details.id?.toString()}
                    class="h-full w-full object-cover opacity-50 blur-2xl"
                    src={data.mediaDetails?.details.backdrop_path}
                    loading="lazy" />
                <div class="bg-background/70 absolute right-0 bottom-0 left-0 h-full w-full"></div>
                <div
                    class="to-background absolute right-0 bottom-0 left-0 h-full w-full bg-linear-to-b from-transparent to-100%">
                </div>
            </span>
        </div>
    {/if}
    <div class="z-1 mt-14 flex h-full w-full flex-col gap-0 space-y-0 p-8 md:px-16">
        {#if data.mediaDetails?.details.backdrop_path || data.mediaDetails?.details.trailer}
            <div
                class={cn(
                    "relative flex h-96 items-end justify-between overflow-hidden rounded-lg bg-cover bg-center bg-no-repeat lg:h-120 xl:h-128 2xl:h-136",
                    !showTrailer && "p-8"
                )}
                style="background-image: url('{data.mediaDetails?.details.backdrop_path}');">
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
                                class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:scale-105">
                                <img
                                    alt="Plex Logo"
                                    src="https://api.iconify.design/mdi:plex.svg"
                                    class="h-5 w-5 invert" />
                                <span class="hidden md:block">Plex</span>
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
                            class="h-full w-full"
                            src="https://www.youtube-nocookie.com/embed/{data.mediaDetails?.details
                                .trailer
                                ?.key}?autoplay=1&controls=1&mute=0&disablekb=1&loop=1&rel=0&modestbranding=1&playsinline=1"
                            title={data.mediaDetails?.details.trailer?.name ||
                                data.mediaDetails?.details.title + " Trailer"}
                            allow="autoplay"
                            allowfullscreen></iframe>
                    </div>
                {/if}
            </div>
        {/if}

        <div class="md:px-8 lg:px-16">
            <div class="mt-6 flex flex-row gap-8">
                <img
                    alt={data.mediaDetails?.details.title}
                    class="mr-6 hidden h-48 w-32 rounded-lg object-cover object-center shadow-md transition-transform duration-300 hover:scale-105 sm:h-64 sm:w-44 md:block md:h-72 md:w-48 lg:h-80 lg:w-52"
                    src={data.mediaDetails?.details.poster_path
                        ? data.mediaDetails?.details.poster_path
                        : "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg"}
                    loading="lazy" />

                <div class="flex flex-col">
                    <h1 class="mb-2 text-xl font-bold drop-shadow-md">
                        {data.mediaDetails?.details.title}
                    </h1>

                    <div class="mb-2 flex flex-wrap gap-2">
                        {#if !data.riven && data.mediaDetails?.type && data.mediaDetails?.details?.id != null}
                            <ItemRequest
                                class="bg-white/5 transition-colors hover:bg-white/10"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}
                                mediaType={data.mediaDetails?.type}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                seasons={data.mediaDetails?.type === "tv" &&
                                data.mediaDetails?.details?.seasons
                                    ? data.mediaDetails.details.seasons.map((s) => ({
                                          id: s.id,
                                          season_number: s.number ?? 0,
                                          episode_count:
                                              (data.mediaDetails?.details as any)?.episodes?.filter(
                                                  (ep: any) => ep.seasonNumber === s.number
                                              ).length ?? 0,
                                          name: `Season ${s.number}`,
                                          status:
                                              data.riven?.seasons?.find(
                                                  (rs) => rs.season_number === s.number
                                              )?.state === "Completed"
                                                  ? "Available"
                                                  : undefined
                                      }))
                                    : []} />

                            <ItemManualScrape
                                class="bg-white/5 transition-colors hover:bg-white/10"
                                title={data.mediaDetails?.details?.title}
                                itemId={null}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                mediaType={data.mediaDetails?.type}
                                seasons={data.mediaDetails?.type === "tv" &&
                                data.mediaDetails?.details?.seasons
                                    ? data.mediaDetails.details.seasons.map((s) => ({
                                          id: s.id,
                                          season_number: s.number ?? 0,
                                          episode_count:
                                              (data.mediaDetails?.details as any)?.episodes?.filter(
                                                  (ep: any) => ep.seasonNumber === s.number
                                              ).length ?? 0,
                                          name: `Season ${s.number}`,
                                          status:
                                              data.riven?.seasons?.find(
                                                  (rs) => rs.season_number === s.number
                                              )?.state === "Completed"
                                                  ? "Available"
                                                  : undefined
                                      }))
                                    : []} />
                        {:else if data.riven?.id != null}
                            <ItemDelete
                                class="bg-white/5 transition-colors hover:bg-white/10"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []}
                                variant="destructive" />

                            <ItemReset
                                class="bg-white/5 transition-colors hover:bg-white/10"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []} />

                            {#if data.riven.state !== "Completed"}
                                <ItemPause
                                    class="bg-white/5 transition-colors hover:bg-white/10"
                                    title={data.mediaDetails?.details.title}
                                    isPaused={data.riven.state === "Paused"}
                                    ids={rivenId ? [rivenId.toString()] : []} />
                            {/if}
                            <ItemRetry
                                class="bg-white/5 transition-colors hover:bg-white/10"
                                title={data.mediaDetails?.details.title}
                                ids={rivenId ? [rivenId.toString()] : []} />

                            {#if data.mediaDetails?.type === "tv"}
                                <ItemRequest
                                    class="bg-white/5 transition-colors hover:bg-white/10"
                                    title={data.mediaDetails?.details.title}
                                    ids={rivenId ? [rivenId.toString()] : []}
                                    mediaType={data.mediaDetails?.type}
                                    buttonLabel="Request More"
                                    externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                    seasons={data.mediaDetails?.details?.seasons
                                        ? data.mediaDetails.details.seasons.map((s) => ({
                                              id: s.id,
                                              season_number: s.number ?? 0,
                                              episode_count:
                                                  (
                                                      data.mediaDetails?.details as any
                                                  )?.episodes?.filter(
                                                      (ep: any) => ep.seasonNumber === s.number
                                                  ).length ?? 0,
                                              name: `Season ${s.number}`,
                                              status:
                                                  data.riven?.seasons?.find(
                                                      (rs) => rs.season_number === s.number
                                                  )?.state === "Completed"
                                                      ? "Available"
                                                      : undefined
                                          }))
                                        : []} />
                            {/if}

                            <ItemManualScrape
                                class="bg-white/5 transition-colors hover:bg-white/10"
                                title={data.mediaDetails?.details?.title}
                                itemId={rivenId?.toString() ?? null}
                                externalId={data.mediaDetails?.details?.id?.toString() ?? ""}
                                mediaType={data.mediaDetails?.type}
                                seasons={data.mediaDetails?.type === "tv" &&
                                data.mediaDetails?.details?.seasons
                                    ? data.mediaDetails.details.seasons.map((s) => ({
                                          id: s.id,
                                          season_number: s.number ?? 0,
                                          episode_count:
                                              (data.mediaDetails?.details as any)?.episodes?.filter(
                                                  (ep: any) => ep.seasonNumber === s.number
                                              ).length ?? 0,
                                          name: `Season ${s.number}`,
                                          status:
                                              data.riven?.seasons?.find(
                                                  (rs) => rs.season_number === s.number
                                              )?.state === "Completed"
                                                  ? "Available"
                                                  : undefined
                                      }))
                                    : []} />

                            <Dialog.Root>
                                <Dialog.Trigger>
                                    {#snippet child({ props })}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="bg-white/5 transition-colors hover:bg-white/10"
                                            {...props}>
                                            JSON
                                        </Button>
                                    {/snippet}
                                </Dialog.Trigger>
                                <Dialog.Content class="w-full max-w-4xl!">
                                    <Dialog.Header>
                                        <Dialog.Title>Raw Riven Data</Dialog.Title>
                                    </Dialog.Header>
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
                                            toast.success("Riven data copied to clipboard!");
                                        }}>
                                        Copy
                                    </Button>
                                </Dialog.Content>
                            </Dialog.Root>
                        {/if}
                    </div>

                    {#if data.riven?.state}
                        <Badge
                            class={cn(
                                "mb-2 leading-none",
                                data.riven.state === "Completed"
                                    ? "bg-green-600"
                                    : data.riven.state === "Unknown"
                                      ? "bg-red-600"
                                      : "bg-yellow-600"
                            )}>
                            {data.riven.state}
                        </Badge>
                    {/if}

                    {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.status === "Continuing" && data.mediaDetails?.details.airing}
                        <p class="text-muted-foreground mb-2 text-sm">
                            Airs {data.mediaDetails?.details.airing.days.join(", ")} at {data
                                .mediaDetails?.details.airing.time}
                        </p>
                    {/if}

                    {#if data.mediaDetails?.details.tagline}
                        <p class="text-muted-foreground mb-2 text-sm font-semibold italic">
                            {data.mediaDetails?.details.tagline}
                        </p>
                    {/if}

                    <div class="mb-3 flex flex-wrap gap-1.5 text-sm font-semibold">
                        {#key [data.mediaDetails?.details.year, data.mediaDetails?.details.formatted_runtime, data.mediaDetails?.details.original_language, data.mediaDetails?.details.status, data.mediaDetails?.details.certification]}
                            {@const details = [
                                data.mediaDetails?.details.year,
                                data.mediaDetails?.details.formatted_runtime,
                                data.mediaDetails?.details.original_language
                                    ? data.mediaDetails?.details.original_language.toUpperCase()
                                    : null,
                                data.mediaDetails?.details.certification,
                                data.mediaDetails?.details.status
                            ].filter(Boolean)}

                            {#each details as detail, i}
                                <span>{detail}</span>
                                {#if i < details.length - 1}
                                    <span>•</span>
                                {/if}
                            {/each}
                        {/key}
                    </div>

                    {#if data.mediaDetails?.details.genres && data.mediaDetails?.details.genres.length > 0}
                        <div class="mb-3 flex flex-wrap gap-2">
                            {#each data.mediaDetails?.details.genres as genre (genre.id)}
                                <Badge
                                    variant="outline"
                                    class="border-primary h-5 rounded-md border-[1.5px] px-2.5 py-0 leading-none font-semibold">
                                    {genre.name}
                                </Badge>
                            {/each}
                        </div>
                    {/if}

                    {#if ratingsLoading && !ratingsData}
                        <div class="mb-3 flex flex-wrap items-center gap-3">
                            {#each [1, 2, 3] as i (i)}
                                <div class="flex items-center gap-1.5">
                                    <div class="h-5 w-5 animate-pulse rounded bg-white/20"></div>
                                    <div class="h-4 w-10 animate-pulse rounded bg-white/20"></div>
                                </div>
                            {/each}
                        </div>
                    {:else if ratingsData?.scores && ratingsData.scores.length > 0}
                        <div class="mb-3 flex flex-wrap items-center gap-3">
                            {#each ratingsData.scores as score (score.name)}
                                <a
                                    href={score.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="flex items-center gap-1.5 opacity-90 transition-opacity duration-200 ease-in-out hover:opacity-60">
                                    {#if score.image}
                                        <img
                                            src="/rating-logos/{score.image}"
                                            alt={score.name}
                                            class="h-5 w-5 object-contain" />
                                    {/if}
                                    <span class="text-sm font-semibold">{score.score}</span>
                                </a>
                            {/each}
                        </div>
                    {/if}

                    <div class="flex flex-col gap-6">
                        <p class="max-w-max text-sm leading-relaxed text-gray-200">
                            {data.mediaDetails?.details.overview}
                        </p>

                        {#if data.mediaDetails?.details.cast && data.mediaDetails?.details.cast.length > 0}
                            <div class="flex flex-col gap-3">
                                <h3
                                    class="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                                    Top Cast
                                </h3>
                                <div class="flex flex-wrap gap-4">
                                    {#each data.mediaDetails?.details.cast as cast, index (cast.id)}
                                        {#if index < 8}
                                            <div class="flex flex-col items-center">
                                                <Tooltip>
                                                    {#snippet trigger()}
                                                        <a href="/details/person/{cast.id}">
                                                            <img
                                                                alt={cast.name}
                                                                class="mb-1 size-14 rounded-full object-cover object-center shadow-md ring-2 ring-white/10 transition-transform duration-300 hover:scale-110 hover:ring-white/30"
                                                                src={cast.profile_path
                                                                    ? cast.profile_path
                                                                    : "https://i.pravatar.cc/200"}
                                                                loading="lazy" />
                                                        </a>
                                                    {/snippet}

                                                    {#snippet content()}
                                                        <p class="text-center text-sm font-medium">
                                                            {cast.name} as {cast.character}
                                                        </p>
                                                    {/snippet}
                                                </Tooltip>
                                            </div>
                                        {/if}
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.collection}
                <section>
                    <h2 class="mt-8 mb-4 text-lg font-bold drop-shadow-md">Collection</h2>
                    <div class="group relative overflow-hidden rounded-lg shadow-lg">
                        <img
                            alt={data.mediaDetails?.details.collection.name}
                            class="h-32 w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            src={data.mediaDetails?.details.collection.backdrop_path}
                            loading="lazy" />
                        <div
                            class="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent">
                        </div>

                        <div class="absolute inset-0 flex items-center p-6">
                            <a
                                href={`/details/collection/${data.mediaDetails?.details.collection.id}`}
                                class="text-lg font-bold text-white decoration-2 underline-offset-4 shadow-black drop-shadow-lg transition-all duration-200 hover:scale-105 hover:underline">
                                {data.mediaDetails?.details.collection.name}
                            </a>
                        </div>
                    </div>
                </section>
            {/if}

            {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.seasons}
                <section>
                    <h2 class="mt-8 mb-4 text-lg font-bold drop-shadow-md">Seasons</h2>
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
                                            "group relative block transition-all duration-200",
                                            selectedSeason === season.number?.toString()
                                                ? "scale-100"
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
                                                      variant:
                                                          rivenSeason.state === "Completed"
                                                              ? "success"
                                                              : rivenSeason.state === "Unknown"
                                                                ? "error"
                                                                : "warning"
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
                <section>
                    <h2 class="mt-8 mb-4 text-lg font-bold drop-shadow-md">Episodes</h2>

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
                                        class="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-xl">
                                        <div class="relative w-full flex-grow overflow-hidden">
                                            {#if episode.image}
                                                <img
                                                    alt={episode.name}
                                                    class="aspect-video w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                                    src={episode.image}
                                                    loading="lazy" />
                                            {:else}
                                                <div
                                                    class="bg-muted/20 flex aspect-video w-full flex-col items-center justify-center">
                                                    <Mountain size={32} class="opacity-50" />
                                                </div>
                                            {/if}
                                            {#if rivenEpisode?.state}
                                                <Badge
                                                    variant="secondary"
                                                    class={cn(
                                                        "absolute top-2 right-2 flex items-center justify-center px-2 py-1 text-xs leading-none font-medium tracking-wide shadow-sm backdrop-blur-sm",
                                                        rivenEpisode.state === "Completed"
                                                            ? "bg-green-500/90 text-black hover:bg-green-500"
                                                            : rivenEpisode.state === "Unknown"
                                                              ? "bg-red-500/90 text-white hover:bg-red-500"
                                                              : "bg-yellow-500/90 text-white hover:bg-yellow-500"
                                                    )}>
                                                    {rivenEpisode.state}
                                                </Badge>
                                            {/if}

                                            <div class="absolute inset-0 flex flex-col justify-end">
                                                <div
                                                    class="absolute inset-0 z-0 bg-black/90 backdrop-blur-3xl transition-all duration-500"
                                                    style="mask-image: linear-gradient(to bottom, transparent 20%, black 80%); -webkit-mask-image: linear-gradient(to bottom, transparent 20%, black 80%);">
                                                </div>

                                                <div class="relative z-10 flex flex-col gap-2 p-5">
                                                    <h3
                                                        class="line-clamp-1 text-xl font-extrabold text-white drop-shadow-md">
                                                        <span class="text-primary"
                                                            >{episode.number}.</span>
                                                        {episode.name}
                                                    </h3>
                                                    <div
                                                        class="flex flex-wrap items-center gap-1.5">
                                                        <span
                                                            class="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs font-medium text-white/80 backdrop-blur-md">
                                                            {episode.aired}
                                                        </span>
                                                        {#if episode.runtime}
                                                            <span
                                                                class="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs font-medium text-white/80 backdrop-blur-md">
                                                                {episode.runtime} min
                                                            </span>
                                                        {/if}
                                                    </div>
                                                    {#if episode.overview}
                                                        <p
                                                            class="line-clamp-2 grid grid-rows-[0fr] text-sm text-white/80 opacity-0 transition-all duration-500 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100">
                                                            <span class="overflow-hidden">
                                                                {episode.overview}
                                                            </span>
                                                        </p>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    </div></Drawer.Trigger>
                                <Drawer.Content class="max-h-[80vh] md:max-h-[60vh]">
                                    <div class="mx-auto w-full max-w-4xl px-4 pb-6 md:px-6">
                                        <Drawer.Header class="px-0 pt-2 pb-3">
                                            <Drawer.Title class="text-lg font-bold">
                                                S{episode.seasonNumber}E{episode.number} - {episode.name}
                                            </Drawer.Title>
                                            <div class="mt-1 flex flex-wrap items-center gap-2">
                                                <span class="text-muted-foreground text-sm"
                                                    >{data.mediaDetails?.details.title}</span>
                                                <span class="text-muted-foreground">•</span>
                                                {#if episode.aired}
                                                    <Badge
                                                        variant="outline"
                                                        class="text-xs leading-none"
                                                        >{episode.aired}</Badge>
                                                {/if}
                                                {#if episode.runtime}
                                                    <Badge
                                                        variant="outline"
                                                        class="text-xs leading-none"
                                                        >{episode.runtime} min</Badge>
                                                {/if}
                                                {#if rivenEpisode}
                                                    <Badge
                                                        class={cn(
                                                            "text-xs leading-none",
                                                            rivenEpisode.state === "Completed"
                                                                ? "bg-green-600"
                                                                : rivenEpisode.state === "Unknown"
                                                                  ? "bg-red-600"
                                                                  : "bg-yellow-600"
                                                        )}>
                                                        {rivenEpisode.state}
                                                    </Badge>
                                                {/if}
                                            </div>
                                            {#if episode.overview}
                                                <p
                                                    class="text-muted-foreground mt-2 text-sm leading-relaxed">
                                                    {episode.overview}
                                                </p>
                                            {/if}
                                        </Drawer.Header>

                                        <div class="flex flex-col gap-4 md:flex-row md:gap-6">
                                            {#if episode.image}
                                                <div
                                                    class="relative shrink-0 overflow-hidden rounded-lg md:w-80">
                                                    <img
                                                        alt={episode.name}
                                                        class="aspect-video w-full rounded-lg object-cover"
                                                        src={episode.image}
                                                        loading="lazy" />
                                                </div>
                                            {/if}

                                            <div class="flex flex-1 flex-col">
                                                {#if rivenEpisode?.filesystem_entry || rivenEpisode?.media_metadata}
                                                    {@const meta = rivenEpisode.media_metadata}
                                                    {@const fs = rivenEpisode.filesystem_entry}
                                                    {@const video = meta?.video}
                                                    {@const audioTracks = meta?.audio_tracks ?? []}
                                                    {@const originalFilename =
                                                        meta?.original_filename ||
                                                        fs?.original_filename}

                                                    {#if originalFilename || meta?.filename}
                                                        <div class="mb-3 space-y-2 text-xs">
                                                            {#if originalFilename}
                                                                <div>
                                                                    <p
                                                                        class="text-primary font-semibold">
                                                                        Original Filename
                                                                    </p>
                                                                    <p
                                                                        class="text-muted-foreground break-all">
                                                                        {originalFilename}
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
                                                        </div>
                                                    {/if}

                                                    {@const subtitleTracks =
                                                        meta?.subtitle_tracks ?? []}

                                                    <div
                                                        class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                                                        {#if video}
                                                            <div class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Video</span>
                                                                {#if video.resolution_width && video.resolution_height}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >{video.resolution_width}x{video.resolution_height}</Badge>
                                                                {/if}
                                                                {#if video.codec}<Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >{video.codec}</Badge
                                                                    >{/if}
                                                                {#if video.bit_depth}<Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >{video.bit_depth}-bit</Badge
                                                                    >{/if}
                                                                {#if video.hdr_type}<Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >{video.hdr_type}</Badge
                                                                    >{/if}
                                                                {#if video.frame_rate}<Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >{video.frame_rate} FPS</Badge
                                                                    >{/if}
                                                            </div>
                                                        {/if}

                                                        {#if meta?.bitrate}
                                                            <div class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Bitrate</span>
                                                                <Badge
                                                                    variant="outline"
                                                                    class="text-xs leading-none"
                                                                    >{Math.round(
                                                                        meta.bitrate / 1000000
                                                                    )} Mbps</Badge>
                                                            </div>
                                                        {/if}

                                                        {#if audioTracks.length > 0}
                                                            <div class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Audio</span>
                                                                {#each audioTracks.slice(0, 2) as audio}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >{audio.codec}{audio.channels
                                                                            ? ` ${audio.channels}ch`
                                                                            : ""}{audio.language
                                                                            ? ` (${audio.language.toUpperCase()})`
                                                                            : ""}</Badge>
                                                                {/each}
                                                                {#if audioTracks.length > 2}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >+{audioTracks.length -
                                                                            2}</Badge>
                                                                {/if}
                                                            </div>
                                                        {/if}

                                                        {#if subtitleTracks.length > 0}
                                                            <div class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Subtitles</span>
                                                                {#each subtitleTracks.slice(0, 3) as subtitle}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >{subtitle.codec ===
                                                                        "subrip"
                                                                            ? "SRT"
                                                                            : subtitle.codec ===
                                                                                "hdmv_pgs_subtitle"
                                                                              ? "PGS"
                                                                              : subtitle.codec?.toUpperCase() ||
                                                                                "Unknown"}{subtitle.language
                                                                            ? ` (${subtitle.language.toUpperCase()})`
                                                                            : ""}</Badge>
                                                                {/each}
                                                                {#if subtitleTracks.length > 3}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >+{subtitleTracks.length -
                                                                            3}</Badge>
                                                                {/if}
                                                            </div>
                                                        {/if}

                                                        {#if meta?.quality_source || meta?.container_format || meta?.is_remux || meta?.is_proper || meta?.is_repack}
                                                            <div class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Source</span>
                                                                {#if meta?.quality_source}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >{meta.quality_source}</Badge>
                                                                {/if}
                                                                {#if meta?.container_format && meta.container_format.length > 0}
                                                                    {#each meta.container_format as container}
                                                                        <Badge
                                                                            variant="outline"
                                                                            class="text-xs leading-none"
                                                                            >{container.toUpperCase()}</Badge>
                                                                    {/each}
                                                                {/if}
                                                                {#if meta?.is_remux}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >REMUX</Badge>
                                                                {/if}
                                                                {#if meta?.is_proper}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >PROPER</Badge>
                                                                {/if}
                                                                {#if meta?.is_repack}
                                                                    <Badge
                                                                        variant="outline"
                                                                        class="text-xs leading-none"
                                                                        >REPACK</Badge>
                                                                {/if}
                                                            </div>
                                                        {/if}

                                                        {#if fs?.file_size}
                                                            <div class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Size</span>
                                                                <span class="text-muted-foreground"
                                                                    >{(
                                                                        fs.file_size / 1073741824
                                                                    ).toFixed(2)} GB</span>
                                                            </div>
                                                        {/if}

                                                        {#if meta?.duration}
                                                            <div class="flex items-center gap-1.5">
                                                                <span
                                                                    class="text-primary font-semibold"
                                                                    >Duration</span>
                                                                <span class="text-muted-foreground"
                                                                    >{Math.floor(
                                                                        meta.duration / 3600
                                                                    )}h {Math.floor(
                                                                        (meta.duration % 3600) / 60
                                                                    )}m {Math.floor(
                                                                        meta.duration % 60
                                                                    )}s</span>
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                </Drawer.Content>
                            </Drawer.Root>
                        {/each}
                    </div>
                </section>
            {/if}

            <section>
                <h2 class="mt-8 mb-4 text-lg font-bold drop-shadow-md">More Details</h2>
                <div class="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
                    {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.budget}
                        <div
                            class="flex h-full flex-col gap-1 rounded-md bg-white/5 p-3 transition-colors hover:bg-white/10">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Budget
                            </p>
                            <p class="text-sm font-semibold">
                                {data.mediaDetails?.details.budget
                                    ? new Intl.NumberFormat("en-US", {
                                          style: "currency",
                                          currency: "USD",
                                          maximumFractionDigits: 0
                                      }).format(data.mediaDetails?.details.budget)
                                    : "N/A"}
                            </p>
                        </div>
                    {/if}

                    {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.revenue}
                        <div
                            class="flex h-full flex-col gap-1 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Revenue
                            </p>
                            <p class="text-sm font-semibold">
                                {data.mediaDetails?.details.revenue
                                    ? new Intl.NumberFormat("en-US", {
                                          style: "currency",
                                          currency: "USD",
                                          maximumFractionDigits: 0
                                      }).format(data.mediaDetails?.details.revenue)
                                    : "N/A"}
                            </p>
                        </div>
                    {/if}

                    {#if data.mediaDetails?.details.homepage}
                        <div
                            class="flex h-full flex-col gap-1 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Homepage
                            </p>
                            {#if data.mediaDetails?.details.homepage}
                                <a
                                    href={data.mediaDetails?.details.homepage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-primary text-sm font-semibold underline-offset-2 hover:underline">
                                    Visit Website
                                </a>
                            {:else}
                                <p class="text-sm font-semibold">N/A</p>
                            {/if}
                        </div>
                    {/if}

                    {#if data.mediaDetails?.details.origin_country && data.mediaDetails?.details.origin_country.length > 0}
                        <div
                            class="flex h-full flex-col gap-1 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Origin Country
                            </p>
                            <p class="text-sm font-semibold">
                                {data.mediaDetails?.details.origin_country.length > 0
                                    ? data.mediaDetails?.details.origin_country.join(", ")
                                    : "N/A"}
                            </p>
                        </div>
                    {/if}

                    {#if data.mediaDetails?.details.production_companies && data.mediaDetails?.details.production_companies.length > 0}
                        <div
                            class="flex h-full flex-col gap-1 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Production
                            </p>
                            <div class="flex flex-row flex-wrap gap-2">
                                {#if data.mediaDetails?.type === "movie"}
                                    {#each data.mediaDetails?.details.production_companies as company, index (company.id)}
                                        <Tooltip>
                                            {#snippet trigger()}
                                                <div class="inline-block">
                                                    <img
                                                        alt={company.name}
                                                        class="h-6 w-auto rounded object-contain object-center opacity-80 transition-all duration-200 hover:scale-105 hover:opacity-100"
                                                        src={company.logo_path
                                                            ? company.logo_path
                                                            : "https://i.pravatar.cc/200"}
                                                        loading="lazy" />
                                                </div>
                                            {/snippet}

                                            {#snippet content()}
                                                <p class="text-center text-sm font-medium">
                                                    {company.name}
                                                </p>
                                            {/snippet}
                                        </Tooltip>
                                    {/each}
                                {:else if data.mediaDetails?.type === "tv"}
                                    <p class="text-sm font-semibold">
                                        {data.mediaDetails?.details.production_companies
                                            .map((company) => company.name)
                                            .join(", ")}
                                    </p>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    {#if data.mediaDetails?.details.spoken_languages && data.mediaDetails?.details.spoken_languages.length > 0}
                        <div
                            class="flex h-full flex-col gap-1 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Languages
                            </p>
                            <p class="text-sm font-semibold">
                                {data.mediaDetails?.details.spoken_languages.length > 0
                                    ? data.mediaDetails?.details.spoken_languages
                                          .map((lang) => lang.english_name)
                                          .join(", ")
                                    : "N/A"}
                            </p>
                        </div>
                    {/if}

                    {#if data.mediaDetails?.details.external_ids}
                        <div
                            class="flex h-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                External Links
                            </p>

                            <div class="flex flex-row flex-wrap items-center gap-2">
                                {#each Object.entries(data.mediaDetails?.details.external_ids) as [key, value] (key)}
                                    {#if value && getExternalMetadata(key)}
                                        {@const metadata = getExternalMetadata(key)}
                                        <a
                                            href={`${metadata.baseUrl}${value}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="text-primary text-sm font-semibold underline-offset-2 hover:underline">
                                            {metadata.name}
                                        </a>
                                    {/if}
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if data.mediaDetails?.details.imdb_id && getExternalMetadata("imdb")}
                        <div
                            class="flex h-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Parental Guide
                            </p>
                            <a
                                href={`${getExternalMetadata("imdb").baseUrl}${data.mediaDetails?.details.imdb_id}/parentalguide/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-primary text-sm font-semibold underline-offset-2 hover:underline">
                                IMDB Parental Guide
                            </a>
                        </div>
                    {/if}
                </div>
            </section>

            {#if data.riven && data.mediaDetails?.type === "movie" && data.riven.media_metadata}
                <section class="mt-8">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">File Information</h2>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
                        {#if data.riven.media_metadata?.original_filename || data.riven.filesystem_entry?.original_filename}
                            <div
                                class="flex h-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60">
                                <p
                                    class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                    Original Filename
                                </p>
                                <p class="text-sm font-semibold break-all">
                                    {data.riven.media_metadata?.original_filename ||
                                        data.riven.filesystem_entry?.original_filename}
                                </p>
                            </div>
                        {/if}

                        {#if data.riven.media_metadata?.filename}
                            <div
                                class="flex h-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60">
                                <p
                                    class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                    Current Filename
                                </p>
                                <p class="text-sm font-semibold break-all">
                                    {data.riven.media_metadata.filename}
                                </p>
                            </div>
                        {/if}

                        <div
                            class="flex h-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Video
                            </p>
                            <div class="flex flex-wrap gap-1.5 text-sm">
                                {#if data.riven.media_metadata?.video?.resolution_width && data.riven.media_metadata?.video?.resolution_height}
                                    <Badge variant="outline" class="text-xs leading-none">
                                        {data.riven.media_metadata.video.resolution_width}x{data
                                            .riven.media_metadata.video.resolution_height}
                                    </Badge>
                                {/if}
                                {#if data.riven.media_metadata?.video?.codec}
                                    <Badge variant="outline" class="text-xs leading-none">
                                        {data.riven.media_metadata.video.codec.toUpperCase()}
                                    </Badge>
                                {/if}
                                {#if data.riven.media_metadata?.video?.bit_depth}
                                    <Badge variant="outline" class="text-xs leading-none">
                                        {data.riven.media_metadata.video.bit_depth}-bit
                                    </Badge>
                                {/if}
                                {#if data.riven.media_metadata?.video?.hdr_type}
                                    <Badge variant="outline" class="text-xs leading-none"
                                        >{data.riven.media_metadata.video.hdr_type}</Badge>
                                {/if}
                                {#if data.riven.media_metadata?.bitrate}
                                    <Badge variant="outline" class="text-xs leading-none">
                                        {Math.round(data.riven.media_metadata.bitrate / 1000000)} Mbps
                                    </Badge>
                                {/if}

                                {#if data.riven.media_metadata?.video?.frame_rate}
                                    <Badge variant="outline" class="text-xs leading-none">
                                        {data.riven.media_metadata.video.frame_rate} FPS
                                    </Badge>
                                {/if}
                            </div>
                        </div>

                        {#if data.riven.media_metadata?.audio_tracks && data.riven.media_metadata.audio_tracks.length > 0}
                            <div
                                class="flex h-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60">
                                <p
                                    class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                    Audio
                                </p>
                                <div class="flex flex-wrap gap-1.5 text-sm">
                                    {#each data.riven.media_metadata.audio_tracks as audioTrack}
                                        <Badge variant="outline" class="text-xs leading-none">
                                            {audioTrack.codec}
                                            {audioTrack.channels
                                                ? audioTrack.channels === 8
                                                    ? "7.1"
                                                    : audioTrack.channels === 6
                                                      ? "5.1"
                                                      : audioTrack.channels + "ch"
                                                : ""}
                                            {audioTrack.language
                                                ? `(${audioTrack.language.toUpperCase()})`
                                                : ""}
                                        </Badge>
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        {#if data.riven.media_metadata?.subtitle_tracks && data.riven.media_metadata.subtitle_tracks.length > 0}
                            <div
                                class="flex h-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60">
                                <p
                                    class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                    Subtitles
                                </p>
                                <div class="flex flex-wrap gap-1.5 text-sm">
                                    {#each data.riven.media_metadata.subtitle_tracks as subtitle}
                                        <Badge variant="outline" class="text-xs leading-none">
                                            {subtitle.codec === "subrip"
                                                ? "SRT"
                                                : subtitle.codec === "hdmv_pgs_subtitle"
                                                  ? "PGS"
                                                  : subtitle.codec?.toUpperCase() || "Unknown"}
                                            {subtitle.language
                                                ? `(${subtitle.language.toUpperCase()})`
                                                : ""}
                                        </Badge>
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        <div
                            class="flex h-full flex-col gap-1 rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10">
                            <p
                                class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Source
                            </p>
                            <div class="flex flex-wrap gap-1.5 text-sm">
                                {#if data.riven.media_metadata?.quality_source}
                                    <Badge variant="outline" class="text-xs leading-none"
                                        >{data.riven.media_metadata.quality_source}</Badge>
                                {/if}
                                {#if data.riven.media_metadata?.container_format && data.riven.media_metadata.container_format.length > 0}
                                    {#each data.riven.media_metadata.container_format as container}
                                        <Badge variant="outline" class="text-xs leading-none"
                                            >{container.toUpperCase()}</Badge>
                                    {/each}
                                {/if}
                                {#if data.riven.media_metadata?.is_remux}
                                    <Badge variant="outline" class="text-xs leading-none"
                                        >REMUX</Badge>
                                {/if}
                                {#if data.riven.media_metadata?.is_proper}
                                    <Badge variant="outline" class="text-xs leading-none"
                                        >PROPER</Badge>
                                {/if}
                                {#if data.riven.media_metadata?.is_repack}
                                    <Badge variant="outline" class="text-xs leading-none"
                                        >REPACK</Badge>
                                {/if}
                            </div>
                        </div>

                        {#if data.riven.filesystem_entry?.file_size}
                            <div
                                class="flex h-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60">
                                <p
                                    class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                    File Size
                                </p>
                                <p class="text-sm font-semibold">
                                    {(data.riven.filesystem_entry.file_size / 1073741824).toFixed(
                                        2
                                    )} GB
                                </p>
                            </div>
                        {/if}

                        {#if data.riven.media_metadata?.duration}
                            <div
                                class="flex h-full flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/60">
                                <p
                                    class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                    Duration
                                </p>
                                <p class="text-sm font-semibold">
                                    {Math.floor(data.riven.media_metadata.duration / 3600)}h
                                    {Math.floor((data.riven.media_metadata.duration % 3600) / 60)}m
                                    {Math.floor(data.riven.media_metadata.duration % 60)}s
                                </p>
                            </div>
                        {/if}
                    </div>
                </section>
            {/if}

            {#if data.mediaDetails?.details.recommendations && data.mediaDetails?.details.recommendations.length > 0}
                {@render mediaCarousel(
                    data.mediaDetails.details.recommendations,
                    "Recommendations"
                )}
            {/if}

            {#if data.mediaDetails?.details.similar && data.mediaDetails?.details.similar.length > 0}
                {@render mediaCarousel(data.mediaDetails.details.similar, "Similar")}
            {/if}

            {#if data.mediaDetails?.type === "movie" && data.mediaDetails?.details.trakt_recommendations && data.mediaDetails?.details.trakt_recommendations.length > 0}
                {@render mediaCarousel(
                    data.mediaDetails.details.trakt_recommendations,
                    "More Like This"
                )}
            {/if}
        </div>
    </div>
</div>
