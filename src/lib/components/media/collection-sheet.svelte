<script lang="ts">
    import * as Sheet from "$lib/components/ui/sheet/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import LandscapeCard from "$lib/components/media/landscape-card.svelte";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import { toast } from "svelte-sonner";
    import { gqlClient } from "$lib/graphql-client";
    import { createScopedLogger } from "$lib/logger";
    import { isMobileStore } from "$lib/stores/global.svelte";
    import { type Snippet } from "svelte";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";

    const logger = createScopedLogger("collection-sheet");

    interface Props {
        collectionId: number;
        collectionName?: string;
        trigger?: Snippet<[{ props: Record<string, unknown> }]>;
        onRequested?: () => void | Promise<void>;
    }

    interface CollectionDetails {
        id: number;
        name: string;
        overview: string | null;
        poster_path: string | null;
        backdrop_path: string | null;
        parts: Array<{
            id: number;
            title: string;
            overview?: string | null;
            poster_path: string | null;
            backdrop_path: string | null;
            release_date?: string | null;
            media_type: "movie";
            year: string;
        }>;
    }

    interface GqlCollectionDetails {
        id: number;
        name: string;
        overview: string | null;
        posterPath: string | null;
        backdropPath: string | null;
        parts: Array<{
            id: number;
            title: string;
            overview?: string | null;
            posterPath: string | null;
            backdropPath: string | null;
            releaseDate?: string | null;
            mediaType: "movie";
            year: string;
        }>;
    }

    let { collectionId, collectionName = "Collection", trigger, onRequested }: Props = $props();

    let open = $state(false);
    let loading = $state(false);
    let requestLoading = $state(false);
    let collectionData = $state<CollectionDetails | null>(null);
    let error = $state<string | null>(null);

    async function fetchCollection() {
        if (collectionData) return; // Already fetched
        loading = true;
        error = null;
        try {
            const data = await gqlClient<{ tmdbCollectionDetails: GqlCollectionDetails }>(
                `query Collection($id: Int!) {
                    tmdbCollectionDetails(id: $id) {
                        id
                        name
                        overview
                        posterPath
                        backdropPath
                        parts {
                            id
                            title
                            overview
                            posterPath
                            backdropPath
                            releaseDate
                            mediaType
                            year
                        }
                    }
                }`,
                { id: collectionId }
            );
            collectionData = {
                ...data.tmdbCollectionDetails,
                poster_path: data.tmdbCollectionDetails.posterPath,
                backdrop_path: data.tmdbCollectionDetails.backdropPath,
                parts: data.tmdbCollectionDetails.parts.map((part) => ({
                    ...part,
                    poster_path: part.posterPath,
                    backdrop_path: part.backdropPath,
                    release_date: part.releaseDate,
                    media_type: part.mediaType
                }))
            } as CollectionDetails;
        } catch (e) {
            logger.error("Failed to fetch collection", e);
            error = "Failed to load collection details.";
        } finally {
            loading = false;
        }
    }

    async function requestAll() {
        if (!collectionData?.parts?.length) return;
        requestLoading = true;

        try {
            const result = await gqlClient<{
                requestItems: {
                    count: number;
                    newItems: { id: number }[];
                    updatedItems: { id: number }[];
                };
            }>(
                `mutation RequestItems($movies: [MovieRequestInput!]!) {
                    requestItems(movies: $movies, shows: []) {
                        count
                        newItems { id }
                        updatedItems { id }
                    }
                }`,
                {
                    movies: collectionData.parts.map((p) => ({
                        title: p.title ?? "Unknown",
                        tmdbId: String(p.id)
                    }))
                }
            );

            const { count, newItems, updatedItems } = result.requestItems;
            const alreadyHad = count - newItems.length - updatedItems.length;

            if (newItems.length > 0) {
                toast.success(`${newItems.length} movie(s) requested!`);
            }
            if (alreadyHad > 0) {
                toast.info(`${alreadyHad} movie(s) already requested.`);
            }
            if (newItems.length === 0 && alreadyHad === 0) {
                toast.info("All movies in this collection have already been requested.");
            }
            void onRequested?.();
            open = false;
        } catch (e) {
            logger.error("Request failed", e);
            toast.error("Failed to request collection.");
        } finally {
            requestLoading = false;
        }
    }

    $effect(() => {
        if (open) {
            fetchCollection();
        }
    });
