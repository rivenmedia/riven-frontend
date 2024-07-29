<script lang="ts">
    import { onMount } from 'svelte';
    import * as Card from '$lib/components/ui/card';

    export let item: any;
    export let onExpand: (imdb_id: string) => void;
    export let onRemove: (imdb_id: string) => void;

    let extendedItem: any;
    let isLoading = true;

    onMount(async () => {
        try {
            extendedItem = await onExpand(item.imdb_id);
            extendedItem = extendedItem.item;
        } catch (error) {
            console.error('Error fetching extended item:', error);
        } finally {
            isLoading = false;
        }
    });

    function handleRemove() {
        onRemove(item.imdb_id);
    }
    
</script>

{#if isLoading}
    <div class="loading-animation">Loading...</div>
{:else}
    <div class="info mt-4 text-left flex justify-between items-center">
        <div>
            <p><strong>IMDb ID:</strong> {extendedItem.imdb_id}</p>
            <p><strong>Type:</strong> {extendedItem.type}</p>
            <p><strong>State:</strong> {extendedItem.state}</p>
        </div>
        <button class="remove-button p-2 bg-red-500 text-white rounded hover:bg-red-700" on:click={handleRemove}>Remove</button>
    </div>
    {#if item.type === 'Show'}
        <div class="show-info w-full">
            {#each extendedItem.seasons as season}
                <div class="season-info w-full mt-2">
                    <Card.Root>
                        <Card.Title>
                            <div class="season-number mt-2">
                                <span>{season.title}</span>
                            </Card.Title>
                        <Card.Content>
                            {#each season.episodes as episode}
                                <div class="episode-info text-left">
                                    <p>{episode.title}</p>
                                </div>
                            {/each}
                        </Card.Content>
                    </Card.Root>
                </div>
            {/each}
        </div>
    {/if}
{/if}

<style>
    .loading-animation {
        /* Add your loading animation styles here */
        font-size: 1.5em;
        text-align: center;
        margin-top: 20px;
    }
    .remove-button {
        cursor: pointer;
    }
</style>