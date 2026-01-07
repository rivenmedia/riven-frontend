<script lang="ts">
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
        selectedSeasons?: Set<number>;
        class?: string;
    }

    let {
        seasons,
        open,
        selectedSeasons = $bindable(new Set()),
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
            selectedSeasons = new Set(seasons.map((s) => s.season_number));
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

        const newSet = new Set(selectedSeasons);
        if (newSet.has(season.season_number)) {
            newSet.delete(season.season_number);
        } else {
            newSet.add(season.season_number);
        }
        selectedSeasons = newSet;
    }

    function toggleAll() {
        // Get non-locked seasons
        const toggleableSeasons = seasons.filter((s) => !isSeasonLocked(s));
        const lockedSeasons = seasons.filter((s) => isSeasonLocked(s));

        // Check if all toggleable seasons are currently selected
        const allToggleableSelected = toggleableSeasons.every((s) =>
            selectedSeasons.has(s.season_number)
        );

        if (allToggleableSelected) {
            // Deselect all toggleable seasons, keep locked ones selected
            selectedSeasons = new Set(lockedSeasons.map((s) => s.season_number));
        } else {
            // Select all seasons
            selectedSeasons = new Set(seasons.map((s) => s.season_number));
        }
    }

    // Check if all toggleable seasons are selected (for the toggle-all switch state)
    function areAllToggleableSelected(): boolean {
        const toggleableSeasons = seasons.filter((s) => !isSeasonLocked(s));
        if (toggleableSeasons.length === 0) return true;
        return toggleableSeasons.every((s) => selectedSeasons.has(s.season_number));
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
