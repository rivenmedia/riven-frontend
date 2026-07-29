<script lang="ts">
    import * as Chart from "$lib/components/ui/chart/index.js";
    import ResponsiveChartContainer from "$lib/components/media/riven/responsive-chart-container.svelte";
    import { LineChart } from "layerchart";
    import { curveCatmullRom } from "d3-shape";

    let {
        data
    }: {
        data: { year: number; count: number }[];
    } = $props();

    let width = $state(0);

    const tickStep = $derived.by(() =>
        data.length <= 1
            ? 1
            : Math.max(1, Math.ceil(data.length / Math.max(4, Math.floor(width / 72))))
    );
    const ticks = $derived.by(() =>
        data
            .filter(
                (_, index) => index === 0 || index === data.length - 1 || index % tickStep === 0
            )
            .map((item) => item.year)
    );
</script>

<section class="border-border/60 border-b py-8">
    <div class="mb-6">
        <h2 class="text-base font-semibold">Release Year</h2>
    </div>

    <div bind:clientWidth={width} class="min-w-0">
        <ResponsiveChartContainer config={{}} class="h-52 w-full">
            <LineChart
                x="year"
                {data}
                points
                labels={false}
                series={[{ key: "count", color: "var(--chart-1)" }]}
                padding={{ top: 16, bottom: 32, left: 32, right: 16 }}
                props={{
                    spline: { curve: curveCatmullRom },
                    xAxis: {
                        ticks,
                        tickSpacing: 44,
                        format: (year: number) => String(year)
                    }
                }}>
                {#snippet tooltip()}
                    <Chart.Tooltip />
                {/snippet}
            </LineChart>
        </ResponsiveChartContainer>
    </div>
</section>
