<script lang="ts">
    import { cn } from "$lib/utils";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { formatBytes, formatDate, getServiceDisplayName } from "$lib/helpers";
    import type { DownloaderService } from "./types";

    let { services }: { services: DownloaderService[] } = $props();

    const premiumMeta = {
        premium: {
            variant: "default" as const,
            class: "rounded-xl bg-amber-600/30 text-amber-300 hover:bg-amber-600/40",
            label: "Premium"
        },
        trial: {
            variant: "secondary" as const,
            class: "rounded-xl bg-blue-600/20 text-blue-300",
            label: "Trial"
        },
        expired: { variant: "destructive" as const, class: "rounded-xl", label: "Expired" }
    };
</script>

{#snippet Field({
    label,
    value,
    valueClass = "mt-0.5 text-sm font-medium text-neutral-100"
}: {
    label: string;
    value: string | number;
    valueClass?: string;
})}
    <div>
        <p class="text-xs font-medium text-neutral-400">{label}</p>
        <p class={valueClass}>{value}</p>
    </div>
{/snippet}

<section class="border-border/60 border-b py-8">
    <div class="mb-6 flex items-end justify-between gap-4">
        <h2 class="text-base font-semibold">Downloaders</h2>
        {#if services.length > 0}
            <span class="text-muted-foreground text-sm">{services.length} configured</span>
        {/if}
    </div>

    <div class="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {#each services as downloader (downloader.service)}
            {@const premium =
                premiumMeta[
                    downloader.premium_status === "premium" || downloader.premium_status === "trial"
                        ? downloader.premium_status
                        : "expired"
                ]}

            <div class="border-border/60 border-b pb-5">
                <div class="flex items-center justify-between gap-3">
                    <h3 class="text-base font-semibold text-neutral-50">
                        {getServiceDisplayName(downloader.service)}
                    </h3>
                    <Badge variant={premium.variant} class={premium.class}>{premium.label}</Badge>
                </div>

                <div class="mt-3 space-y-3">
                    {#if downloader.username || downloader.email}
                        {@render Field({
                            label: "Account",
                            value: downloader.username || downloader.email || "Unknown"
                        })}
                    {/if}

                    {#if downloader.premium_status === "premium" && (downloader.premium_expires_at || downloader.premium_days_left !== null)}
                        <div class="grid grid-cols-2 gap-3">
                            {#if downloader.premium_expires_at}
                                {@render Field({
                                    label: "Expires",
                                    value: formatDate(downloader.premium_expires_at) ?? "Unknown"
                                })}
                            {/if}
                            {#if downloader.premium_days_left !== null}
                                {@render Field({
                                    label: "Days Left",
                                    value: downloader.premium_days_left,
                                    valueClass: cn(
                                        "mt-0.5 text-sm font-semibold",
                                        downloader.premium_days_left < 7
                                            ? "text-red-400"
                                            : downloader.premium_days_left < 30
                                              ? "text-amber-300"
                                              : "text-green-400"
                                    )
                                })}
                            {/if}
                        </div>
                    {/if}

                    <div class="grid grid-cols-2 gap-3">
                        {#if typeof downloader.points === "number"}
                            {@render Field({
                                label: "Points",
                                value: downloader.points.toLocaleString()
                            })}
                        {/if}
                        {#if downloader.total_downloaded_bytes !== null}
                            {@render Field({
                                label: "Downloaded",
                                value: formatBytes(downloader.total_downloaded_bytes)
                            })}
                        {/if}
                    </div>

                    {#if downloader.cooldown_until}
                        <div
                            class="rounded-md bg-amber-600/20 p-2 text-xs font-medium text-amber-300">
                            Cooldown until {formatDate(downloader.cooldown_until)}
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</section>
