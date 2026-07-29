<script lang="ts">
    export interface SeasonInfo {
        id: number;
        season_number: number;
        episode_count: number;
        completed_count?: number;
        name: string;
        status?: string;
    }

    interface Props {
        seasons: SeasonInfo[];
        selectedSeasons: number[];
        onToggle: (seasonNumber: number) => void;
        class?: string;
    }

    let { seasons, selectedSeasons, onToggle, class: className = "" }: Props = $props();

    function isSeasonLocked(season: SeasonInfo): boolean {
        return season.status === "Available";
    }
</script>

<div class="{className} flex max-h-60 w-full flex-col gap-0.5 overflow-y-auto">
    {#each seasons as season (season.id)}
        {@const locked = isSeasonLocked(season)}
        {@const selected = selectedSeasons.includes(season.season_number)}
        <button
            class="group hover:bg-muted/30 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-all {locked
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'} {selected && !locked
                ? 'text-primary font-bold'
                : 'text-foreground font-medium'}"
            onclick={() => onToggle(season.season_number)}
            disabled={locked}
            title={season.name}>
            <span>Season {season.season_number}</span>

            {#if locked}
                <span class="text-xs font-normal opacity-70">Complete</span>
            {:else if season.completed_count != null && season.episode_count > 0}
                <span class="text-muted-foreground text-xs font-normal opacity-70"
                    >{season.completed_count}/{season.episode_count} eps</span>
            {:else}
                <span class="text-muted-foreground text-xs font-normal opacity-70"
                    >{season.episode_count} eps</span>
            {/if}
        </button>
    {/each}
</div>
