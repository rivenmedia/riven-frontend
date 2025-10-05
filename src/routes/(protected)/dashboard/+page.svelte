<script lang="ts">
    import type { PageData } from "./$types";
    import { cn } from "$lib/utils";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Chart from "$lib/components/ui/chart/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { BarChart, Pie, PieChart } from "layerchart";

    let { data }: { data: PageData } = $props();

    function transformStatesToArray(states: Record<string, number> | undefined) {
        if (!states) return [];
        return Object.entries(states)
            .filter(([_, value]) => value > 0)
            .map(([state, value]) => ({ state, value }));
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

    $inspect(data);
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

<div class="mt-14 flex h-full flex-col p-6 md:p-8 md:px-16">
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
                data.statistics && data.statistics.states.Completed !== undefined
                    ? (
                          (data.statistics.states.Completed / data.statistics.total_items) *
                          100
                      ).toFixed(2) + "%"
                    : undefined,
            sub: "Completed / Total"
        })}
    </section>

    <section class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card.Root>
            <Card.Header class="pb-2">
                <Card.Title class="text-sm font-medium text-neutral-300">Library States</Card.Title>
            </Card.Header>
            <Card.Content>
                <Chart.Container config={{}} class="w-full">
                    <BarChart
                        data={transformedStates}
                        x="state"
                        y="value"
                        props={{ bars: { class: "fill-primary" } }}>
                        {#snippet tooltip()}
                            <Chart.Tooltip />
                        {/snippet}
                    </BarChart>
                </Chart.Container>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header class="pb-2">
                <Card.Title class="text-sm font-medium text-neutral-300"
                    >Content Breakdown</Card.Title>
            </Card.Header>
            <Card.Content>
                <Chart.Container config={{}} class="w-full">
                    <PieChart data={contentBreakdown} key="key" value="value" c="c">
                        {#snippet tooltip()}
                            <Chart.Tooltip />
                        {/snippet}
                    </PieChart>
                </Chart.Container>
            </Card.Content>
        </Card.Root>
    </section>

    <section class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card.Root class="lg:col-span-2">
            <Card.Header class="pb-2">
                <Card.Title class="text-sm font-medium text-neutral-300">Service Status</Card.Title>
            </Card.Header>
            <Card.Content>
                <div class="flex flex-wrap gap-4">
                    {#if data.services && Object.keys(data.services).length > 0}
                        {#each Object.entries(data.services) as [serviceName, status]}
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
</div>
