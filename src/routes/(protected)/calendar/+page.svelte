<script lang="ts">
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
    import * as dateUtils from "$lib/utils/date";
    import * as Card from "$lib/components/ui/card/index.js";
    import { CalendarDate } from "@internationalized/date";
    import PageShell from "$lib/components/page-shell.svelte";
    import { resolve } from "$app/paths";

    let { data }: { data: PageData } = $props();
    const isMobile = $state(new IsMobile(1280));

    interface EntertainmentItem {
        item_id: number;
        tvdb_id: string;
        tmdb_id: string;
        show_title: string;
        item_type: string;
        aired_at: string;
        season?: number;
        episode?: number;
        last_state?: string;
    }

    const typeStyles: Record<
        string,
        { border: string; bg: string; hover: string; compact: string; icon: string }
    > = {
        episode: {
            border: "border-blue-500/30",
            bg: "bg-blue-500/20",
            hover: "hover:bg-blue-500/30",
            compact: "text-blue-300",
            icon: "text-blue-400"
        },
        show: {
            border: "border-purple-500/30",
            bg: "bg-purple-500/20",
            hover: "hover:bg-purple-500/30",
            compact: "text-purple-300",
            icon: "text-purple-400"
        },
        season: {
            border: "border-green-500/30",
            bg: "bg-green-500/20",
            hover: "hover:bg-green-500/30",
            compact: "text-green-300",
            icon: "text-green-400"
        },
        movie: {
            border: "border-orange-500/30",
            bg: "bg-orange-500/20",
            hover: "hover:bg-orange-500/30",
            compact: "text-orange-300",
            icon: "text-orange-400"
        }
    };

    const filterOptions = [
        { id: "movies", label: "Movies", type: "movie", icon: Film },
        { id: "episodes", label: "Episodes", type: "episode", icon: Tv },
        { id: "shows", label: "Shows", type: "show", icon: Tv },
        { id: "seasons", label: "Seasons", type: "season", icon: Tv }
    ];

    function itemUrl(item: EntertainmentItem): string | undefined {
        const mediaType = item.item_type === "movie" ? "movie" : "tv";
        if (item.tmdb_id) return resolve(`/details/media/${item.tmdb_id}/${mediaType}`);
        if (item.tvdb_id) return resolve(`/details/media/${item.tvdb_id}/${mediaType}?indexer=tvdb`);
        return undefined;
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

    const today = dateUtils.getToday();
    const todayKey = dateUtils.toISODate(today);
    let currentDate = $state<CalendarDate>(today);
    let filters = $state<Record<string, boolean>>({
        movie: true,
        episode: true,
        show: true,
        season: true
    });

    const itemsByDate = $derived.by(() => {
        const items = data.calendar?.data
            ? (Object.values(data.calendar.data) as unknown as EntertainmentItem[])
            : [];

        const result: Record<string, EntertainmentItem[]> = {};
        for (const item of items) {
            if (!item?.aired_at) continue;
            const date = dateUtils.parseISODate(item.aired_at);
            if (!date) continue;
            const dateKey = dateUtils.toISODate(date);
            (result[dateKey] ??= []).push(item);
        }
        return result;
    });

    const filteredItemsByDate = $derived.by(() => {
        const result: Record<string, EntertainmentItem[]> = {};
        for (const [dateKey, items] of Object.entries(itemsByDate)) {
            result[dateKey] = items.filter((item) => filters[item.item_type] !== false);
        }
        return result;
    });

    interface CalendarDay {
        date: CalendarDate;
        dateKey: string;
        isCurrentMonth: boolean;
        items: EntertainmentItem[];
    }

    const calendarDays: CalendarDay[] = $derived.by(() => {
        const { year, month } = currentDate;
        const firstDay = dateUtils.getFirstDayOfMonth(year, month);
        const lastDay = dateUtils.getLastDayOfMonth(year, month);
        const startOffset = dateUtils.getDayOfWeek(firstDay);
        const totalDays = startOffset + lastDay.day + (6 - dateUtils.getDayOfWeek(lastDay));
        const daysToShow = Math.ceil(totalDays / 7) * 7;

        const days: CalendarDay[] = [];
        for (let i = 0; i < daysToShow; i++) {
            const currentDay = dateUtils.addDays(firstDay, i - startOffset);
            const dateKey = dateUtils.toISODate(currentDay);
            days.push({
                date: currentDay,
                dateKey,
                isCurrentMonth: currentDay.month === month,
                items: filteredItemsByDate[dateKey] ?? []
            });
        }
        return days;
    });

    function navigateMonth(direction: "prev" | "next") {
        const delta = direction === "prev" ? -1 : 1;
        let newMonth = currentDate.month + delta;
        let newYear = currentDate.year;
        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        } else if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }
        currentDate = new CalendarDate(newYear, newMonth, 1);
    }

    function formatDayTitle(date: CalendarDate) {
        return `${dayNames[dateUtils.getDayOfWeek(date)]}, ${monthNames[date.month - 1]} ${date.day}`;
    }
