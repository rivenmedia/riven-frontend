<script lang="ts">
    import { SvelteSet } from "svelte/reactivity";

    export interface SeasonInfo {
        id: number;
        season_number: number;
        episode_count: number;
        name: string;
        status?: string;
    }

    interface Props {
        seasons: SeasonInfo[];
        open: boolean;
        selectedSeasons?: SvelteSet<number>;
        class?: string;
    }

    let {
        seasons,
        open,
        selectedSeasons = $bindable(new SvelteSet()),
        class: className = ""
    }: Props = $props();

    let hasInitialized = $state(false);

    // Check if a season is already available (can't be toggled off)
    function isSeasonLocked(season: SeasonInfo): boolean {
        return season.status === "Available";
    }

    // Get count of toggleable (non-locked) seasons
    $effect(() => {
        if (open && seasons.length > 0 && !hasInitialized) {
            // Select all seasons by default
            selectedSeasons.clear();
            for (const s of seasons) {
                selectedSeasons.add(s.season_number);
            }
            hasInitialized = true;
        }
        // Reset hasInitialized when dialog closes so next open re-initializes
        if (!open) {
            hasInitialized = false;
        }
    });

    function toggleSeason(season: SeasonInfo) {
        // Don't allow toggling locked (Available) seasons
        if (isSeasonLocked(season)) return;

        if (selectedSeasons.has(season.season_number)) {
            selectedSeasons.delete(season.season_number);
        } else {
            selectedSeasons.add(season.season_number);
        }
    }
</script>

<div class="{className} flex w-full flex-col gap-0.5">
    {#each seasons as season (season.id)}
        {@const locked = isSeasonLocked(season)}
        {@const selected = selectedSeasons.has(season.season_number)}
        <button
            class="group hover:bg-muted/30 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-all {locked
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'} {selected && !locked
                ? 'text-primary font-bold'
                : 'text-foreground font-medium'}"
            onclick={() => toggleSeason(season)}
            disabled={locked}
            title={season.name}>
            <span>Season {season.season_number}</span>

            {#if locked}
                <span class="text-xs font-normal opacity-70">Installed</span>
            {:else}
                <span class="text-muted-foreground text-xs font-normal opacity-70"
                    >{season.episode_count} eps</span>
            {/if}
        </button>
    {/each}
</div>
