<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import type { NntpProviderHealth } from "./types";

    let { providers }: { providers: NntpProviderHealth[] } = $props();

    const cards = $derived.by(() =>
        providers.map((p) => {
            const usage =
                p.maxConnections > 0
                    ? Math.max(0, Math.min(100, (p.openConnections / p.maxConnections) * 100))
                    : 0;
            const status = p.demoted
                ? {
                      label: "Demoted — missing articles",
                      variant: "destructive" as const
                  }
                : p.consecutiveNotFound > 0
                  ? {
                        label: `${p.consecutiveNotFound} recent ${p.consecutiveNotFound === 1 ? "miss" : "misses"}`,
                        variant: "secondary" as const
                    }
                  : { label: "Healthy", variant: "default" as const };
            return {
                ...p,
                key: `${p.host}:${p.port}`,
                usage,
                status
            };
        })
    );
</script>

<section class="border-border/60 border-b py-8">
    <div class="mb-5">
        <h2 class="text-base font-semibold">Usenet Providers</h2>
    </div>

    {#if cards.length === 0}
        <p class="text-sm text-neutral-400">No usenet providers configured.</p>
    {:else}
        <div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {#each cards as p (p.key)}
                <div class="border-border/60 rounded-md border p-3">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <span class="truncate text-[13px] font-semibold text-neutral-100">
                                    {p.host}
                                </span>
                                {#if p.isBackup}
                                    <Badge variant="outline" class="text-[10px]">Backup</Badge>
                                {/if}
                            </div>
                            <p class="mt-0.5 text-[11px] text-neutral-500">Priority {p.priority}</p>
                        </div>
                        <Badge variant={p.status.variant} class="shrink-0 text-[10px]">
                            {p.status.label}
                        </Badge>
                    </div>

                    <div class="mt-3">
                        <div class="flex items-center justify-between text-[11px] text-neutral-400">
                            <span>Connections</span>
                            <span class="tabular-nums">
                                {p.activeConnections} active · {p.idleConnections} idle · {p.maxConnections}
                                max
                            </span>
                        </div>
                        <div
                            class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                                class="h-full rounded-full bg-emerald-500/70"
                                style="width: {p.usage}%">
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</section>
