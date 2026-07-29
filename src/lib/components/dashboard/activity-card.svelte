<script lang="ts">
    import Heatmap from "$lib/components/heatmap.svelte";

    let { activity }: { activity: Record<string, number> } = $props();

    const heatmapLegend = [
        { label: "None", color: "var(--muted)" },
        { label: "Low", color: "var(--chart-4)" },
        { label: "Med", color: "var(--chart-3)" },
        { label: "High", color: "var(--chart-2)" },
        { label: "Peak", color: "var(--chart-1)" }
    ];
</script>

<section class="border-border/60 border-b py-8">
    <div class="mb-6">
        <h2 class="text-base font-semibold">Activity Chart</h2>
    </div>

    <div class="min-w-0 overflow-x-auto">
        <Heatmap
            data={activity}
            class="text-[0.7rem] sm:text-[0.75rem]"
            colors={[
                "var(--muted)",
                "var(--chart-4)",
                "var(--chart-3)",
                "var(--chart-2)",
                "var(--chart-1)"
            ]} />

        <div class="mt-5 flex flex-wrap items-center justify-center gap-5">
            {#each heatmapLegend as item (item.label)}
                <div class="flex items-center gap-1.5">
                    <span
                        class="inline-block h-3 w-3 shrink-0 rounded-sm"
                        style="background-color: {item.color}"></span>
                    <span class="text-xs text-neutral-400">{item.label}</span>
                </div>
            {/each}
        </div>
    </div>
</section>
