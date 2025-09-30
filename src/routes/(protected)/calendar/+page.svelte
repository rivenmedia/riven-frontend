<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import Film from "@lucide/svelte/icons/film";
    import Tv from "@lucide/svelte/icons/tv";
    import type { PageData } from "./$types";
    import { cn } from "$lib/utils";
    import { IsMobile } from "$lib/hooks/is-mobile.svelte";

    let { data }: { data: PageData } = $props();
    const isMobile = $state(new IsMobile(1280));

    interface EntertainmentItem {
        trakt_id: string;
        imdb_id: string | null;
        tvdb_id: string | null;
        tmdb_id: string;
        aired_at: string;
        title: string;
        season?: number;
        episode?: number;
    }

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let currentDate = $state(new Date());
    let showMovies = $state(true);
    let showEpisodes = $state(true);

    const itemsByDate = $derived.by(() => {
        const items: EntertainmentItem[] = Object.values(
            data.calendar?.data || {}
        ) as EntertainmentItem[];

        const result: Record<string, EntertainmentItem[]> = {};

        items.forEach((item) => {
            const date = new Date(item.aired_at);
            const dateKey = date.toISOString().split("T")[0];
            if (!result[dateKey]) {
                result[dateKey] = [];
            }
            result[dateKey].push(item);
        });

        return result;
    });

    const filteredItemsByDate = $derived.by(() => {
        const result: Record<string, EntertainmentItem[]> = {};

        for (const [dateKey, items] of Object.entries(itemsByDate)) {
            result[dateKey] = items.filter((item) => {
                if (item.season && !showEpisodes) return false;
                if (!item.season && !showMovies) return false;
                return true;
            });
        }

        return result;
    });

    interface CalendarDay {
        date: Date;
        dateKey: string;
        isCurrentMonth: boolean;
        items: EntertainmentItem[];
        day: number;
        dayOfWeek: number;
    }

    const calendarDays: CalendarDay[] = $derived.by(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startOffset = firstDay.getDay();
        const totalDays = startOffset + lastDay.getDate() + (6 - lastDay.getDay());
        const rows = Math.ceil(totalDays / 7);
        const daysToShow = rows * 7;

        const days: CalendarDay[] = [];

        for (let i = 0; i < daysToShow; i++) {
            const dayNum = 1 - startOffset + i;
            const currentDay = new Date(year, month, dayNum);
            const dateKey = currentDay.toISOString().split("T")[0];
            const isCurrentMonth = currentDay.getMonth() === month;
            const items = filteredItemsByDate[dateKey] || [];

            days.push({
                date: currentDay,
                dateKey,
                isCurrentMonth,
                items,
                day: currentDay.getDate(),
                dayOfWeek: currentDay.getDay()
            });
        }

        return days;
    });

    function navigateMonth(direction: "prev" | "next") {
        if (direction === "prev") {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        } else {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        }
    }

    function formatDayTitle(date: Date) {
        return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
    }
</script>

