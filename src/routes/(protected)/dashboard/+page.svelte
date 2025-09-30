<script lang="ts">
    import type { PageData } from "./$types";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Chart from "$lib/components/ui/chart/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { BarChart, PieChart } from "layerchart";

    let { data }: { data: PageData } = $props();
</script>

<!-- 
{#snippet cardBase(title: string, description?: string, )}
    
{/snippet} -->

<div class="flex h-full flex-col p-6 md:p-8 md:px-16">
    <h1 class="text-3xl font-bold tracking-tight">Media Library Statistics</h1>
</div>