</script>

<Sheet.Root bind:open>
    <Sheet.Trigger>
        {#snippet child({ props })}
            {#if trigger}
                {@render trigger({ props })}
            {:else}
                <Button variant="outline" class="w-full justify-start" {...props}>
                    View Collection
                </Button>
            {/if}
        {/snippet}
    </Sheet.Trigger>
    <Sheet.Content
        side="right"
        style="width: min(calc(100vw - 1rem), 46rem); max-width: min(calc(100vw - 1rem), 46rem);"
        class="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[side=right]:data-[state=open]:slide-in-from-right-10 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[side=right]:data-[state=closed]:slide-out-to-right-10 flex h-full w-full max-w-[min(100vw-1rem,46rem)] flex-col overflow-hidden border-l border-white/10 bg-zinc-950/95 backdrop-blur-2xl duration-300 ease-out">
        <Sheet.Header class="px-6 pt-6">
            <Sheet.Title class="text-3xl font-black tracking-tight drop-shadow-md"
                >{collectionName}</Sheet.Title>
            <Sheet.Description class="text-muted-foreground text-base"
                >Browse and request movies in this collection.</Sheet.Description>
        </Sheet.Header>

        <div class="mt-6 flex flex-1 flex-col gap-8 overflow-y-auto px-6 pb-4">
            {#if loading}
                <div class="flex h-40 items-center justify-center">
                    <Loader2 class="text-muted-foreground size-8 animate-spin" />
                </div>
            {:else if error}
                <div class="text-destructive flex h-40 items-center justify-center">
                    {error}
                </div>
            {:else if collectionData}
                {#if collectionData.backdrop_path}
                    <div class="relative h-48 w-full overflow-hidden rounded-xl shadow-lg md:h-64">
                        <img
                            src={collectionData.backdrop_path}
                            alt={collectionData.name}
                            class="h-full w-full object-cover" />
                        <div
                            class="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent">
                        </div>
                        <div class="absolute right-6 bottom-6 left-6">
                            <p
                                class="line-clamp-3 text-sm leading-relaxed font-medium text-white/90 drop-shadow-md">
                                {collectionData.overview}
                            </p>
                        </div>
                        <!-- Glass Border -->
                        <div
                            class="pointer-events-none absolute inset-0 rounded-xl border border-white/10">
                        </div>
                    </div>
                {/if}

                <div class="flex items-center gap-3">
                    <div
                        class="bg-primary h-6 w-1 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                    </div>
                    <h3 class="text-foreground text-xl font-bold tracking-tight drop-shadow-md">
                        {collectionData.parts?.length ?? 0} Movies
                    </h3>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {#each collectionData.parts ?? [] as part (part.id)}
                        <a
                            href={resolve(`/details/media/${part.id}/movie`)}
                            class="group block transition-all duration-300 hover:scale-[1.02]"
                            onclick={() => isMobileStore.isMobile && (open = false)}>
                            <LandscapeCard
                                title={part.title}
                                image={part.backdrop_path}
                                overview={part.overview}
                                tmdbId={part.id}
                                mediaType="movie"
                                class="transition-shadow group-hover:shadow-lg">
                                {#snippet meta()}
                                    {#if part.year}
                                        <span
                                            class="text-muted-foreground rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs backdrop-blur-sm">
                                            {part.year}
                                        </span>
                                    {/if}
                                {/snippet}
                            </LandscapeCard>
                        </a>
                    {/each}
                </div>
            {/if}
        </div>

        {#if collectionData?.parts?.length}
            <Sheet.Footer class="border-t border-white/5 bg-black/20 p-6 backdrop-blur-md">
                <Button
                    onclick={requestAll}
                    disabled={requestLoading || !page.data.permissions?.canRequestItems}
                    variant="secondary"
                    class="border-primary/50 bg-primary/20 text-primary hover:bg-primary/30 w-full border shadow-lg backdrop-blur-md transition-all hover:scale-[1.02]">
                    {#if requestLoading}
                        <Loader2 class="mr-2 size-4 animate-spin" />
                    {/if}
                    Request All ({collectionData.parts.length} Movies)
                </Button>
            </Sheet.Footer>
        {/if}
    </Sheet.Content>
</Sheet.Root>
