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

    const filterOptions = [
        { id: "movies", label: "Movies", type: "movie", icon: Film },
        { id: "episodes", label: "Episodes", type: "episode", icon: Tv },
        { id: "shows", label: "Shows", type: "show", icon: Tv },
        { id: "seasons", label: "Seasons", type: "season", icon: Tv }
    ];

    const typeStyles: Record<string, { item: string; icon: string; dot: string }> = {
        movie: {
            item: "border-orange-500/30 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30",
            icon: "text-orange-400",
            dot: "bg-orange-400"
        },
        episode: {
            item: "border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30",
            icon: "text-blue-400",
            dot: "bg-blue-400"
        },
        show: {
            item: "border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30",
            icon: "text-purple-400",
            dot: "bg-purple-400"
        },
        season: {
            item: "border-green-500/30 bg-green-500/20 text-green-300 hover:bg-green-500/30",
            icon: "text-green-400",
            dot: "bg-green-400"
        }
    };

    function itemUrl(item: EntertainmentItem): string | undefined {
        const mediaType = item.item_type === "movie" ? "movie" : "tv";
        if (mediaType === "tv") {
            // For TV items, prefer TVDB ID to skip TMDB→TVDB resolution
            if (item.tvdb_id)
                return resolve(`/details/media/${item.tvdb_id}/${mediaType}?indexer=tvdb`);
            if (item.tmdb_id) return resolve(`/details/media/${item.tmdb_id}/${mediaType}`);
        } else {
            // For movies, prefer TMDB ID
            if (item.tmdb_id) return resolve(`/details/media/${item.tmdb_id}/${mediaType}`);
            if (item.tvdb_id)
                return resolve(`/details/media/${item.tvdb_id}/${mediaType}?indexer=tvdb`);
        }
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

    const currentMonthDays = $derived(calendarDays.filter((day) => day.isCurrentMonth));
    const visibleMonthDays = $derived(currentMonthDays.filter((day) => day.items.length > 0));

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
    {#if !compact}
        {@render itemIcon(item, 4)}
    {/if}
    <div class="min-w-0 flex-1 leading-none">
        <div class={cn("min-w-0 text-xs", compact ? "truncate font-medium" : "font-semibold")}>
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
        "group/item flex items-center rounded-md border transition-colors",
        compact ? "gap-1.5 truncate px-2 py-1" : "gap-3 p-2.5",
        s.item,
        item.last_state === "Completed" && "line-through opacity-60",
        href && "no-underline"
    )}
    {@const title = compact
        ? `${item.show_title}${item.season ? ` S${item.season}E${item.episode}` : ""}`
        : undefined}
    {#if href}
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a {href} class={classes} {title}>
            {#if compact}
                <span class={cn("size-1.5 shrink-0 rounded-full", s.dot)}></span>
            {/if}
            {@render itemContent(item, compact)}
        </a>
    {:else}
        <div class={classes} {title}>
            {#if compact}
                <span class={cn("size-1.5 shrink-0 rounded-full", s.dot)}></span>
            {/if}
            {@render itemContent(item, compact)}
        </div>
    {/if}
{/snippet}

{#snippet dayItemsList(day: CalendarDay, limit = Infinity, showMore = false)}
    <div class="space-y-1.5">
        {#each day.items.slice(0, limit) as item (item.item_id)}
            {@render entertainmentItem(item, limit !== Infinity)}
        {/each}

        {#if showMore && day.items.length > limit}
            <Dialog.Root>
                <Dialog.Trigger>
                    {#snippet child({ props })}
                        <button
                            {...props}
                            class="text-muted-foreground hover:text-foreground w-full rounded-md px-2 py-1 text-left text-xs font-medium transition-colors hover:bg-white/5">
                            +{day.items.length - limit} more
                        </button>
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
            "group/day min-h-32 rounded-md border p-2 transition-colors",
            day.isCurrentMonth
                ? "bg-background/50 border-border/70 hover:border-primary/30 hover:bg-accent/30"
                : "bg-muted/10 border-border/30 text-muted-foreground/60",
            day.items.length > 0 && day.isCurrentMonth && "bg-card/80",
            isToday && "border-primary/70 bg-primary/5"
        )}>
        <div class="mb-2 flex items-start justify-between gap-2">
            <div
                class={cn(
                    "flex size-7 items-center justify-center rounded-md text-sm font-semibold",
                    isToday
                        ? "bg-primary text-primary-foreground"
                        : day.isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/70"
                )}>
                {day.date.day}
            </div>
            {#if day.items.length > 0}
                <span
                    class="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                    {day.items.length}
                </span>
            {/if}
        </div>
        {@render dayItemsList(day, 3, true)}
    </div>
{/snippet}

{#snippet mobileDayCard(day: CalendarDay)}
    {@const isToday = day.dateKey === todayKey}
    <div
        class={cn(
            "bg-card/80 border-border rounded-md border p-3",
            isToday && "border-primary/70 bg-primary/5"
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

<PageShell class="mx-auto h-full w-full max-w-[1800px] gap-5">
    <header
        class="border-border/60 flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <h1 class="truncate text-3xl font-bold tracking-tight">
            {monthNames[currentDate.month - 1]}
            {currentDate.year}
        </h1>

        <div class="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous month"
                onclick={() => navigateMonth("prev")}>
                <ChevronLeft class="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next month"
                onclick={() => navigateMonth("next")}>
                <ChevronRight class="h-4 w-4" />
            </Button>
        </div>
    </header>

    <section class="flex flex-wrap items-center gap-2">
        {#each filterOptions as opt (opt.id)}
            {@const Icon = opt.icon}
            {@const selected = filters[opt.type] !== false}
            {@const s = typeStyles[opt.type] ?? typeStyles.movie}
            <label
                for={opt.id}
                class={cn(
                    "border-border bg-card/50 hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    selected && "border-primary/40 bg-primary/10 text-foreground",
                    !selected && "text-muted-foreground"
                )}>
                <Checkbox
                    id={opt.id}
                    checked={filters[opt.type]}
                    class="size-4"
                    onCheckedChange={(checked: boolean) => (filters[opt.type] = !!checked)} />
                <Icon class={cn("h-4 w-4", s.icon)} />
                <span>{opt.label}</span>
            </label>
        {/each}
    </section>

    <section class="border-border/60 bg-card/30 overflow-hidden rounded-md border">
        <div class="p-2 md:p-3">
            {#if isMobile.current}
                {#if visibleMonthDays.length > 0}
                    <div class="space-y-2">
                        {#each visibleMonthDays as day (day.dateKey)}
                            {@render mobileDayCard(day)}
                        {/each}
                    </div>
                {:else}
                    <div
                        class="border-border bg-background/40 text-muted-foreground rounded-md border border-dashed p-8 text-center">
                        No releases match the current filters for this month.
                    </div>
                {/if}
            {:else}
                <div
                    class="border-border/70 bg-border/70 grid grid-cols-7 gap-px overflow-hidden rounded-md border">
                    {#each dayNames as day (day)}
                        <div
                            class="bg-muted/40 text-muted-foreground px-3 py-2 text-center text-xs font-bold uppercase">
                            {day}
                        </div>
                    {/each}
                    {#each calendarDays as day (day.dateKey)}
                        {@render calendarDayCard(day)}
                    {/each}
                </div>
            {/if}
        </div>
    </section>
</PageShell>
