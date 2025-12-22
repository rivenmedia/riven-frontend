<script lang="ts">
    import { Switch } from "$lib/components/ui/switch/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";

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

<div class="max-h-[60vh] overflow-y-auto rounded-md border p-2 {className}">
    <div class="mb-2 flex items-center justify-between border-b px-2 pb-2">
        <span class="text-sm font-bold">Select Seasons</span>
        <div class="flex items-center gap-2">
            <span class="text-muted-foreground text-xs">{selectedSeasons.size} selected</span>
            <Switch checked={areAllToggleableSelected()} onCheckedChange={toggleAll} />
        </div>
    </div>
    <div class="flex flex-col gap-1">
        {#each seasons as season (season.id)}
            {@const locked = isSeasonLocked(season)}
            <div
                class="flex items-center justify-between rounded-md p-2 transition-colors
                    {locked ? 'opacity-60' : 'hover:bg-muted/50'}">
                <div class="flex items-center gap-4">
                    <Switch
                        checked={selectedSeasons.has(season.season_number)}
                        disabled={locked}
                        onCheckedChange={() => toggleSeason(season)} />
                    <div class="flex flex-col">
                        <span class="font-medium {locked ? 'text-muted-foreground' : ''}"
                            >{season.name}</span>
                        <span class="text-muted-foreground text-xs"
                            >{season.episode_count} Episodes</span>
                    </div>
                </div>
                {#if season.status}
                    <Badge variant={season.status === "Available" ? "default" : "secondary"}>
                        {season.status}
                    </Badge>
                {/if}
            </div>
        {/each}
    </div>
</div>
