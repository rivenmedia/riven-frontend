<script lang="ts">
    import * as Sheet from "$lib/components/ui/sheet/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import LandscapeCard from "$lib/components/media/landscape-card.svelte";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import { toast } from "svelte-sonner";
    import providers from "$lib/providers";
    import { createScopedLogger } from "$lib/logger";
    import { isMobileStore } from "$lib/stores/global.svelte";
    import type { CollectionDetails } from "$lib/providers/parser";

    import { type Snippet } from "svelte";

    const logger = createScopedLogger("collection-sheet");

    interface Props {
        collectionId: number;
        collectionName?: string;
        trigger?: Snippet<[{ props: Record<string, unknown> }]>;
    }

    let { collectionId, collectionName = "Collection", trigger }: Props = $props();

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
            const res = await fetch(`/api/collection/${collectionId}`);
            if (!res.ok) throw new Error("Failed to fetch collection");
            const data = await res.json();
            collectionData = data.collection;
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
        const ids = collectionData.parts.map((p) => p.id.toString());

        try {
            const response = await providers.riven.POST("/api/v1/items/add", {
                body: {
                    media_type: "movie",
                    tmdb_ids: ids,
                    tvdb_ids: []
                }
            });

            if (response.data) {
                toast.success("All movies in collection requested!");
                open = false;
            } else {
                logger.error("Error response:", response.error);
                toast.error("Failed to request collection.");
            }
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
        class="flex w-full flex-col overflow-hidden sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <Sheet.Header class="px-6">
            <Sheet.Title class="text-2xl font-bold">{collectionName}</Sheet.Title>
            <Sheet.Description>Browse and request movies in this collection.</Sheet.Description>
        </Sheet.Header>

        <div class="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-4">
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
                            class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
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
                        class="bg-primary h-5 w-1 rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]">
                    </div>
                    <h3 class="text-lg font-bold tracking-tight">
                        {collectionData.parts?.length ?? 0} Movies
                    </h3>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {#each collectionData.parts ?? [] as part (part.id)}
                        <!-- svelte-ignore svelte/no-navigation-without-resolve -->
                        <a
                            href="/details/media/{part.id}/movie"
                            class="group block transition-all duration-300 hover:scale-[1.02]"
                            onclick={() => isMobileStore.isMobile && (open = false)}>
                            <LandscapeCard
                                title={part.title}
                                image={part.backdrop_path}
                                overview={part.overview}
                                tmdbId={part.id}
                                mediaType="movie"
                                initialRating={part.vote_average ?? undefined}
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
                    disabled={requestLoading}
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
