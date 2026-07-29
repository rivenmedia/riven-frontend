<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";

    let {
        statuses
    }: {
        statuses: Record<string, boolean | null> | null;
    } = $props();

    const entries = $derived(statuses ? Object.entries(statuses) : []);

    function badgeVariant(status: boolean | null) {
        if (status === true) return "default";
        if (status === false) return "destructive";
        return "secondary";
    }

    function badgeClass(status: boolean | null) {
        if (status === true) {
            return "rounded-xl bg-green-600/20 px-2 py-1 text-xs font-medium text-green-400";
        }
        return "rounded-xl px-2 py-1 text-xs font-medium";
    }
</script>

<section class="border-border/60 border-b py-8">
    <div class="mb-5">
        <h2 class="text-base font-semibold">Service Status</h2>
    </div>

    <div class="flex flex-wrap gap-3">
        {#if entries.length > 0}
            {#each entries as [serviceName, status] (serviceName)}
                <Badge variant={badgeVariant(status)} class={badgeClass(status)}>
                    {serviceName}
                </Badge>
            {/each}
        {:else}
            <p class="text-sm text-neutral-400">No data.</p>
        {/if}
    </div>
</section>
