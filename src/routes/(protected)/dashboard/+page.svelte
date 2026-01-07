<script lang="ts">
    import PageShell from "$lib/components/page-shell.svelte";
    import type { PageData } from "./$types";
    import { cn } from "$lib/utils";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Chart from "$lib/components/ui/chart/index.js";
    import ResponsiveChartContainer from "$lib/components/media/riven/responsive-chart-container.svelte";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { BarChart, PieChart, LineChart } from "layerchart";
    import { formatBytes, formatDate, getServiceDisplayName } from "$lib/helpers";
    import Heatmap from "$lib/components/heatmap.svelte";
    import { curveCatmullRom } from "d3-shape";

    let { data }: { data: PageData } = $props();

    function transformStatesToArray(states: Record<string, number> | undefined) {
        if (!states) return [];
        return Object.entries(states).reduce<{ state: string; value: number }[]>(
            (acc, [state, value]) => {
                if (value > 0) acc.push({ state, value });
                return acc;
            },
            []
        );
    }

    const transformedStates = $derived(transformStatesToArray(data.statistics?.states));

    const contentBreakdown = $derived.by(() => {
        if (!data.statistics) return [];
        return [
            { key: "Movies", value: data.statistics.total_movies, c: "#ef4444" },
            { key: "Shows", value: data.statistics.total_shows, c: "#14b8a6" },
            { key: "Seasons", value: data.statistics.total_seasons, c: "#60a5fa" },
            { key: "Episodes", value: data.statistics.total_episodes, c: "#f59e0b" }
        ];
    });

    const heatmapLegend = [
        { label: "No Activity", color: "var(--muted)" },
        { label: "Low", color: "var(--chart-4)" },
        { label: "Medium", color: "var(--chart-3)" },
        { label: "High", color: "var(--chart-2)" },
        { label: "Very High", color: "var(--chart-1)" }
    ];
</script>

<svelte:head>
    <title>Dashboard - Riven</title>
</svelte:head>

