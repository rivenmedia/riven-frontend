<script lang="ts">
    import { untrack } from "svelte";
    import * as Chart from "$lib/components/ui/chart/index.js";
    import ResponsiveChartContainer from "$lib/components/media/riven/responsive-chart-container.svelte";
    import { LineChart } from "layerchart";
    import { curveCatmullRom } from "d3-shape";
    import type { UsenetStreamingHealth, UsenetTraffic } from "./types";

    let {
        health,
        traffic
    }: { health: UsenetStreamingHealth | null; traffic: UsenetTraffic | null } = $props();

    // Stable provider colour palette (busiest-first order from `traffic.providers`).
    const PALETTE = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#14b8a6", "#ec4899"];

    function formatBytes(n: number) {
        if (n <= 0) return "0 B";
        const units = ["B", "KB", "MB", "GB", "TB", "PB"];
        const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
        return `${(n / 1024 ** i).toFixed(i <= 1 ? 0 : 1)} ${units[i]}`;
    }
    const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
    let width = $state(0);

    // Live decode throughput, derived from the cumulative byte counter across
    // polls (tracked dep is `health`; sample bookkeeping is untracked).
    let prev = $state<{ bytes: number; t: number } | null>(null);
    let throughputBytesPerSec = $state(0);
    $effect(() => {
        const current = health;
        untrack(() => {
            if (!current) return;
            const now = Date.now();
            if (prev && now > prev.t && current.bytesDecoded >= prev.bytes) {
                throughputBytesPerSec =
                    (current.bytesDecoded - prev.bytes) / ((now - prev.t) / 1000);
            }
            prev = { bytes: current.bytesDecoded, t: now };
        });
    });

    const hasActivity = $derived(
        !!health || (!!traffic && (traffic.totalBytesDownloaded > 0 || traffic.daily.length > 0))
    );

    const tiles = $derived.by(() => {
        const out: { label: string; value: string; warn?: boolean }[] = [];
        if (health) {
            out.push(
                { label: "Active streams", value: health.activeStreams.toString() },
                { label: "Throughput", value: `${formatBytes(throughputBytesPerSec)}/s` },
                { label: "Cache hit rate", value: pct(health.cacheHitRate) },
                { label: "Fetch success", value: pct(health.fetchSuccessRate) },
                { label: "In flight", value: health.inFlight.toString() },
                {
                    label: "Missing segments",
                    value: health.deadSegments.toLocaleString(),
                    warn: health.deadSegments > 0
                }
            );
        }
        if (traffic) {
            out.push(
                { label: "Total downloaded", value: formatBytes(traffic.totalBytesDownloaded) },
                { label: "Articles", value: traffic.totalArticlesDownloaded.toLocaleString() }
            );
        }
        return out;
    });


    const CACHE_LABELS: Record<string, { title: string; unit: string }> = {
        "read-ahead": { title: "Read-ahead cache", unit: "units" },
        "nzb-meta": { title: "NZB metadata", unit: "releases" },
        segment: { title: "Segment staging", unit: "segments" }
    };
    const caches = $derived(
        (health?.caches ?? []).map((c) => ({
            title: CACHE_LABELS[c.name]?.title ?? c.name,
            unit: CACHE_LABELS[c.name]?.unit ?? "entries",
            entries: c.entries,
            bytesUsed: c.bytesUsed,
            bytesMax: c.bytesMax,
            fill: c.bytesMax > 0 ? Math.max(0, Math.min(100, (c.bytesUsed / c.bytesMax) * 100)) : 0
        }))
    );

    // Build the multi-line daily-volume chart (one series per provider). Bytes
    // are converted to a single human unit so the axis stays readable.
    const daily = $derived.by(() => {
        const rows = traffic?.daily ?? [];
        if (rows.length === 0) return null;

        // Provider order: busiest-first totals, then any host only in the series.
        const hosts: string[] = [];
        for (const h of [
            ...(traffic?.providers ?? []).map((p) => p.host),
            ...rows.map((r) => r.host)
        ]) {
            if (!hosts.includes(h)) hosts.push(h);
        }

        const maxByte = Math.max(...rows.map((r) => r.bytesDownloaded), 1);
        const [divisor, unit] =
            maxByte >= 1024 ** 3
                ? [1024 ** 3, "GB"]
                : maxByte >= 1024 ** 2
                  ? [1024 ** 2, "MB"]
                  : [1024, "KB"];

        const days = [...new Set(rows.map((r) => r.day))].sort((a, b) => a.localeCompare(b));
        const dayIndex = new Map(days.map((d, i) => [d, i]));
        // Safe series keys (provider hostnames contain dots).
        const keyFor = new Map(hosts.map((h, i) => [h, `s${i}`]));
        const data = days.map((day, idx) => {
            const row: Record<string, number | string> = { idx, label: shortDay(day) };
            for (const h of hosts) row[keyFor.get(h)!] = 0;
            return row;
        });
        for (const r of rows) {
            const row = data[dayIndex.get(r.day)!];
            const key = keyFor.get(r.host)!;
            row[key] = (Number(row[key]) || 0) + r.bytesDownloaded / divisor;
        }

        const series = hosts.map((h, i) => ({
            key: keyFor.get(h)!,
            label: h,
            color: PALETTE[i % PALETTE.length]
        }));

        // Sparse x ticks, like the Release Year chart.
        const step = Math.max(1, Math.ceil(days.length / Math.max(4, Math.floor(width / 72))));
        const ticks = data
            .filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0)
            .map((r) => r.idx as number);

        return { data, series, ticks, unit };
    });

    function shortDay(day: string) {
        const parts = day.split("-");
        return parts.length === 3 ? `${parts[1]}/${parts[2]}` : day;
    }
