<script lang="ts">
    import type { PageProps } from "./$types";
    import { TMDB_IMAGE_BASE_URL } from "$lib/providers";
    import { AspectRatio } from "$lib/components/ui/aspect-ratio/index.js";
    import Tooltip from "$lib/components/tooltip.svelte";
    import ListCarousel from "$lib/components/list-carousel.svelte";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import Play from "@lucide/svelte/icons/play";
    import { Button } from "$lib/components/ui/button/index.js";
    import X from "@lucide/svelte/icons/x";

    let { data }: PageProps = $props();
    $inspect(data);

    const hours = Math.floor(data.details.runtime / 60);
    const minutes = data.details.runtime % 60;
    const formattedRuntime = `${hours}h ${minutes}m`;

    function transformTMDBList(items) {
        return items?.map((item) => ({
            id: item.id,
            title: item.title || item.original_title,
            poster_path: item.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}` : null,
            media_type: "movie",
            year: item.release_date ? new Date(item.release_date).getFullYear() : "N/A"
        }));
    }

    const derivedRecommendationsResult = $derived.by(() => {
        return transformTMDBList(data.details.recommendations?.results || []);
    });

    const derivedSimilarResult = $derived.by(() => {
        return transformTMDBList(data.details.similar?.results || []);
    });

    const externalMetaData = {
        imdb_id: {
            name: "IMDb",
            baseUrl: "https://www.imdb.com/title/"
        },
        facebook_id: {
            name: "Facebook",
            baseUrl: "https://www.facebook.com/"
        },
        instagram_id: {
            name: "Instagram",
            baseUrl: "https://www.instagram.com/"
        },
        twitter_id: {
            name: "Twitter",
            baseUrl: "https://www.twitter.com/"
        }
    };

    const bestTrailer = $derived.by(() => {
        const officialTrailers =
            data.details.videos?.results?.filter(
                (video) => video.type === "Trailer" && video.official === true
            ) || [];

        const sorted = officialTrailers.sort((a, b) => {
            if (b.size !== a.size) return b.size - a.size;
            return new Date(b.published_at) - new Date(a.published_at);
        });

        return sorted.length > 0 ? sorted[0] : null;
    });

    let showTrailer = $state(false);

    function toggleTrailer() {
        console.log("Toggling trailer. Current state:", showTrailer);
        if (bestTrailer) {
            showTrailer = !showTrailer;
        }
    }
</script>

<svelte:head>
    <title>{data.details.title} ({data.details.release_date?.slice(0, 4)}) - Riven</title>
</svelte:head>

<div class="relative flex flex-col">
    <div class="fixed bottom-0 left-0 z-1 h-screen w-full">
        <span>
            <img
                alt={data.details.id.toString()}
                class="h-full w-full object-cover opacity-50 blur-2xl"
                src="https://www.themoviedb.org/t/p/original{data.details.backdrop_path}"
                loading="lazy" />
            <div class="bg-background/70 absolute right-0 bottom-0 left-0 h-full w-full"></div>
            <div
                class="to-background absolute right-0 bottom-0 left-0 h-full w-full bg-gradient-to-b from-transparent to-100%">
            </div>
        </span>
    </div>
    <div class="z-1 mt-14 flex h-full w-full flex-col gap-0 space-y-0 p-8 md:px-24">
        <div class="relative h-96 lg:h-[30rem] xl:h-[32rem] 2xl:h-[34rem]">
            <AspectRatio ratio={16 / 9} class="w-full">
                {#if showTrailer && bestTrailer}
                    <div class="relative">
                        <iframe
                            class="h-96 w-full rounded-lg object-cover object-center shadow-lg lg:h-[30rem] xl:h-[32rem] 2xl:h-[34rem]"
                            src="https://www.youtube-nocookie.com/embed/{bestTrailer.key}?autoplay=1&controls=0&mute=0&disablekb=1&loop=1&rel=0&modestbranding=1&playsinline=1"
                            title={bestTrailer.name || data.details.title + " Trailer"}
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
                {:else if data.details.backdrop_path}
                    <div class="relative">
                        <img
                            alt={data.details.id.toString()}
                            class="h-96 w-full rounded-lg object-cover object-center shadow-lg lg:h-[30rem] xl:h-[32rem] 2xl:h-[34rem]"
                            src="{TMDB_IMAGE_BASE_URL}/original{data.details.backdrop_path}"
                            loading="lazy" />

                        {#if bestTrailer}
                            <Button
                                variant="ghost"
                                class="absolute right-4 bottom-4 z-2 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:scale-105"
                                onclick={toggleTrailer}
                                aria-label="Play Trailer">
                                <Play size={18} />
                            </Button>
                        {/if}
                    </div>
                {/if}
            </AspectRatio>

            {#if !showTrailer && data.details.images && data.details.images.logos && data.details.images.logos.length > 0}
                {@const logo = data.details.images.logos[0]}
                <div class="absolute inset-0 flex items-end p-4">
                    <div>
                        <img
                            alt="Movie logo"
                            class="h-14 w-full object-contain drop-shadow-lg md:h-20 lg:h-24"
                            src="{TMDB_IMAGE_BASE_URL}/w500{logo.file_path}"
                            loading="lazy" />
                    </div>
                </div>
            {/if}
        </div>

        <div class="md:px-8 lg:px-16">
            <div
                class="border-border mt-6 flex flex-row rounded-lg border bg-white/10 px-6 py-4 shadow-lg">
                <img
                    alt={data.details.title}
                    class="mr-6 hidden h-48 w-32 rounded-lg object-cover object-center shadow-md transition-transform duration-300 hover:scale-105 sm:h-64 sm:w-44 md:block md:h-72 md:w-48 lg:h-80 lg:w-52"
                    src={data.details.poster_path
                        ? `${TMDB_IMAGE_BASE_URL}/w500${data.details.poster_path}`
                        : "https://avatar.iran.liara.run/public"}
                    loading="lazy" />

                <div class="flex flex-col">
                    <h1 class="mb-2 text-xl font-bold drop-shadow-md">
                        {data.details.title}
                    </h1>

                    {#if data.details.tagline}
                        <p class="text-primary-foreground/70 mb-2 text-sm font-semibold italic">
                            {data.details.tagline}
                        </p>
                    {/if}

                    <div class="mb-3 flex flex-wrap gap-1.5 text-sm font-semibold">
                        {#if data.details.release_date}
                            <span>{data.details.release_date?.slice(0, 4)}</span>
                            <span>•</span>
                        {/if}

                        {#if data.details.runtime}
                            <span>{formattedRuntime}</span>
                            <span>•</span>
                        {/if}

                        {#if data.details.original_language}
                            <span>{data.details.original_language?.toUpperCase()}</span>
                            <span>•</span>
                        {/if}

                        {#if data.details.status}
                            <span>{data.details.status}</span>
                        {/if}
                    </div>

                    {#if data.details.genres && data.details.genres.length > 0}
                        <div class="mb-3 flex flex-wrap gap-2">
                            {#each data.details.genres as genre (genre.id)}
                                <Badge variant="outline">
                                    {genre.name}
                                </Badge>
                            {/each}
                        </div>
                    {/if}

                    <div class="flex flex-col gap-8">
                        <p class="max-w-max text-sm leading-relaxed">
                            {data.details.overview}
                        </p>

                        <div class="flex flex-wrap">
                            {#each data.details.credits.cast as cast, index (cast.id)}
                                {#if index < 8}
                                    <div class="flex flex-col items-center">
                                        <Tooltip>
                                            {#snippet trigger()}
                                                <a href="/media/person/tmdb/{cast.id}">
                                                    <img
                                                        alt={cast.name}
                                                        class="mb-1 size-16 rounded-full object-cover object-center shadow-md ring-2 ring-white/10 transition-transform duration-300 hover:scale-110 hover:ring-white/30"
                                                        src={cast.profile_path
                                                            ? `${TMDB_IMAGE_BASE_URL}/w200${cast.profile_path}`
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

            {#if data.details.belongs_to_collection}
                <h2 class="mt-8 mb-4 text-lg font-bold">Part of the collection</h2>
                <div class="relative">
                    <img
                        alt={data.details.belongs_to_collection.name}
                        class="h-28 w-full rounded-lg object-cover object-center shadow-lg"
                        src="{TMDB_IMAGE_BASE_URL}/original{data.details.belongs_to_collection
                            .backdrop_path}"
                        loading="lazy" />
                    <div class="bg-background/70 absolute right-0 bottom-0 left-0 h-full w-full">
                    </div>

                    <div class="absolute inset-0 flex items-center justify-center p-4">
                        <a
                            href={`/details/collection/${data.details.belongs_to_collection.id}`}
                            class="text-center text-lg font-bold underline drop-shadow-lg transition-all duration-200 hover:scale-105">
                            {data.details.belongs_to_collection.name}
                        </a>
                    </div>
                </div>
            {/if}

            <section>
                <h2 class="mt-8 mb-4 text-lg font-bold drop-shadow-md">More Details</h2>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div
                        class="border-border flex flex-col gap-2 rounded-lg border bg-white/10 px-6 py-4 shadow-lg">
                        {#if data.details.budget}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary-foreground/70 text-xs">Budget</p>
                                <p class="text-sm font-medium">
                                    {data.details.budget
                                        ? new Intl.NumberFormat("en-US", {
                                              style: "currency",
                                              currency: "USD",
                                              maximumFractionDigits: 0
                                          }).format(data.details.budget)
                                        : "N/A"}
                                </p>
                            </div>
                        {/if}

                        {#if data.details.revenue}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary-foreground/70 text-xs">Revenue</p>
                                <p class="text-sm font-medium">
                                    {data.details.revenue
                                        ? new Intl.NumberFormat("en-US", {
                                              style: "currency",
                                              currency: "USD",
                                              maximumFractionDigits: 0
                                          }).format(data.details.revenue)
                                        : "N/A"}
                                </p>
                            </div>
                        {/if}

                        {#if data.details.homepage}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary-foreground/70 text-xs">Homepage</p>
                                {#if data.details.homepage}
                                    <a
                                        href={data.details.homepage}
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

                        {#if data.details.origin_country && data.details.origin_country.length > 0}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary-foreground/70 text-xs">Origin Country</p>
                                <p class="text-sm font-medium">
                                    {data.details.origin_country.length > 0
                                        ? data.details.origin_country.join(", ")
                                        : "N/A"}
                                </p>
                            </div>
                        {/if}

                        {#if data.details.production_companies && data.details.production_companies.length > 0}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary-foreground/70 text-xs">
                                    Production Companies
                                </p>
                                <div class="flex flex-row flex-wrap">
                                    {#each data.details.production_companies as company, index (company.id)}
                                        <Tooltip>
                                            {#snippet trigger()}
                                                <div class="mr-2 mb-2 inline-block">
                                                    <img
                                                        alt={company.name}
                                                        class="h-6 w-auto rounded object-contain object-center shadow-md transition-transform duration-300 hover:scale-105"
                                                        src={company.logo_path
                                                            ? `${TMDB_IMAGE_BASE_URL}/w200${company.logo_path}`
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
                                </div>
                            </div>
                        {/if}

                        {#if data.details.spoken_languages && data.details.spoken_languages.length > 0}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary-foreground/70 text-xs">Spoken Languages</p>
                                <p class="text-sm font-medium">
                                    {data.details.spoken_languages.length > 0
                                        ? data.details.spoken_languages
                                              .map((lang) => lang.english_name)
                                              .join(", ")
                                        : "N/A"}
                                </p>
                            </div>
                        {/if}

                        {#if data.details.external_ids}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary-foreground/70 text-xs">External Links</p>

                                <div class="flex flex-row flex-wrap items-center">
                                    {#each Object.entries(data.details.external_ids) as [key, value] (key)}
                                        {#if value && externalMetaData[key]}
                                            <a
                                                href={`${externalMetaData[key].baseUrl}${value}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="mr-4 text-sm font-medium underline hover:opacity-80">
                                                {externalMetaData[key].name}
                                            </a>
                                        {/if}
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        {#if data.details.external_ids.imdb_id}
                            <div class="flex flex-col gap-1">
                                <p class="text-primary-foreground/70 text-xs">Parental Guide</p>
                                <a
                                    href={`https://www.imdb.com/title/${data.details.external_ids.imdb_id}/parentalguide/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="mr-4 text-sm font-medium underline hover:opacity-80">
                                    IMDB Parental Guide
                                </a>
                            </div>
                        {/if}
                    </div>
                </div>
            </section>

            {#if data.details.recommendations && data.details.recommendations.results.length > 0}
                <div class="mt-8 flex flex-col">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">Recommendations</h2>
                    <ListCarousel data={derivedRecommendationsResult} indexer="tmdb" type="movie" />
                </div>
            {/if}

            {#if data.details.similar && data.details.similar.results.length > 0}
                <div class="mt-8 flex flex-col">
                    <h2 class="mb-4 text-lg font-bold drop-shadow-md">Similar Movies</h2>
                    <ListCarousel data={derivedSimilarResult} indexer="tmdb" type="movie" />
                </div>
            {/if}
        </div>
    </div>
</div>
