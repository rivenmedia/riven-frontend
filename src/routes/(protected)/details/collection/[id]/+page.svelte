<script lang="ts">
    import { type PageProps } from "./$types";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import MediaCard from "$lib/components/media/media-card.svelte";

    let { data }: PageProps = $props();
    $inspect(data);
</script>

<svelte:head>
    <title>{data.collection.name} - Riven</title>
</svelte:head>

<div class="relative flex flex-col">
    <div class="fixed bottom-0 left-0 z-1 h-screen w-full">
        <span>
            <img
                alt={data.collection.name}
                class="h-full w-full object-cover opacity-50 blur-2xl"
                src={data.collection.backdrop_path}
                loading="lazy" />
            <div class="bg-background/70 absolute right-0 bottom-0 left-0 h-full w-full"></div>
            <div
                class="to-background absolute right-0 bottom-0 left-0 h-full w-full bg-linear-to-b from-transparent to-100%">
            </div>
        </span>
    </div>
    <div class="z-1 mt-14 flex h-full w-full flex-col gap-0 space-y-0 p-8 md:px-16">
        <div
            class="relative flex h-96 items-end justify-between overflow-hidden rounded-lg bg-cover bg-center bg-no-repeat p-8 lg:h-120 xl:h-128 2xl:h-136"
            style="background-image: url('{data.collection.backdrop_path}');">
            <div>
                <h1 class="text-2xl font-bold drop-shadow-md md:text-3xl lg:text-4xl">
                    {data.collection.name}
                </h1>
            </div>
        </div>

        <div class="md:px-8 lg:px-16">
            <div
                class="border-border mt-6 flex flex-col rounded-lg border bg-white/10 px-6 py-4 shadow-lg">
                <div class="flex flex-row">
                    <img
                        alt={data.collection.name}
                        class="mr-6 hidden h-48 w-32 rounded-lg object-cover object-center shadow-md transition-transform duration-300 hover:scale-105 sm:h-64 sm:w-44 md:block md:h-72 md:w-48 lg:h-80 lg:w-52"
                        src={data.collection.poster_path
                            ? data.collection.poster_path
                            : "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/default.jpg"}
                        loading="lazy" />

                    <div class="flex flex-col">
                        <h2 class="mb-2 text-xl font-bold drop-shadow-md">
                            {data.collection.name}
                        </h2>

                        {#if data.collection.overview}
                            <p class="max-w-max text-sm leading-relaxed">
                                {data.collection.overview}
                            </p>
                        {/if}

                        <div class="mt-4">
                            <Badge variant="outline">
                                {data.collection.parts.length}
                                {data.collection.parts.length === 1 ? "Movie" : "Movies"}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <section class="mt-8">
                <h2 class="mb-4 text-lg font-bold drop-shadow-md">Movies in Collection</h2>

                <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {#each data.collection.parts as movie (movie.id)}
                        <MediaCard
                            href="/details/media/{movie.id}/movie"
                            title={movie.title}
                            posterPath={movie.poster_path}
                            metadata={movie.year?.toString() ?? null}
                            rating={movie.vote_average}
                            overview={movie.overview}
                            layout="horizontal" />
                    {/each}
                </div>
            </section>
        </div>
    </div>
</div>