</script>

<svelte:head>
    <title>Calendar - Riven</title>
</svelte:head>

{#snippet itemIcon(item: EntertainmentItem, size = 4)}
    {@const s = typeStyles[item.item_type] ?? typeStyles.movie}
    {@const cls = `h-${size} w-${size} shrink-0 ${s.icon}`}
    {#if item.item_type === "movie"}
        <Film class={cls} />
    {:else}
        <Tv class={cls} />
    {/if}
{/snippet}

{#snippet itemContent(item: EntertainmentItem, compact: boolean)}
    {@render itemIcon(item, compact ? 3 : 4)}
    <div class="min-w-0 flex-1">
        <div class={cn("text-xs", compact ? "truncate" : "font-medium")}>
            {item.show_title}
            {#if item.season && compact}
                S{item.season}{#if item.episode}E{item.episode}{/if}
            {/if}
        </div>
        {#if item.season && !compact}
            <div class="text-muted-foreground text-xs">
                Season {item.season}{#if item.episode}, Episode {item.episode}{/if}
            </div>
        {/if}
    </div>
{/snippet}

{#snippet entertainmentItem(item: EntertainmentItem, compact = false)}
    {@const href = itemUrl(item)}
    {@const s = typeStyles[item.item_type] ?? typeStyles.movie}
    {@const classes = cn(
        "flex items-center rounded border transition-colors",
        compact ? "gap-1 truncate p-1" : "gap-3 p-2",
        s.border,
        s.bg,
        s.hover,
        compact && s.compact,
        item.last_state === "Completed" && "line-through opacity-60",
        href && "no-underline"
    )}
    {@const title = compact
        ? `${item.show_title}${item.season ? ` S${item.season}E${item.episode}` : ""}`
        : undefined}
    {#if href}
        <a {href} class={classes} {title}>
            {@render itemContent(item, compact)}
        </a>
    {:else}
        <div class={classes} {title}>
            {@render itemContent(item, compact)}
        </div>
    {/if}
{/snippet}

{#snippet dayItemsList(day: CalendarDay, limit = Infinity, showMore = false)}
    <div class="space-y-1">
        {#each day.items.slice(0, limit) as item (item.item_id)}
            {@render entertainmentItem(item, limit !== Infinity)}
        {/each}

        {#if showMore && day.items.length > limit}
            <Dialog.Root>
                <Dialog.Trigger>
                    {#snippet child({ props })}
                        <p
                            {...props}
                            class="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors">
                            +{day.items.length - limit} more
                        </p>
                    {/snippet}
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
    {@const isToday = day.dateKey === todayKey}
    <div
        class={cn(
            "min-h-30 rounded-lg border p-2 transition-colors",
            day.isCurrentMonth
                ? "bg-card border-border hover:bg-accent/50"
                : "bg-muted/30 border-muted text-muted-foreground",
            isToday && "ring-primary ring-offset-background ring-2 ring-offset-2"
        )}>
        <div class={cn("mb-2 text-base font-medium", isToday && "text-primary")}>
            {day.date.day}
        </div>
        {@render dayItemsList(day, 3, true)}
    </div>
{/snippet}

{#snippet mobileDayCard(day: CalendarDay)}
    {@const isToday = day.dateKey === todayKey}
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

<PageShell class="h-full w-full">
    <Card.Root class="mb-4 md:mb-6">
        <Card.Header class="pb-4">
            <div class="flex items-center justify-between">
                <Button variant="outline" size="sm" onclick={() => navigateMonth("prev")}>
                    <ChevronLeft class="h-4 w-4" />
                </Button>

                <Card.Title class="text-xl font-bold md:text-2xl">
                    {monthNames[currentDate.month - 1]}
                    {currentDate.year}
                </Card.Title>

                <Button variant="outline" size="sm" onclick={() => navigateMonth("next")}>
                    <ChevronRight class="h-4 w-4" />
                </Button>
            </div>
            <div
                class="mt-4 flex flex-wrap items-center justify-center gap-4 border-t pt-4 md:gap-6">
                {#each filterOptions as opt (opt.id)}
                    {@const Icon = opt.icon}
                    <div class="flex items-center space-x-2">
                        <Checkbox
                            id={opt.id}
                            checked={filters[opt.type]}
                            onCheckedChange={(checked: boolean) => (filters[opt.type] = !!checked)} />
                        <label
                            for={opt.id}
                            class="flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <Icon class={cn("h-4 w-4", typeStyles[opt.type].icon)} />
                            {opt.label}
                        </label>
                    </div>
                {/each}
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
                    {#each dayNames as day (day)}
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
</PageShell>