{#snippet itemIcon(item: EntertainmentItem, size = 4)}
    {#if item.season}
        <Tv class={`h-${size} w-${size} flex-shrink-0 text-blue-400`} />
    {:else}
        <Film class={`h-${size} w-${size} flex-shrink-0 text-orange-400`} />
    {/if}
{/snippet}

{#snippet entertainmentItem(item: EntertainmentItem, compact = false)}
    <div
        class={cn(
            "flex items-center rounded transition-colors",
            compact ? "gap-1 truncate p-1" : "gap-3 p-2",
            item.season
                ? [
                      "border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30",
                      compact && "text-blue-300"
                  ]
                : [
                      "border border-orange-500/30 bg-orange-500/20 hover:bg-orange-500/30",
                      compact && "text-orange-300"
                  ]
        )}
        title={compact
            ? `${item.title}${item.season ? ` S${item.season}E${item.episode}` : ""}`
            : undefined}>
        {@render itemIcon(item, compact ? 3 : 4)}

        <div class="min-w-0 flex-1">
            <div class={cn(compact && "truncate", `text-${compact ? "xs" : "xs font-medium"}`)}>
                {item.title}
                {#if item.season && compact}
                    S{item.season}E{item.episode}
                {/if}
            </div>
            {#if item.season && !compact}
                <div class="text-muted-foreground text-xs">
                    {compact
                        ? `S${item.season}E${item.episode}`
                        : `Season ${item.season}, Episode ${item.episode}`}
                </div>
            {/if}
        </div>
    </div>
{/snippet}

{#snippet dayItemsList(day: CalendarDay, limit = Infinity, showMore = false)}
    <div class="space-y-1">
        {#each day.items.slice(0, limit) as item, itemIndex (item.trakt_id)}
            {@render entertainmentItem(item, limit !== Infinity)}
        {/each}

        {#if showMore && day.items.length > limit}
            <Dialog.Root>
                <Dialog.Trigger>
                    <p
                        class="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors">
                        +{day.items.length - limit} more
                    </p>
                </Dialog.Trigger>
                <Dialog.Content class="max-w-md">
                    <Dialog.Header>
                        <Dialog.Title class="text-lg font-bold">
                            {formatDayTitle(day.date)}
                        </Dialog.Title>
                        <Dialog.Description>
                            {day.items.length} item{day.items.length !== 1 ? "s" : ""}
                        </Dialog.Description>
                    </Dialog.Header>
                    <div class="mt-4 max-h-96 space-y-2 overflow-y-auto">
                        {#each day.items as item (item.trakt_id)}
                            {@render entertainmentItem(item)}
                        {/each}
                    </div>
                </Dialog.Content>
            </Dialog.Root>
        {/if}
    </div>
{/snippet}

{#snippet calendarDayCard(day: CalendarDay)}
    <div
        class={cn(
            "min-h-[120px] rounded-lg border p-2 transition-colors",
            day.isCurrentMonth
                ? "bg-card border-border hover:bg-accent/50"
                : "bg-muted/30 border-muted text-muted-foreground"
        )}>
        <div class="mb-2 text-base font-medium">{day.day}</div>
        {@render dayItemsList(day, 3, true)}
    </div>
{/snippet}

{#snippet mobileDayCard(day: CalendarDay)}
    <div class="bg-card border-border rounded-lg border p-3">
        <div class="mb-3 flex items-center justify-between">
            <div class="text-lg font-semibold">
                {formatDayTitle(day.date)}
            </div>
            <div class="text-muted-foreground text-sm">
                {day.items.length} item{day.items.length !== 1 ? "s" : ""}
            </div>
        </div>
        {@render dayItemsList(day)}
    </div>
{/snippet}

<div class="h-full w-full p-6 md:p-8 md:px-16">
    <Card.Root class="mb-4 md:mb-6">
        <Card.Header class="pb-4">
            <div class="flex items-center justify-between">
                <Button variant="outline" size="sm" onclick={() => navigateMonth("prev")}>
                    <ChevronLeft class="h-4 w-4" />
                </Button>

                <Card.Title class="text-xl font-bold md:text-2xl">
                    {monthNames[currentDate.getMonth()]}
                    {currentDate.getFullYear()}
                </Card.Title>

                <Button variant="outline" size="sm" onclick={() => navigateMonth("next")}>
                    <ChevronRight class="h-4 w-4" />
                </Button>
            </div>
            <div class="mt-4 flex items-center justify-center gap-6 border-t pt-4">
                <div class="flex items-center space-x-2">
                    <Checkbox
                        id="movies"
                        checked={showMovies}
                        onCheckedChange={(checked) => (showMovies = !!checked)} />
                    <label
                        for="movies"
                        class="flex cursor-pointer items-center gap-2 text-sm font-medium">
                        <Film class="h-4 w-4 text-orange-400" />
                        Movies
                    </label>
                </div>
                <div class="flex items-center space-x-2">
                    <Checkbox
                        id="episodes"
                        checked={showEpisodes}
                        onCheckedChange={(checked) => (showEpisodes = !!checked)} />
                    <label
                        for="episodes"
                        class="flex cursor-pointer items-center gap-2 text-sm font-medium">
                        <Tv class="h-4 w-4 text-blue-400" />
                        TV Episodes
                    </label>
                </div>
            </div>
        </Card.Header>

        <Card.Content class="p-2 lg:p-4">
            {#if isMobile.current}
                <div class="space-y-2">
                    {#each calendarDays.filter((day) => day.isCurrentMonth && day.items.length > 0) as day (day.dateKey)}
                        {@render mobileDayCard(day)}
                    {/each}
                </div>
            {:else}
                <div class="mb-4 grid grid-cols-7 gap-2">
                    {#each dayNames as day}
                        <div class="text-muted-foreground py-2 text-center text-base font-semibold">
                            {day}
                        </div>
                    {/each}
                </div>
                <div class="grid grid-cols-7 gap-2">
                    {#each calendarDays as day (day.dateKey)}
                        {@render calendarDayCard(day)}
                    {/each}
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
</div>
