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
        item_id: number;
        tvdb_id: string;
        show_title: string;
        item_type: string;
        aired_at: string;
        season?: number;
        episode?: number;
        last_state?: string;
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
    let showShows = $state(true);
    let showSeasons = $state(true);

    const itemsByDate = $derived.by(() => {
        const items: EntertainmentItem[] = data.calendar?.data
            ? (Object.values(data.calendar.data) as EntertainmentItem[])
            : [];

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
                if (item.item_type === "episode" && !showEpisodes) return false;
                if (item.item_type === "movie" && !showMovies) return false;
                if (item.item_type === "show" && !showShows) return false;
                if (item.item_type === "season" && !showSeasons) return false;
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

    $inspect(calendarDays);

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

<svelte:head>
    <title>Calendar - Riven</title>
</svelte:head>

{#snippet itemIcon(item: EntertainmentItem, size = 4)}
    {#if item.item_type === "episode"}
        <Tv class={`h-${size} w-${size} shrink-0 text-blue-400`} />
    {:else if item.item_type === "show"}
        <Tv class={`h-${size} w-${size} shrink-0 text-purple-400`} />
    {:else if item.item_type === "season"}
        <Tv class={`h-${size} w-${size} shrink-0 text-green-400`} />
    {:else}
        <Film class={`h-${size} w-${size} shrink-0 text-orange-400`} />
    {/if}
{/snippet}

{#snippet entertainmentItem(item: EntertainmentItem, compact = false)}
    <div
        class={cn(
            "flex items-center rounded transition-colors",
            compact ? "gap-1 truncate p-1" : "gap-3 p-2",
            item.item_type === "episode"
                ? [
                      "border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30",
                      compact && "text-blue-300"
                  ]
                : item.item_type === "show"
                  ? [
                        "border border-purple-500/30 bg-purple-500/20 hover:bg-purple-500/30",
                        compact && "text-purple-300"
                    ]
                  : item.item_type === "season"
                    ? [
                          "border border-green-500/30 bg-green-500/20 hover:bg-green-500/30",
                          compact && "text-green-300"
                      ]
                    : [
                          "border border-orange-500/30 bg-orange-500/20 hover:bg-orange-500/30",
                          compact && "text-orange-300"
                      ],
            item.last_state === "Completed" && "line-through opacity-60"
        )}
        title={compact
            ? `${item.show_title}${item.season ? ` S${item.season}E${item.episode}` : ""}`
            : undefined}>
        {@render itemIcon(item, compact ? 3 : 4)}

        <div class="min-w-0 flex-1">
            <div class={cn(compact && "truncate", `text-${compact ? "xs" : "xs font-medium"}`)}>
                {item.show_title}
                {#if item.season && compact}
                    S{item.season}
                    {#if item.episode}
                        E{item.episode}
                    {/if}
                {/if}
            </div>
            {#if item.season && !compact}
                <div class="text-muted-foreground text-xs">
                    {#if compact}
                        S{item.season}
                        {#if item.episode}
                            E{item.episode}
                        {/if}
                    {:else}
                        Season {item.season}
                        {#if item.episode}
                            , Episode {item.episode}
                        {/if}
                    {/if}
                </div>
            {/if}
        </div>
    </div>
{/snippet}

{#snippet dayItemsList(day: CalendarDay, limit = Infinity, showMore = false)}
    <div class="space-y-1">
        {#each day.items.slice(0, limit) as item, itemIndex (item.item_id)}
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
                        {#each day.items as item (item.item_id)}
                            {@render entertainmentItem(item)}
                        {/each}
                    </div>
                </Dialog.Content>
            </Dialog.Root>
        {/if}
    </div>
{/snippet}

{#snippet calendarDayCard(day: CalendarDay)}
    {@const isToday = day.dateKey === new Date().toISOString().split("T")[0]}
    <div
        class={cn(
            "min-h-[120px] rounded-lg border p-2 transition-colors",
            day.isCurrentMonth
                ? "bg-card border-border hover:bg-accent/50"
                : "bg-muted/30 border-muted text-muted-foreground",
            isToday && "ring-primary ring-offset-background ring-2 ring-offset-2"
        )}>
        <div class={cn("mb-2 text-base font-medium", isToday && "text-primary")}>
            {day.day}
        </div>
        {@render dayItemsList(day, 3, true)}
    </div>
{/snippet}

{#snippet mobileDayCard(day: CalendarDay)}
    {@const isToday = day.dateKey === new Date().toISOString().split("T")[0]}
    <div
        class={cn(
            "bg-card border-border rounded-lg border p-3",
            isToday && "ring-primary ring-offset-background ring-2 ring-offset-2"
        )}>
        <div class="mb-3 flex items-center justify-between">
            <div class={cn("text-lg font-semibold", isToday && "text-primary")}>
                {formatDayTitle(day.date)}
            </div>
            <div class="text-muted-foreground text-sm">
                {day.items.length} item{day.items.length !== 1 ? "s" : ""}
            </div>
        </div>
        {@render dayItemsList(day)}
    </div>
{/snippet}

<div class="mt-14 h-full w-full p-6 md:p-8 md:px-16">
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
            <div
                class="mt-4 flex flex-wrap items-center justify-center gap-4 border-t pt-4 md:gap-6">
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
                        Episodes
                    </label>
                </div>
                <div class="flex items-center space-x-2">
                    <Checkbox
                        id="shows"
                        checked={showShows}
                        onCheckedChange={(checked) => (showShows = !!checked)} />
                    <label
                        for="shows"
                        class="flex cursor-pointer items-center gap-2 text-sm font-medium">
                        <Tv class="h-4 w-4 text-purple-400" />
                        Shows
                    </label>
                </div>
                <div class="flex items-center space-x-2">
                    <Checkbox
                        id="seasons"
                        checked={showSeasons}
                        onCheckedChange={(checked) => (showSeasons = !!checked)} />
                    <label
                        for="seasons"
                        class="flex cursor-pointer items-center gap-2 text-sm font-medium">
                        <Tv class="h-4 w-4 text-green-400" />
                        Seasons
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
