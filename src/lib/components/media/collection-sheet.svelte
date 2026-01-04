<script lang="ts">
    import * as Sheet from "$lib/components/ui/sheet/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import LandscapeCard from "$lib/components/media/landscape-card.svelte";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import Mountain from "@lucide/svelte/icons/mountain";
    import Star from "@lucide/svelte/icons/star";
    import { toast } from "svelte-sonner";
    import providers from "$lib/providers";
    import { createScopedLogger } from "$lib/logger";

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
    let collectionData = $state<any>(null); // Type this properly if possible
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
            console.error(e);
            error = "Failed to load collection details.";
        } finally {
            loading = false;
        }
    }

    async function requestAll() {
        if (!collectionData?.parts?.length) return;
        requestLoading = true;
        const ids = collectionData.parts.map((p: any) => p.id?.toString()).filter(Boolean);

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
                    <div class="relative h-48 w-full overflow-hidden rounded-lg md:h-64">
                        <img
                            src={collectionData.backdrop_path}
                            alt={collectionData.name}
                            class="h-full w-full object-cover" />
                        <div class="bg-background/60 absolute inset-0"></div>
                        <div class="absolute right-4 bottom-4 left-4">
                            <p class="text-foreground line-clamp-3 text-sm font-medium">
                                {collectionData.overview}
                            </p>
                        </div>
                    </div>
                {/if}

                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">
                        {collectionData.parts?.length ?? 0} Movies
                    </h3>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {#each collectionData.parts ?? [] as part (part.id)}
                        <a href="/details/media/{part.id}/movie" class="block">
                            <LandscapeCard
                                title={part.title}
                                image={part.backdrop_path}
                                overview={part.overview}
                                tmdbId={part.id}
                                mediaType="movie"
                                initialRating={part.vote_average}>
                                {#snippet meta()}
                                    {#if part.year}
                                        <span
                                            class="border-border bg-muted/50 text-muted-foreground rounded-full border px-2 py-0.5 text-xs">
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
            <Sheet.Footer class="border-border border-t px-6 pt-4">
                <Button onclick={requestAll} disabled={requestLoading} class="w-full">
                    {#if requestLoading}
                        <Loader2 class="mr-2 size-4 animate-spin" />
                    {/if}
                    Request All ({collectionData.parts.length} Movies)
                </Button>
            </Sheet.Footer>
        {/if}
    </Sheet.Content>
</Sheet.Root>
