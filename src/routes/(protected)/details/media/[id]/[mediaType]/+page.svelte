<script lang="ts">
    import { type PageProps } from "./$types";
    import Tooltip from "$lib/components/tooltip.svelte";
    import ListCarousel from "$lib/components/list-carousel.svelte";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import Play from "@lucide/svelte/icons/play";
    import { Button } from "$lib/components/ui/button/index.js";
    import X from "@lucide/svelte/icons/x";
    import Mountain from "@lucide/svelte/icons/mountain";
    import { cn } from "$lib/utils";
    import ItemRequest from "$lib/components/media/riven/item-request.svelte";
    import ItemDelete from "$lib/components/media/riven/item-delete.svelte";
    import ItemPause from "$lib/components/media/riven/item-pause.svelte";
    import ItemReset from "$lib/components/media/riven/item-reset.svelte";
    import ItemRetry from "$lib/components/media/riven/item-retry.svelte";

    let { data }: PageProps = $props();
    $inspect(data);

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

    let showTrailer = $state(
        !data.mediaDetails?.details.backdrop_path && !!data.mediaDetails?.details.trailer
    );

    function toggleTrailer() {
        showTrailer = !showTrailer;
    }

    let selectedSeason: string | undefined = $state("1");
</script>

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
                    {#if data.mediaDetails.details.logo}
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

                        <div class="absolute top-4 right-4">
                            <Button
                                variant="ghost"
                                class="rounded-full bg-black/60 p-2 text-white shadow-lg transition-all hover:scale-105 hover:bg-black/80"
                                onclick={toggleTrailer}
                                aria-label="Close Trailer">
                                <X size={16} />
                            </Button>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        <div class="md:px-8 lg:px-16">
            {#if data.riven}
                <div
                    class="border-border mt-6 flex flex-row flex-wrap gap-2 rounded-lg border bg-white/10 px-6 py-4 shadow-lg">
                    <ItemDelete
                        class="bg-white/10"
                        title={data.mediaDetails?.details.title}
                        ids={[data.riven?.id?.toString()]}
                        variant="destructive" />

                    <ItemReset
                        class="bg-white/10"
                        title={data.mediaDetails?.details.title}
                        ids={[data.riven?.id?.toString()]} />

                    {#if data.riven.state !== "Completed"}
                        <ItemPause
                            class="bg-white/10"
                            title={data.mediaDetails?.details.title}
                            isPaused={data.riven.state === "Paused"}
                            ids={[data.riven?.id?.toString()]} />
                    {/if}
                    <ItemRetry
                        class="bg-white/10"
                        title={data.mediaDetails?.details.title}
                        ids={[data.riven?.id?.toString()]} />
                </div>
            {/if}

            <div
                class="border-border mt-6 flex flex-row rounded-lg border bg-white/10 px-6 py-4 shadow-lg">
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

                    {#if !data.riven}
                        <div class="flex">
                            <ItemRequest
                                class="mt-1 mb-2 bg-white/10"
                                title={data.mediaDetails?.details.title}
                                ids={data.mediaDetails.type
                                    ? [data.mediaDetails?.details.id?.toString()]
                                    : []}
                                mediaType={data.mediaDetails.type} />
                        </div>
                    {/if}

                    {#if data.riven?.state}
                        <Badge
                            class={cn(
                                "mb-2",
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
                                <Badge variant="outline" class="border-primary">
                                    {genre.name}
                                </Badge>
                            {/each}
                        </div>
                    {/if}

                    <div class="flex flex-col gap-8">
                        <p class="max-w-max text-sm leading-relaxed">
                            {data.mediaDetails?.details.overview}
                        </p>

                        <div class="flex flex-wrap">
                            {#each data.mediaDetails?.details.cast as cast, index (cast.id)}
                                {#if index < 8}
                                    <div class="flex flex-col items-center">
                                        <Tooltip>
                                            {#snippet trigger()}
                                                <a href="/details/person/{cast.id}">
                                                    <img
                                                        alt={cast.name}
                                                        class="mb-1 size-16 rounded-full object-cover object-center shadow-md ring-2 ring-white/10 transition-transform duration-300 hover:scale-110 hover:ring-white/30"
                                                        src={cast.profile_path
                                                            ? cast.profile_path
                                                            : "https://avatar.iran.liara.run/public"}
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
                </div>
            </div>

            {#if data.mediaDetails.type === "movie" && data.mediaDetails?.details.collection}
                <h2 class="mt-8 mb-4 text-lg font-bold">Part of the collection</h2>
                <div class="relative">
                    <img
                        alt={data.mediaDetails?.details.collection.name}
                        class="h-28 w-full rounded-lg object-cover object-center shadow-lg"
                        src={data.mediaDetails?.details.collection.backdrop_path}
                        loading="lazy" />
                    <div class="bg-background/70 absolute right-0 bottom-0 left-0 h-full w-full">
                    </div>

                    <div class="absolute inset-0 flex items-center justify-center p-4">
                        <a
                            href={`/details/collection/${data.mediaDetails?.details.collection.id}`}
                            class="text-center text-lg font-bold underline drop-shadow-lg transition-all duration-200 hover:scale-105">
                            {data.mediaDetails?.details.collection.name}
                        </a>
                    </div>
                </div>
            {/if}

            {#if data.mediaDetails.type === "tv" && data.mediaDetails?.details.seasons}
                <section>
                    <h2 class="mt-8 mb-4 text-lg font-bold drop-shadow-md">Seasons</h2>

                    <div
                        class="border-border flex flex-wrap gap-4 rounded-lg border bg-white/10 px-6 py-4 shadow-lg">
                        {#each data.mediaDetails?.details.seasons as season (season.id)}
                            <button onclick={() => (selectedSeason = season.number?.toString())}>
                                <div
                                    class={cn(
                                        "relative",
                                        selectedSeason !== season.number?.toString() && "opacity-50"
                                    )}>
                                    {#if season.image}
                                        <img
                                            alt={season.id.toString()}
                                            class="h-32 w-20 rounded-lg object-cover object-center shadow-md transition-transform duration-300 hover:scale-105 sm:h-48 sm:w-32"
                                            src={season.image}
                                            loading="lazy" />
                                    {:else}
                                        <div
                                            class="flex h-32 w-20 flex-col items-center justify-center rounded-lg border border-white/30 bg-white/20 shadow-md backdrop-blur-md transition-transform duration-300 hover:scale-105 sm:h-48 sm:w-32">
                                            <Mountain size={24} class="opacity-70 sm:size-8" />
                                            <span class="mt-2 text-center text-xs font-medium"
                                                >Season {season.number}</span>
                                        </div>
                                    {/if}

                                    {#if data.riven && data.riven.seasons && data.riven.seasons.some((s) => s.season_number === season.number)}
                                        {@const rivenSeason = data.riven.seasons.find(
                                            (s) => s.season_number === season.number
                                        )}
                                        {#if rivenSeason && rivenSeason.state}
                                            <Badge
                                                class={cn(
                                                    "absolute bottom-1 left-1 text-xs",
                                                    rivenSeason.state === "Completed"
                                                        ? "bg-green-600"
                                                        : rivenSeason.state === "Unknown"
                                                          ? "bg-red-600"
                                                          : "bg-yellow-600"
                                                )}>
                                                {rivenSeason.state}
                                            </Badge>
                                        {/if}
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    </div>
                </section>
            {/if}

            {#if data.mediaDetails.type === "tv" && data.mediaDetails?.details.episodes}
                <section>
                    <h2 class="mt-8 mb-4 text-lg font-bold drop-shadow-md">Episodes</h2>

                    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {#each data.mediaDetails?.details.episodes.filter((ep) => ep.seasonNumber?.toString() === selectedSeason) as episode (episode.id)}
                            <div
                                class="border-border flex flex-col overflow-hidden rounded-lg border bg-white/10 shadow-lg sm:flex-row">
                                <div class="w-full sm:w-1/3">
                                    {#if episode.image}
                                        <img
                                            alt={episode.name}
                                            class="h-48 w-full object-cover object-center sm:h-full"
                                            src={episode.image}
                                            loading="lazy" />
                                    {:else}
                                        <div
                                            class="flex h-48 w-full flex-col items-center justify-center bg-white/20 backdrop-blur-md sm:h-full">
                                            <Mountain size={32} class="opacity-70" />
                                            <span class="mt-2 text-xs font-medium"
                                                >Episode {episode.number}</span>
                                        </div>
                                    {/if}
                                </div>
                                <div class="flex w-full flex-col p-4 sm:w-2/3">
                                    <h3 class="text-sm font-bold">
                                        {episode.number}. {episode.name}
                                    </h3>
                                    <p class="text-muted-foreground mb-2 text-xs">
                                        {episode.aired} • {episode.runtime} min
                                    </p>

                                    {#if data.riven && data.riven.seasons}
                                        {@const rivenSeason = data.riven.seasons.find(
                                            (s) => s.season_number === Number(selectedSeason)
                                        )}
                                        {#if rivenSeason && rivenSeason.episodes}
                                            {@const rivenEpisode = rivenSeason.episodes.find(
                                                (e) => e.episode_number === episode.number
                                            )}
                                            {#if rivenEpisode && rivenEpisode.state}
                                                <Badge
                                                    class={cn(
                                                        "mb-2 text-xs",
                                                        rivenEpisode.state === "Completed"
                                                            ? "bg-green-600"
                                                            : rivenEpisode.state === "Unknown"
                                                              ? "bg-red-600"
                                                              : "bg-yellow-600"
                                                    )}>
                                                    {rivenEpisode.state}
                                                </Badge>
                                            {/if}
                                        {/if}
                                    {/if}

                                    <p class="line-clamp-3 text-xs">{episode.overview}</p>
                                </div>
                            </div>
                        {/each}
                    </div>
                </section>
            {/if}

            <section>
                <h2 class="mt-8 mb-4 text-lg font-bold drop-shadow-md">More Details</h2>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div
                        class="border-border flex flex-col gap-2 rounded-lg border bg-white/10 px-6 py-4 shadow-lg">
                        {#if data.mediaDetails.type === "movie" && data.mediaDetails?.details.budget}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">Budget</p>
                                <p class="text-sm font-medium">
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

                        {#if data.mediaDetails.type === "movie" && data.mediaDetails?.details.revenue}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">Revenue</p>
                                <p class="text-sm font-medium">
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
                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">Homepage</p>
                                {#if data.mediaDetails?.details.homepage}
                                    <a
                                        href={data.mediaDetails?.details.homepage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="text-sm font-medium underline hover:opacity-80">
                                        Visit Website
                                    </a>
                                {:else}
                                    <p class="text-sm font-medium">N/A</p>
                                {/if}
                            </div>
                        {/if}

                        {#if data.mediaDetails?.details.origin_country && data.mediaDetails?.details.origin_country.length > 0}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">Origin Country</p>
                                <p class="text-sm font-medium">
                                    {data.mediaDetails?.details.origin_country.length > 0
                                        ? data.mediaDetails?.details.origin_country.join(", ")
                                        : "N/A"}
                                </p>
                            </div>
                        {/if}

                        {#if data.mediaDetails?.details.production_companies && data.mediaDetails?.details.production_companies.length > 0}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">Production Companies</p>
                                <div class="flex flex-row flex-wrap">
                                    {#if data.mediaDetails.type === "movie"}
                                        {#each data.mediaDetails?.details.production_companies as company, index (company.id)}
                                            <Tooltip>
                                                {#snippet trigger()}
                                                    <div class="mr-2 mb-2 inline-block">
                                                        <img
                                                            alt={company.name}
                                                            class="h-6 w-auto rounded object-contain object-center shadow-md transition-transform duration-300 hover:scale-105"
                                                            src={company.logo_path
                                                                ? company.logo_path
                                                                : "https://avatar.iran.liara.run/public"}
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
                                    {:else if data.mediaDetails.type === "tv"}
                                        <p class="text-sm font-medium">
                                            {data.mediaDetails?.details.production_companies
                                                .map((company) => company.name)
                                                .join(", ")}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        {/if}

                        {#if data.mediaDetails?.details.spoken_languages && data.mediaDetails?.details.spoken_languages.length > 0}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">Spoken Languages</p>
                                <p class="text-sm font-medium">
                                    {data.mediaDetails?.details.spoken_languages.length > 0
                                        ? data.mediaDetails?.details.spoken_languages
                                              .map((lang) => lang.english_name)
                                              .join(", ")
                                        : "N/A"}
                                </p>
                            </div>
                        {/if}

                        {#if data.mediaDetails?.details.external_ids}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">External Links</p>

                                <div class="flex flex-row flex-wrap items-center">
                                    {#each Object.entries(data.mediaDetails?.details.external_ids) as [key, value] (key)}
                                        {#if value && getExternalMetadata(key)}
                                            {@const metadata = getExternalMetadata(key)}
                                            <a
                                                href={`${metadata.baseUrl}${value}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="mr-4 text-sm font-medium underline hover:opacity-80">
                                                {metadata.name}
                                            </a>
                                        {/if}
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        {#if data.mediaDetails?.details.imdb_id && getExternalMetadata("imdb")}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">Parental Guide</p>
                                <a
                                    href={`${getExternalMetadata("imdb").baseUrl}${data.mediaDetails?.details.imdb_id}/parentalguide/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="mr-4 text-sm font-medium underline hover:opacity-80">
                                    IMDB Parental Guide
                                </a>
                            </div>
                        {/if}
                    </div>

                    {#if data.riven && data.mediaDetails?.type === "movie" && data.riven.media_metadata}
                        <div
                            class="border-border flex flex-col gap-2 rounded-lg border bg-white/10 px-6 py-4 shadow-lg">
                            <h3 class="text-base font-semibold">File Information</h3>

                            {#if data.riven.media_metadata?.original_filename || data.riven.filesystem_entry?.original_filename}
                                <div class="flex flex-col gap-1">
                                    <p class="text-primary text-xs">Original Filename</p>
                                    <p class="text-sm font-medium break-all">
                                        {data.riven.media_metadata?.original_filename || data.riven.filesystem_entry?.original_filename}
                                    </p>
                                </div>
                            {/if}

                            {#if data.riven.media_metadata?.filename}
                                <div class="flex flex-col gap-1">
                                    <p class="text-primary text-xs">Current Filename</p>
                                    <p class="text-sm font-medium break-all">
                                        {data.riven.media_metadata.filename}
                                    </p>
                                </div>
                            {/if}

                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">Video</p>
                                <div class="flex flex-wrap gap-x-2 text-sm">
                                    {#if data.riven.media_metadata?.video?.resolution_width && data.riven.media_metadata?.video?.resolution_height}
                                        <Badge variant="outline">
                                            {data.riven.media_metadata.video.resolution_width}x{data.riven.media_metadata.video.resolution_height}
                                        </Badge>
                                    {/if}
                                    {#if data.riven.media_metadata?.video?.codec}
                                        <Badge variant="outline">
                                            {data.riven.media_metadata.video.codec.toUpperCase()}
                                        </Badge>
                                    {/if}
                                    {#if data.riven.media_metadata?.video?.bit_depth}
                                        <Badge variant="outline">
                                            {data.riven.media_metadata.video.bit_depth}-bit
                                        </Badge>
                                    {/if}
                                    {#if data.riven.media_metadata?.video?.hdr_type}
                                        <Badge variant="outline">{data.riven.media_metadata.video.hdr_type}</Badge>
                                    {/if}
                                    {#if data.riven.media_metadata?.bitrate}
                                        <Badge variant="outline">
                                            {Math.round(data.riven.media_metadata.bitrate / 1000000)} Mbps
                                        </Badge>
                                    {/if}

                                    {#if data.riven.media_metadata?.video.frame_rate}
                                        <Badge variant="outline">
                                            {data.riven.media_metadata.video.frame_rate} FPS
                                        </Badge>
                                    {/if}
                                </div>
                            </div>

                            {#if data.riven.media_metadata?.audio_tracks && data.riven.media_metadata.audio_tracks.length > 0}
                                <div class="flex flex-col gap-1">
                                    <p class="text-primary text-xs">Audio</p>
                                    <div class="flex flex-wrap gap-x-2 text-sm">
                                        {#each data.riven.media_metadata.audio_tracks as audioTrack}
                                            <Badge variant="outline">
                                                {audioTrack.codec}
                                                {audioTrack.channels
                                                    ? audioTrack.channels === 8
                                                        ? "7.1"
                                                        : audioTrack.channels === 6
                                                          ? "5.1"
                                                          : audioTrack.channels + "ch"
                                                    : ""}
                                                {audioTrack.language ? `(${audioTrack.language.toUpperCase()})` : ""}
                                            </Badge>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            {#if data.riven.media_metadata?.subtitle_tracks && data.riven.media_metadata.subtitle_tracks.length > 0}
                                <div class="flex flex-col gap-1">
                                    <p class="text-primary text-xs">Subtitles</p>
                                    <div class="flex flex-wrap gap-x-2 text-sm">
                                        {#each data.riven.media_metadata.subtitle_tracks as subtitle}
                                            <Badge variant="outline">
                                                {subtitle.codec === "subrip"
                                                    ? "SRT"
                                                    : subtitle.codec === "hdmv_pgs_subtitle"
                                                      ? "PGS"
                                                      : subtitle.codec?.toUpperCase() || "Unknown"}
                                                {subtitle.language ? `(${subtitle.language.toUpperCase()})` : ""}
                                            </Badge>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <div class="flex flex-col gap-1">
                                <p class="text-primary text-xs">Source</p>
                                <div class="flex flex-wrap gap-x-2 text-sm">
                                    {#if data.riven.media_metadata?.quality_source}
                                        <Badge variant="outline">{data.riven.media_metadata.quality_source}</Badge>
                                    {/if}
                                    {#if data.riven.media_metadata?.container_format && data.riven.media_metadata.container_format.length > 0}
                                        {#each data.riven.media_metadata.container_format as container}
                                            <Badge variant="outline">{container.toUpperCase()}</Badge>
                                        {/each}
                                    {/if}
                                    {#if data.riven.media_metadata?.is_remux}
                                        <Badge variant="outline">REMUX</Badge>
                                    {/if}
                                    {#if data.riven.media_metadata?.is_proper}
                                        <Badge variant="outline">PROPER</Badge>
                                    {/if}
                                    {#if data.riven.media_metadata?.is_repack}
                                        <Badge variant="outline">REPACK</Badge>
                                    {/if}
                                </div>
                            </div>

                            {#if data.riven.filesystem_entry?.file_size}
                                <div class="flex flex-col gap-1">
                                    <p class="text-primary text-xs">File Size</p>
                                    <p class="text-sm font-medium">
                                        {(data.riven.filesystem_entry.file_size / 1073741824).toFixed(2)} GB
                                    </p>
                                </div>
                            {/if}

                            {#if data.riven.media_metadata?.duration}
                                <div class="flex flex-col gap-1">
                                    <p class="text-primary text-xs">Duration</p>
                                    <p class="text-sm font-medium">
                                        {Math.floor(data.riven.media_metadata.duration / 3600)}h
                                        {Math.floor((data.riven.media_metadata.duration % 3600) / 60)}m
                                        {Math.floor(data.riven.media_metadata.duration % 60)}s
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </section>

            {#if data.mediaDetails?.details.recommendations && data.mediaDetails?.details.recommendations.length > 0}
                <div class="mt-8 flex flex-col">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">Recommendations</h2>
                    <ListCarousel
                        data={data.mediaDetails?.details.recommendations}
                        indexer="tmdb"
                        type="movie" />
                </div>
            {/if}

            {#if data.mediaDetails?.details.similar && data.mediaDetails?.details.similar.length > 0}
                <div class="mt-8 flex flex-col">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">Similar Movies</h2>
                    <ListCarousel
                        data={data.mediaDetails?.details.similar}
                        indexer="tmdb"
                        type="movie" />
                </div>
            {/if}

            {#if data.mediaDetails.type === "movie" && data.mediaDetails?.details.trakt_recommendations && data.mediaDetails?.details.trakt_recommendations.length > 0}
                <div class="mt-8 flex flex-col">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">More Like This (Trakt)</h2>
                    <ListCarousel
                        data={data.mediaDetails?.details.trakt_recommendations}
                        indexer="tmdb"
                        type="movie" />
                </div>
            {/if}
        </div>
    </div>
</div>
