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

    // Initialize selectedSeasons when dialog opens
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

    function toggleSeason(seasonNumber: number) {
        const newSet = new Set(selectedSeasons);
        if (newSet.has(seasonNumber)) {
            newSet.delete(seasonNumber);
        } else {
            newSet.add(seasonNumber);
        }
        selectedSeasons = newSet;
    }

    function toggleAll() {
        // Switch is checked when all seasons are selected
        // Clicking should toggle between all selected and none selected
        if (selectedSeasons.size === seasons.length) {
            // All are selected, deselect all
            selectedSeasons = new Set();
        } else {
            // Not all are selected, select all
            selectedSeasons = new Set(seasons.map((s) => s.season_number));
        }
    }
</script>

<div class="max-h-[60vh] overflow-y-auto rounded-md border p-2 {className}">
    <div class="mb-2 flex items-center justify-between border-b px-2 pb-2">
        <span class="text-sm font-bold">Select Seasons</span>
        <div class="flex items-center gap-2">
            <span class="text-muted-foreground text-xs">{selectedSeasons.size} selected</span>
            <Switch checked={selectedSeasons.size === seasons.length} onCheckedChange={toggleAll} />
        </div>
    </div>
    <div class="flex flex-col gap-1">
        {#each seasons as season (season.id)}
            <div
                class="hover:bg-muted/50 flex items-center justify-between rounded-md p-2 transition-colors">
                <div class="flex items-center gap-4">
                    <Switch
                        checked={selectedSeasons.has(season.season_number)}
                        onCheckedChange={() => toggleSeason(season.season_number)} />
                    <div class="flex flex-col">
                        <span class="font-medium">{season.name}</span>
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