{#snippet KPICard({
    title,
    value,
    sub,
    tone = "default"
}: {
    title: string;
    value: string | undefined;
    sub?: string;
    tone?: "default" | "warning";
})}
    <Card.Root class={cn("", tone === "warning" && "border-amber-600/30")}>
        <Card.Header class="pb-2">
            <Card.Title class="text-sm font-medium text-neutral-300">{title}</Card.Title>
        </Card.Header>
        <Card.Content>
            <div
                class={cn(
                    "text-2xl font-semibold tracking-tight",
                    tone === "warning" ? "text-amber-300" : "text-neutral-50"
                )}>
                {value}
            </div>
            {#if sub}
                <p class="mt-1 text-sm text-neutral-400">{sub}</p>
            {/if}
        </Card.Content>
    </Card.Root>
{/snippet}

<PageShell>
    <h1 class="mb-8 text-3xl font-bold tracking-tight">Media Library Statistics</h1>

    <section class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {@render KPICard({
            title: "Total Items",
            value: data.statistics?.total_items.toLocaleString(),
            sub: "All indexed items"
        })}
        {@render KPICard({
            title: "Completed",
            value: data.statistics?.states.Completed?.toLocaleString(),
            sub: "Fully processed"
        })}
        {@render KPICard({
            title: "Incomplete",
            value: data.statistics?.incomplete_items.toLocaleString(),
            sub: "Pending processing",
            tone: "warning"
        })}
        {@render KPICard({
            title: "Completion Rate",
            value:
                data.statistics &&
                data.statistics.total_items > 0 &&
                data.statistics.states.Completed !== undefined
                    ? (
                          (data.statistics.states.Completed / data.statistics.total_items) *
                          100
                      ).toFixed(2) + "%"
                    : "0%",
            sub: "Completed / Total"
        })}
    </section>

    <section class="mb-8 grid grid-cols-1 gap-4">
        <Card.Root>
            <Card.Header class="pb-2">
                <Card.Title class="text-sm font-medium text-neutral-300">Activity Chart</Card.Title>
            </Card.Header>
            <Card.Content>
                <Heatmap
                    data={data.statistics?.activity ?? {}}
                    colors={[
                        "var(--muted)",
                        "var(--chart-4)",
                        "var(--chart-3)",
                        "var(--chart-2)",
                        "var(--chart-1)"
                    ]} />

                <div class="mt-4 flex flex-wrap items-center justify-center gap-4">
                    {#each heatmapLegend as item}
                        <div class="flex items-center gap-1.5">
                            <span
                                class="inline-block h-3 w-3 shrink-0 rounded-sm"
                                style="background-color: {item.color}"></span>
                            <span class="text-xs text-neutral-400">{item.label}</span>
                        </div>
                    {/each}
                </div>
            </Card.Content>
        </Card.Root>
    </section>

    <section class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card.Root class="flex h-full flex-col">
            <Card.Header class="pb-2">
                <Card.Title class="text-sm font-medium text-neutral-300">Library States</Card.Title>
            </Card.Header>
            <Card.Content class="flex flex-1 flex-col">
                <ResponsiveChartContainer config={{}} class="min-h-[300px] w-full flex-1">
                    <BarChart
                        data={transformedStates}
                        x="state"
                        y="value"
                        c="state"
                        labels
                        padding={{ top: 16, bottom: 32, left: 32, right: 16 }}
                        props={{
                            bars: {
                                class: "fill-primary"
                            }
                        }}>
                        {#snippet tooltip()}
                            <Chart.Tooltip />
                        {/snippet}
                    </BarChart>
                </ResponsiveChartContainer>

                <div class="mt-auto pt-4">
                    {#each transformedStates as item (item.state)}
                        <div class="mt-4 flex items-center gap-2 first:mt-0">
                            <span class="text-sm text-neutral-300">{item.state}</span>
                            <span class="ml-auto font-mono text-sm text-neutral-50">
                                {item.value.toLocaleString()}
                            </span>
                        </div>
                    {/each}
                </div>
            </Card.Content>
        </Card.Root>

        <Card.Root class="flex h-full flex-col">
            <Card.Header class="pb-2">
                <Card.Title class="text-sm font-medium text-neutral-300"
                    >Content Breakdown</Card.Title>
            </Card.Header>
            <Card.Content class="flex flex-1 flex-col">
                <ResponsiveChartContainer config={{}} class="min-h-[300px] w-full flex-1">
                    <PieChart
                        data={contentBreakdown}
                        key="key"
                        value="value"
                        c="c"
                        innerRadius={-50}
                        cornerRadius={5}
                        padAngle={0.02}
                        padding={{ top: 16, bottom: 32, left: 32, right: 16 }}>
                        {#snippet tooltip()}
                            <Chart.Tooltip />
                        {/snippet}
                    </PieChart>
                </ResponsiveChartContainer>

                <div class="mt-auto pt-4">
                    {#each contentBreakdown as item (item.key)}
                        <div class="mt-4 flex items-center gap-2 first:mt-0">
                            <span
                                class="inline-block h-3 w-3 shrink-0 rounded-sm"
                                style="background-color: {item.c}"></span>
                            <span class="text-sm text-neutral-300">{item.key}</span>
                            <span class="ml-auto font-mono text-sm text-neutral-50">
                                {item.value.toLocaleString()}
                            </span>
                        </div>
                    {/each}
                </div>
            </Card.Content>
        </Card.Root>
    </section>

    <section class="mb-8 grid grid-cols-1">
        <Card.Root>
            <Card.Header class="pb-2">
                <Card.Title class="text-sm font-medium text-neutral-300">Release Year</Card.Title>
            </Card.Header>
            <Card.Content>
                <ResponsiveChartContainer
                    config={{}}
                    class="aspect-3/1 w-full md:aspect-4/1 lg:aspect-5/1 2xl:aspect-6/1">
                    <LineChart
                        data={data.statistics?.media_year_releases || []}
                        x="year"
                        series={[
                            {
                                key: "count",
                                color: "var(--chart-1)"
                            }
                        ]}
                        labels={{ offset: 10 }}
                        points
                        padding={{ top: 16, bottom: 32, left: 32, right: 16 }}
                        props={{ spline: { curve: curveCatmullRom } }}>
                        {#snippet tooltip()}
                            <Chart.Tooltip />
                        {/snippet}
                    </LineChart>
                </ResponsiveChartContainer>
            </Card.Content>
        </Card.Root>
    </section>

    <section class="mb-8 grid grid-cols-1">
        <Card.Root>
            <Card.Header>
                <Card.Title class="text-sm font-medium text-neutral-300">Service Status</Card.Title>
            </Card.Header>
            <Card.Content>
                <div class="flex flex-wrap gap-4">
                    {#if data.services && Object.keys(data.services).length > 0}
                        {#each Object.entries(data.services) as [serviceName, status] (serviceName)}
                            {#if status === true}
                                <Badge
                                    variant="default"
                                    class="bg-green-600/20 px-2 py-1 text-xs font-medium text-green-400">
                                    {serviceName}
                                </Badge>
                            {:else if status === false}
                                <Badge variant="destructive" class="px-2 py-1 text-xs font-medium">
                                    {serviceName}
                                </Badge>
                            {:else}
                                <Badge variant="secondary" class="px-2 py-1 text-xs font-medium">
                                    {serviceName}
                                </Badge>
                            {/if}
                        {/each}
                    {:else}
                        <p class="text-sm text-neutral-400">No service data available.</p>
                    {/if}
                </div>
            </Card.Content>
        </Card.Root>
    </section>

    <section class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each data.downloaderInfo?.services as downloader (downloader.service)}
            <Card.Root class="bg-card border bg-linear-to-br">
                <Card.Header class="pb-3">
                    <div class="flex items-center justify-between">
                        <Card.Title class="text-lg font-semibold text-neutral-50">
                            {getServiceDisplayName(downloader.service)}
                        </Card.Title>
                        <Badge
                            variant={downloader.premium_status === "premium"
                                ? "default"
                                : "secondary"}
                            class={downloader.premium_status === "premium"
                                ? "bg-amber-600/30 text-amber-300 hover:bg-amber-600/40"
                                : ""}>
                            {downloader.premium_status === "premium" ? "Premium" : "Free"}
                        </Badge>
                    </div>
                </Card.Header>
                <Card.Content class="space-y-3">
                    {#if downloader.username || downloader.email}
                        <div>
                            <p class="text-xs font-medium text-neutral-400">Account</p>
                            <p class="mt-0.5 text-sm font-medium text-neutral-100">
                                {downloader.username || downloader.email}
                            </p>
                        </div>
                    {/if}

                    {#if downloader.premium_status === "premium" && (downloader.premium_expires_at || downloader.premium_days_left !== null)}
                        <div class="grid grid-cols-2 gap-3">
                            {#if downloader.premium_expires_at}
                                <div>
                                    <p class="text-xs font-medium text-neutral-400">Expires</p>
                                    <p class="mt-0.5 text-sm font-medium text-neutral-100">
                                        {formatDate(downloader.premium_expires_at)}
                                    </p>
                                </div>
                            {/if}
                            {#if downloader.premium_days_left !== null && downloader.premium_days_left !== undefined}
                                <div>
                                    <p class="text-xs font-medium text-neutral-400">Days Left</p>
                                    <p
                                        class={cn(
                                            "mt-0.5 text-sm font-semibold",
                                            downloader.premium_days_left < 7
                                                ? "text-red-400"
                                                : downloader.premium_days_left < 30
                                                  ? "text-amber-300"
                                                  : "text-green-400"
                                        )}>
                                        {downloader.premium_days_left}
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    <div class="grid grid-cols-2 gap-3">
                        {#if downloader.points !== null && downloader.points !== undefined}
                            <div>
                                <p class="text-xs font-medium text-neutral-400">Points</p>
                                <p class="mt-0.5 text-sm font-medium text-neutral-100">
                                    {downloader.points.toLocaleString()}
                                </p>
                            </div>
                        {/if}
                        {#if downloader.total_downloaded_bytes !== null && downloader.total_downloaded_bytes !== undefined}
                            <div>
                                <p class="text-xs font-medium text-neutral-400">Downloaded</p>
                                <p class="mt-0.5 text-sm font-medium text-neutral-100">
                                    {formatBytes(downloader.total_downloaded_bytes)}
                                </p>
                            </div>
                        {/if}
                    </div>

                    {#if downloader.cooldown_until}
                        <div class="rounded-md bg-amber-600/20 p-2">
                            <p class="text-xs font-medium text-amber-300">
                                Cooldown until {formatDate(downloader.cooldown_until)}
                            </p>
                        </div>
                    {/if}
                </Card.Content>
            </Card.Root>
        {/each}
    </section>
</PageShell>