</script>

<section class="border-border/60 border-b py-8">
    <div class="mb-5">
        <h2 class="text-base font-semibold">Usenet Activity</h2>
    </div>

    {#if !hasActivity}
        <p class="text-sm text-neutral-400">No usenet activity recorded yet.</p>
    {:else}
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
            {#each tiles as tile (tile.label)}
                <div>
                    <p class="text-[11px] text-neutral-500">{tile.label}</p>
                    <p
                        class="mt-1 text-lg font-semibold tabular-nums"
                        class:text-amber-300={tile.warn}
                        class:text-neutral-100={!tile.warn}>
                        {tile.value}
                    </p>
                </div>
            {/each}
        </div>

        {#if caches.length}
            <div class="mt-6 w-full space-y-3">
                {#each caches as cache (cache.title)}
                    <div>
                        <div class="flex items-center justify-between text-[11px] text-neutral-400">
                            <span>{cache.title}</span>
                            <span class="tabular-nums">
                                {formatBytes(cache.bytesUsed)} / {formatBytes(cache.bytesMax)}
                                · {cache.entries.toLocaleString()}
                                {cache.unit}
                            </span>
                        </div>
                        <div
                            class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                                class="h-full rounded-full bg-sky-500/70"
                                style="width: {cache.fill}%">
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        {#if daily}
            <div class="mt-8">
                <p class="mb-2 text-[11px] text-neutral-500">
                    Daily download volume ({daily.unit}, last 2 weeks)
                </p>
                <div bind:clientWidth={width} class="min-w-0">
                    <ResponsiveChartContainer config={{}} class="h-52 w-full">
                        <LineChart
                            x="idx"
                            data={daily.data}
                            points
                            labels={false}
                            series={daily.series}
                            padding={{ top: 16, bottom: 32, left: 40, right: 16 }}
                            props={{
                                spline: { curve: curveCatmullRom },
                                xAxis: {
                                    ticks: daily.ticks,
                                    tickSpacing: 44,
                                    format: (i: number) => (daily.data[i]?.label as string) ?? ""
                                }
                            }}>
                            {#snippet tooltip()}
                                <Chart.Tooltip />
                            {/snippet}
                        </LineChart>
                    </ResponsiveChartContainer>
                </div>
            </div>
        {/if}

        {#if traffic && traffic.providers.length > 0}
            <div class="mt-6 flex flex-col gap-2.5">
                {#each traffic.providers as p, i (p.host)}
                    <div class="flex items-center gap-2.5">
                        <span
                            class="h-2.5 w-2.5 shrink-0 rounded-full"
                            style="background: {PALETTE[i % PALETTE.length]}"></span>
                        <span class="min-w-0 flex-1 truncate text-[13px] text-neutral-200">
                            {p.host}
                        </span>
                        <span class="shrink-0 text-[12px] text-neutral-400 tabular-nums">
                            {formatBytes(p.bytesDownloaded)} · {p.articlesDownloaded.toLocaleString()}
                            articles
                        </span>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</section>
