<script lang="ts">
    import * as Chart from "$lib/components/ui/chart/index.js";
    import ResponsiveChartContainer from "$lib/components/media/riven/responsive-chart-container.svelte";
    import { PieChart } from "layerchart";
    import type { DashboardStatistics } from "./types";

    let { statistics }: { statistics: DashboardStatistics | undefined } = $props();

    const stateRows = $derived.by(() =>
        Object.entries(statistics?.states ?? {})
            .filter(([, value]) => value > 0)
            .map(([label, value]) => ({ label, value }))
    );
    const maxStateValue = $derived.by(() => Math.max(...stateRows.map((item) => item.value), 1));

    const contentRows = $derived.by(() =>
        !statistics
            ? []
            : [
                  ["Movies", statistics.total_movies, "#ef4444"],
                  ["Shows", statistics.total_shows, "#14b8a6"],
                  ["Seasons", statistics.total_seasons, "#60a5fa"],
                  ["Episodes", statistics.total_episodes, "#f59e0b"]
              ].map(([label, value, color]) => ({
                  label: String(label),
                  value: Number(value),
                  color: String(color)
              }))
    );
</script>

{#snippet LegendRows({ items }: { items: { label: string; value: number; color?: string }[] })}
    <div class="space-y-3">
        {#each items as item (item.label)}
            <div class="flex items-center gap-2">
                {#if item.color}
                    <span
                        class="inline-block h-3 w-3 shrink-0 rounded-sm"
                        style="background-color: {item.color}"></span>
                {/if}
                <span class="text-sm text-neutral-300">{item.label}</span>
                <span class="ml-auto font-mono text-sm text-neutral-50">
                    {item.value.toLocaleString()}
                </span>
            </div>
        {/each}
    </div>
{/snippet}

<section class="border-border/60 grid gap-12 border-b py-8 lg:grid-cols-2">
    <div class="min-w-0">
        <h2 class="text-base font-semibold">Library States</h2>

        <div class="mt-6 space-y-5">
            {#each stateRows as item (item.label)}
                <div>
                    <div class="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span class="text-neutral-300">{item.label}</span>
                        <span class="font-mono text-neutral-50">{item.value.toLocaleString()}</span>
                    </div>
                    <div class="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                            class="bg-primary h-full rounded-full"
                            style={`width: ${(item.value / maxStateValue) * 100}%`}>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <div class="min-w-0">
        <h2 class="text-base font-semibold">Content Breakdown</h2>

        <div class="mt-6 grid items-center gap-6 sm:grid-cols-[14rem_minmax(0,1fr)]">
            <ResponsiveChartContainer config={{}} class="mx-auto h-56 w-56">
                <PieChart
                    data={contentRows}
                    key="label"
                    value="value"
                    c="color"
                    innerRadius={-50}
                    cornerRadius={5}
                    padAngle={0.02}
                    padding={{ top: 16, bottom: 32, left: 32, right: 16 }}>
                    {#snippet tooltip()}
                        <Chart.Tooltip />
                    {/snippet}
                </PieChart>
            </ResponsiveChartContainer>
            {@render LegendRows({ items: contentRows })}
        </div>
    </div>
</section>
