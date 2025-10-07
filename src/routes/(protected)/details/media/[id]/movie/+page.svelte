<script lang="ts">
    import type { PageProps } from "./$types";
    import { TMDB_IMAGE_BASE_URL } from "$lib/providers";
    import { AspectRatio } from "$lib/components/ui/aspect-ratio/index.js";
    import Tooltip from "$lib/components/tooltip.svelte";
    import ListCarousel from "$lib/components/list-carousel.svelte";

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
                <img
                    alt={data.details.id.toString()}
                    class="h-96 w-full rounded-lg object-cover object-center shadow-lg lg:h-[30rem] xl:h-[32rem] 2xl:h-[34rem]"
                    src="{TMDB_IMAGE_BASE_URL}/original{data.details.backdrop_path}"
                    loading="lazy" />
            </AspectRatio>

            {#if data.details.images && data.details.images.logos && data.details.images.logos.length > 0}
                {@const logo = data.details.images.logos[0]}
                <div class="absolute inset-0 flex items-end p-4">
                    <div
                        class={`overflow-hidden ${
                            logo.aspect_ratio > 3
                                ? "max-h-[60px] max-w-[220px]"
                                : logo.aspect_ratio > 2.5
                                  ? "max-h-[70px] max-w-[200px]"
                                  : logo.aspect_ratio < 1
                                    ? "max-h-[90px] max-w-[100px]"
                                    : "max-h-[80px] max-w-[180px]"
                        }`}>
                        <img
                            alt="Movie logo"
                            class="h-auto w-full object-contain drop-shadow-lg"
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
                    class="mr-6 hidden h-48 w-32 rounded-lg object-cover object-center shadow-md sm:h-64 sm:w-44 md:block md:h-72 md:w-48 lg:h-80 lg:w-52"
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
                        {/if}
                    </div>

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
                                                        class="mb-1 size-16 rounded-full object-cover object-center shadow-md"
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
                            class="text-center text-lg font-bold underline drop-shadow-md">
                            {data.details.belongs_to_collection.name}
                        </a>
                    </div>
                </div>
            {/if}

            {#if data.details.recommendations && data.details.recommendations.results.length > 0}
                <div class="mt-8 flex flex-col">
                    <h2 class="mb-4 text-lg font-bold">Recommendations</h2>
                    <ListCarousel data={derivedRecommendationsResult} indexer="tmdb" type="movie" />
                </div>
            {/if}

            {#if data.details.similar && data.details.similar.results.length > 0}
                <div class="mt-8 flex flex-col">
                    <h2 class="mb-4 text-lg font-bold">Similar Movies</h2>
                    <ListCarousel data={derivedSimilarResult} indexer="tmdb" type="movie" />
                </div>
            {/if}
        </div>
    </div>
</div>
