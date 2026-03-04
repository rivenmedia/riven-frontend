<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
    import Film from "@lucide/svelte/icons/film";
    import Tv from "@lucide/svelte/icons/tv";
    import type { PageData } from "./$types";
    import { cn } from "$lib/utils";
    import { IsMobile } from "$lib/hooks/is-mobile.svelte";
    import * as dateUtils from "$lib/utils/date";
    import * as Card from "$lib/components/ui/card/index.js";
    import { CalendarDate } from "@internationalized/date";
    import PageShell from "$lib/components/page-shell.svelte";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";

    let { data }: { data: PageData } = $props();
    const isMobile = $state(new IsMobile(1280));

    interface EntertainmentItem {
        item_id: number;
        tvdb_id: string;
        tmdb_id: string | number;
        show_title: string;
        item_type: string;
        aired_at: string;
        season?: number;
        episode?: number;
        last_state?: string;
        release_data?: {
            next_aired?: string;
            nextAired?: string;
            last_aired?: string;
            lastAired?: string;
        };
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

    const todayDate = dateUtils.getToday();
    const cYearParam = $derived($page.url.searchParams.get("year"));
    const cMonthParam = $derived($page.url.searchParams.get("month"));
    const cDayParam = $derived($page.url.searchParams.get("day"));
    const viewModeParam = $derived($page.url.searchParams.get("view"));

    const viewMode = $derived.by(() => {
        if (viewModeParam === "daily" || viewModeParam === "weekly") return viewModeParam;
        return "monthly";
    });

    let currentDate = $derived.by(() => {
        if (cYearParam && cMonthParam) {
            const year = parseInt(cYearParam, 10);
            const month = parseInt(cMonthParam, 10);
            const day = cDayParam ? parseInt(cDayParam, 10) : null;
            if (day) return new CalendarDate(year, month, day);
            if (todayDate.year === year && todayDate.month === month) return todayDate;
            return new CalendarDate(year, month, 1);
        }
        return todayDate;
    });

    let isNavigating = $state(false);

    let showMovies = $state(true);
    let showEpisodes = $state(true);
    let showShows = $state(true);
    let showSeasons = $state(true);

    function resolveCalendarDate(item: EntertainmentItem) {
        const aired = dateUtils.parseISODate(item.aired_at);

        if (item.item_type === "show") {
            if (aired && Math.abs(dateUtils.differenceInMonths(todayDate, aired)) <= 6) {
                return aired;
            }
            if (!item.release_data) {
                console.warn(`Calendar: Show ${item.show_title} is missing release_data`);
                return null;
            }

            const nextAiredStr =
                item.release_data.next_aired ||
                item.release_data.nextAired ||
                item.release_data.last_aired ||
                item.release_data.lastAired;
            if (nextAiredStr) {
                return dateUtils.parseISODate(nextAiredStr);
            }
            return null;
        }
        return aired;
    }

    function getItemUrl(item: EntertainmentItem): string | null {
        const type = item.item_type === "movie" ? "movie" : "tv";
        if (
            import.meta.env.DEV &&
            !["movie", "show", "season", "episode"].includes(item.item_type)
        ) {
            console.warn(
                `Calendar: unknown item_type "${item.item_type}" for "${item.show_title}"`
            );
        }

        const hasTmdb =
            item.tmdb_id !== undefined && item.tmdb_id !== null && `${item.tmdb_id}`.trim() !== "";
        const hasTvdb =
            item.tvdb_id !== undefined && item.tvdb_id !== null && `${item.tvdb_id}`.trim() !== "";

        if (type === "movie") {
            return hasTmdb ? `/details/media/${item.tmdb_id}/movie` : null;
        }

        if (!hasTmdb && !hasTvdb) {
            if (import.meta.env.DEV) {
                console.warn(`Calendar: missing tmdb_id and tvdb_id for "${item.show_title}"`);
            }
            return null;
        }

        const mediaId = hasTmdb ? `${item.tmdb_id}` : `${item.tvdb_id}`;
        const params = new URLSearchParams();

        if (!hasTmdb && hasTvdb) {
            params.set("indexer", "tvdb");
        }

        const hasSeason = item.season !== undefined && item.season !== null;
        const hasEpisode = item.episode !== undefined && item.episode !== null;

        if (item.item_type === "episode" && hasSeason && hasEpisode) {
            params.set("season", String(item.season));
            params.set("episode", String(item.episode));
        }

        if (item.item_type === "season" && hasSeason) {
            params.set("season", String(item.season));
        } else if (item.item_type === "episode" && hasSeason && !hasEpisode) {
            params.set("season", String(item.season));
        }

        const query = params.toString();
        return `/details/media/${mediaId}/tv${query ? `?${query}` : ""}`;
    }

    const itemsByDate = $derived.by(() => {
        const items: EntertainmentItem[] = data.calendar?.data
            ? Object.values(data.calendar.data as unknown as Record<string, EntertainmentItem>)
            : [];

        const result: Record<string, EntertainmentItem[]> = {};

        items.forEach((item) => {
            if (!item) return;
            const date = resolveCalendarDate(item);
            if (!date) return;
            const dateKey = dateUtils.toISODate(date);
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
        date: CalendarDate;
        dateKey: string;
        isCurrentMonth: boolean;
        items: EntertainmentItem[];
        day: number;
        dayOfWeek: number;
    }

    const calendarDays: CalendarDay[] = $derived.by(() => {
        const year = currentDate.year;
        const month = currentDate.month;

        const firstDay = dateUtils.getFirstDayOfMonth(year, month);
        const lastDay = dateUtils.getLastDayOfMonth(year, month);

        const startOffset = dateUtils.getDayOfWeek(firstDay);
        const totalDays = startOffset + lastDay.day + (6 - dateUtils.getDayOfWeek(lastDay));
        const rows = Math.ceil(totalDays / 7);
        const daysToShow = rows * 7;

        const days: CalendarDay[] = [];

        for (let i = 0; i < daysToShow; i++) {
            const dayNum = 1 - startOffset + i;
            const currentDay = dateUtils.addDays(firstDay, dayNum - 1);
            const dateKey = dateUtils.toISODate(currentDay);
            const isCurrentMonth = currentDay.month === month;
            const items = filteredItemsByDate[dateKey] || [];

            days.push({
                date: currentDay,
                dateKey,
                isCurrentMonth,
                items,
                day: currentDay.day,
                dayOfWeek: dateUtils.getDayOfWeek(currentDay)
            });
        }

        return days;
    });

    const upcomingItems = $derived.by(() => {
        const allItems = [];
        for (const [dateKey, items] of Object.entries(filteredItemsByDate)) {
            const date = dateUtils.parseISODate(dateKey);
            if (date && date.compare(todayDate) >= 0) {
                allItems.push(...items.map((item) => ({ item, dateKey, date })));
            }
        }
        // Extract 15 coming items sorted by date to support the strip overlay
        return allItems.sort((a, b) => a.date.compare(b.date)).slice(0, 15);
    });

    const weeklyDays = $derived.by(() => {
        const dow = dateUtils.getDayOfWeek(currentDate);
        const weekStart = dateUtils.addDays(currentDate, -dow);
        const days: CalendarDay[] = [];
        for (let i = 0; i < 7; i++) {
            const d = dateUtils.addDays(weekStart, i);
            const dateKey = dateUtils.toISODate(d);
            days.push({
                date: d,
                dateKey,
                isCurrentMonth: d.month === currentDate.month,
                items: filteredItemsByDate[dateKey] || [],
                day: d.day,
                dayOfWeek: i
            });
        }
        return days;
    });

    const dailyItems = $derived.by(
        () => filteredItemsByDate[dateUtils.toISODate(currentDate)] || []
    );

    const monthStats = $derived.by(() => {
        let total = 0,
            movies = 0,
            episodes = 0,
            shows = 0,
            seasons = 0;
        for (const day of calendarDays) {
            if (!day.isCurrentMonth) continue;
            for (const item of day.items) {
                total++;
                if (item.item_type === "movie") movies++;
                else if (item.item_type === "episode") episodes++;
                else if (item.item_type === "show") shows++;
                else if (item.item_type === "season") seasons++;
            }
        }
        return { total, movies, episodes, shows, seasons };
    });

    function buildUrl(params: Record<string, string | null>) {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== null && v !== undefined) sp.set(k, v);
        }
        return "?" + sp.toString();
    }

    function navigate(direction: "prev" | "next") {
        if (isNavigating) return;
        isNavigating = true;
        let target: CalendarDate;
        if (viewMode === "daily") {
            target = dateUtils.addDays(currentDate, direction === "prev" ? -1 : 1);
        } else if (viewMode === "weekly") {
            target = dateUtils.addDays(currentDate, direction === "prev" ? -7 : 7);
        } else {
            const newMonth =
                direction === "prev"
                    ? currentDate.month === 1
                        ? 12
                        : currentDate.month - 1
                    : currentDate.month === 12
                      ? 1
                      : currentDate.month + 1;
            const newYear =
                direction === "prev"
                    ? currentDate.month === 1
                        ? currentDate.year - 1
                        : currentDate.year
                    : currentDate.month === 12
                      ? currentDate.year + 1
                      : currentDate.year;
            target = new CalendarDate(newYear, newMonth, 1);
        }
        const weekSunday =
            viewMode === "weekly"
                ? dateUtils.addDays(target, -dateUtils.getDayOfWeek(target))
                : target;
        const url = buildUrl({
            view: viewMode === "monthly" ? null : viewMode,
            year: String(weekSunday.year),
            month: String(weekSunday.month),
            day: viewMode === "daily" ? String(target.day) : null
        });
        goto(url, { keepFocus: true })
            .catch(() => {})
            .finally(() => {
                isNavigating = false;
            });
    }

    function switchView(mode: string) {
        if (isNavigating) return;
        isNavigating = true;
        const url = buildUrl({
            view: mode === "monthly" ? null : mode,
            year: String(currentDate.year),
            month: String(currentDate.month),
            day: mode === "daily" ? String(currentDate.day) : null
        });
        goto(url)
            .catch(() => {})
            .finally(() => {
                isNavigating = false;
            });
    }

    function goToday() {
        if (isNavigating) return;
        const url = buildUrl({ view: viewMode === "monthly" ? null : viewMode });
        goto(url).catch(() => {});
    }

    function formatDayTitle(date: CalendarDate) {
        return `${dayNames[dateUtils.getDayOfWeek(date)]}, ${monthNames[date.month - 1]} ${date.day}`;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (
            isNavigating ||
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
        )
            return;
        if (e.key === "ArrowLeft") navigate("prev");
        else if (e.key === "ArrowRight") navigate("next");
    }

    let touchStartX = $state(0);
    function onTouchStart(e: TouchEvent) {
        touchStartX = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) navigate(dx < 0 ? "next" : "prev");
    }
</script>

<svelte:window onkeydown={handleKeydown} />

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
    {@const itemDate = resolveCalendarDate(item)}
    {@const diffDays = itemDate ? dateUtils.differenceInDays(itemDate, todayDate) : null}
    {@const isPastUncompleted =
        diffDays !== null && diffDays < 0 && item.last_state !== "Completed"}
    {@const isSeriesPremiere =
        item.item_type === "episode" && item.episode === 1 && item.season === 1}
    {@const isSeasonPremiere =
        item.item_type === "episode" && item.episode === 1 && item.season && item.season > 1}
    {@const itemUrl = getItemUrl(item)}
    <svelte:element
        this={itemUrl ? "a" : "div"}
        href={itemUrl}
        role={itemUrl ? undefined : "button"}
        class={cn(
            itemUrl && "text-foreground hover:text-foreground block cursor-pointer no-underline",
            "relative flex items-center rounded transition-colors",
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
            ? `${item.show_title}${item.season ? ` S${item.season}E${item.episode}` : ""}${!itemUrl ? " (no metadata — not clickable)" : ""}`
            : !itemUrl
              ? "No metadata available — item is not clickable"
              : undefined}
        onclick={(_e: MouseEvent) => {
            // Add preventative logic here if inner buttons are added later
        }}>
        {#if isPastUncompleted}
            <TriangleAlert class="absolute top-1 right-1 h-3 w-3 text-red-500 opacity-80" />
        {/if}
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

            {#if isSeriesPremiere || isSeasonPremiere}
                <div
                    class="bg-primary/20 text-primary mt-[2px] mb-1 inline-block rounded px-1 py-[1px] text-[10px] font-bold uppercase">
                    {isSeriesPremiere ? "Series Premiere" : "Season Premiere"}
                </div>
            {/if}

            {#if item.season && !compact && !isSeriesPremiere && !isSeasonPremiere}
                <div class="text-muted-foreground text-xs">
                    Season {item.season}, Episode {item.episode}
                </div>
            {/if}
        </div>
    </svelte:element>
{/snippet}

{#snippet dayItemsList(day: CalendarDay, limit = Infinity, showMore = false)}
    <div class="space-y-1">
        {#each day.items.slice(0, limit) as item (item.item_id)}
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
    {@const today = dateUtils.getToday()}
    {@const todayKey = dateUtils.toISODate(today)}
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
            {day.day}
        </div>
        {@render dayItemsList(day, 3, true)}
    </div>
{/snippet}

{#snippet mobileDayCard(day: CalendarDay)}
    {@const today = dateUtils.getToday()}
    {@const todayKey = dateUtils.toISODate(today)}
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

<PageShell class="min-h-full w-full">
    <Card.Root class="relative mb-4 md:mb-6">
        {#if isNavigating}
            <!-- Skeleton loader: heights are tied to current grid layout assumptions.
                 Update these values if the grid row structure changes. -->
            <div
                class="bg-background/60 absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 backdrop-blur-sm">
                {#if viewMode === "daily"}
                    <div class="w-full max-w-2xl space-y-3">
                        <!-- Skeleton height: h-32 for daily view -->
                        {#each Array(3) as _}
                            <div class="bg-muted/60 h-12 animate-pulse rounded-md"></div>
                        {/each}
                    </div>
                {:else if viewMode === "weekly"}
                    <!-- Skeleton height: h-48 for weekly view -->
                    <div class="grid w-full grid-cols-7 gap-1">
                        {#each Array(7) as _}
                            <div class="bg-muted/60 h-48 animate-pulse rounded-md"></div>
                        {/each}
                    </div>
                {:else}
                    <!-- Skeleton height: h-96 for monthly view -->
                    <div class="grid w-full grid-cols-7 gap-2">
                        {#each Array(7) as _}
                            <div class="bg-muted/40 h-4 animate-pulse rounded"></div>
                        {/each}
                    </div>
                    <div class="grid w-full grid-cols-7 gap-2">
                        {#each Array(35) as _}
                            <div class="bg-muted/60 h-24 animate-pulse rounded-md"></div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
        <Card.Header class="pb-4">
            <div class="flex flex-col gap-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={() => navigate("prev")}
                            disabled={isNavigating}>
                            <ChevronLeft class="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={goToday}
                            disabled={isNavigating}
                            class="px-3 text-xs">Today</Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={() => navigate("next")}
                            disabled={isNavigating}>
                            <ChevronRight class="h-4 w-4" />
                        </Button>
                    </div>

                    <Card.Title class="text-xl font-bold md:text-2xl">
                        {#if viewMode === "daily"}
                            {formatDayTitle(currentDate)}
                        {:else if viewMode === "weekly"}
                            {monthNames[weeklyDays[0].date.month - 1]}
                            {weeklyDays[0].date.day} – {monthNames[weeklyDays[6].date.month - 1]}
                            {weeklyDays[6].date.day}, {weeklyDays[6].date.year}
                        {:else}
                            {monthNames[currentDate.month - 1]} {currentDate.year}
                        {/if}
                    </Card.Title>

                    <div class="flex gap-0.5 rounded-md border p-0.5">
                        {#each [["daily", "Day"], ["weekly", "Week"], ["monthly", "Month"]] as [mode, label]}
                            <Button
                                variant={viewMode === mode ? "default" : "ghost"}
                                size="sm"
                                disabled={isNavigating}
                                onclick={() => switchView(mode)}
                                class="px-3 text-xs">
                                {label}
                            </Button>
                        {/each}
                    </div>
                </div>

                {#if viewMode === "monthly" && monthStats.total > 0}
                    <p class="text-muted-foreground text-center text-xs">
                        {monthStats.total} item{monthStats.total !== 1 ? "s" : ""} this month
                        {#if monthStats.movies > 0}&nbsp;&middot;&nbsp;<span class="text-orange-400"
                                >{monthStats.movies} movie{monthStats.movies !== 1 ? "s" : ""}</span
                            >{/if}
                        {#if monthStats.episodes > 0}&nbsp;&middot;&nbsp;<span class="text-blue-400"
                                >{monthStats.episodes} episode{monthStats.episodes !== 1
                                    ? "s"
                                    : ""}</span
                            >{/if}
                        {#if monthStats.shows > 0}&nbsp;&middot;&nbsp;<span class="text-purple-400"
                                >{monthStats.shows} show{monthStats.shows !== 1 ? "s" : ""}</span
                            >{/if}
                        {#if monthStats.seasons > 0}&nbsp;&middot;&nbsp;<span class="text-green-400"
                                >{monthStats.seasons} season{monthStats.seasons !== 1
                                    ? "s"
                                    : ""}</span
                            >{/if}
                    </p>
                {/if}
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

        {#if upcomingItems.length > 0}
            <div class="bg-muted/20 border-y px-4 py-3 lg:px-6">
                <h3
                    class="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                    Next Up
                </h3>
                <div class="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
                    {#each upcomingItems as { item, dateKey } (item.item_id)}
                        {@const diffDays = dateUtils.differenceInDays(
                            dateUtils.parseISODate(dateKey)!,
                            todayDate
                        )}
                        <div
                            class="bg-card max-w-[280px] min-w-[280px] flex-shrink-0 rounded-md border p-3 shadow-sm transition-shadow hover:shadow-md">
                            <div class="text-primary mb-2 text-xs font-bold uppercase">
                                {diffDays === 0
                                    ? "Today"
                                    : diffDays === 1
                                      ? "Tomorrow"
                                      : `In ${diffDays} days`}
                            </div>
                            {@render entertainmentItem(item, false)}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <Card.Content class="p-2 lg:p-4" ontouchstart={onTouchStart} ontouchend={onTouchEnd}>
            {#if viewMode === "daily"}
                <div class="mx-auto max-w-2xl">
                    {#if dailyItems.length === 0}
                        <p class="text-muted-foreground py-16 text-center text-sm">
                            No items scheduled for this day.
                        </p>
                    {:else}
                        <div class="space-y-2 py-2">
                            {#each dailyItems as item (item.item_id)}
                                {@render entertainmentItem(item, false)}
                            {/each}
                        </div>
                    {/if}
                </div>
            {:else if viewMode === "weekly"}
                {@const hasAnyItem = weeklyDays.some((d) => d.items.length > 0)}
                <div class="mb-2 grid grid-cols-7 gap-1">
                    {#each weeklyDays as day}
                        <div class="text-muted-foreground py-1 text-center text-xs font-semibold">
                            {dayNames[day.dayOfWeek]}<br />
                            <span
                                class={cn(
                                    "text-xs",
                                    day.dateKey === dateUtils.toISODate(todayDate) &&
                                        "text-primary font-bold"
                                )}>
                                {day.date.month}/{day.date.day}
                            </span>
                        </div>
                    {/each}
                </div>
                {#if !hasAnyItem}
                    <p class="text-muted-foreground col-span-7 py-16 text-center text-sm">
                        No items scheduled this week.
                    </p>
                {:else}
                    <div class="grid grid-cols-7 gap-1">
                        {#each weeklyDays as day (day.dateKey)}
                            {@render calendarDayCard(day)}
                        {/each}
                    </div>
                {/if}
            {:else if isMobile.current}
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
</PageShell>
