<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { gqlClient } from "$lib/graphql-client";
    import { TMDB_IMAGE_BASE_URL } from "$lib/indexer-constants";
    import type { UsenetTitleHealth, UsenetTitleHealthSummary } from "./types";

    let { titles, summary }: { titles: UsenetTitleHealth[]; summary: UsenetTitleHealthSummary } =
        $props();

    // "Missing data" / "Not ingested" → re-acquire: removes the broken media
    // entry (so the item truly un-completes) and re-processes. The ingest
    // availability probe rejects the dead release, so a complete one is picked.
    const REGRAB_MUTATION = `
        mutation Regrab($mediaItemId: Int!) {
            regrabUsenetTitle(mediaItemId: $mediaItemId)
        }
    `;
    // "Unverified" → re-check: re-run the availability scan now (the provider is
    // reachable again), which resolves it to healthy or missing-data.
    const RESCAN_MUTATION = `
        mutation RescanUsenetHealth($infoHash: String!, $fileIndex: Int!) {
            rescanUsenetHealth(infoHash: $infoHash, fileIndex: $fileIndex)
        }
    `;

    // Per-row action state, keyed by "infoHash:fileIndex".
    let action = $state<Record<string, "working" | "done" | "error">>({});
    const rowKey = (t: UsenetTitleHealth) => `${t.infoHash}:${t.fileIndex}`;

    // Items needing a re-grab (re-scrape): confirmed-broken or never-ingested.
    const needsRegrab = (status: string) => status === "unhealthy" || status === "not_ingested";

    // Surface the actionable rows (anything not confirmed healthy), worst-first
    // (the backend already orders them).
    const problems = $derived(titles.filter((t) => t.status !== "healthy"));

    function poster(path: string | null) {
        return path ? `${TMDB_IMAGE_BASE_URL}/w92${path}` : null;
    }

    function relativeTime(unixSeconds: number | null) {
        if (!unixSeconds) return "never checked";
        const secs = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds));
        if (secs < 90) return "just now";
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }

    function untilTime(unixSeconds: number | null) {
        if (!unixSeconds) return null;
        const secs = Math.floor(unixSeconds - Date.now() / 1000);
        if (secs <= 0) return "now";
        const mins = Math.ceil(secs / 60);
        if (mins < 60) return `${mins}m`;
        return `${Math.round(mins / 60)}h`;
    }

    function statusBadge(status: string) {
        if (status === "unhealthy")
            return { label: "Missing data", variant: "destructive" as const };
        if (status === "not_ingested")
            return { label: "Not ingested", variant: "destructive" as const };
        if (status === "unknown") return { label: "Unverified", variant: "secondary" as const };
        return { label: "Healthy", variant: "default" as const };
    }

    async function regrab(t: UsenetTitleHealth) {
        const key = rowKey(t);
        if (t.mediaItemId === null || action[key] === "working") return;
        action = { ...action, [key]: "working" };
        try {
            await gqlClient<{ regrabUsenetTitle: string }>(REGRAB_MUTATION, {
                mediaItemId: t.mediaItemId
            });
            action = { ...action, [key]: "done" };
        } catch {
            action = { ...action, [key]: "error" };
        }
    }

    async function recheck(t: UsenetTitleHealth) {
        const key = rowKey(t);
        if (action[key] === "working") return;
        action = { ...action, [key]: "working" };
        try {
            await gqlClient<{ rescanUsenetHealth: string }>(RESCAN_MUTATION, {
                infoHash: t.infoHash,
                fileIndex: t.fileIndex
            });
            // The dashboard's 15s poll will refresh the row to its new status.
            action = { ...action, [key]: "done" };
        } catch {
            action = { ...action, [key]: "error" };
        }
    }
</script>

<section class="border-border/60 border-b py-8">
    <div class="mb-5 flex items-center gap-3">
        <h2 class="text-base font-semibold">Usenet Health</h2>
        {#if summary.total > 0}
            <span class="text-[11px] text-neutral-500">
                {summary.healthy} healthy
                {#if summary.unhealthy > 0}
                    · <span class="text-red-400">{summary.unhealthy} missing data</span>
                {/if}
                {#if summary.notIngested > 0}
                    · <span class="text-red-400">{summary.notIngested} not ingested</span>
                {/if}
                {#if summary.unknown > 0}
                    · {summary.unknown} unverified
                {/if}
            </span>
        {/if}
    </div>

    {#if summary.total === 0}
        <p class="text-sm text-neutral-400">No usenet titles checked yet.</p>
    {:else if problems.length === 0}
        <p class="text-sm text-neutral-400">
            All {summary.healthy} checked usenet {summary.healthy === 1 ? "title is" : "titles are"} healthy.
        </p>
    {:else}
        <div class="flex flex-col">
            {#each problems as t (t.infoHash + ":" + t.fileIndex)}
                {@const badge = statusBadge(t.status)}
                {@const state = action[t.infoHash + ":" + t.fileIndex]}
                <div class="border-border/60 flex items-center gap-3 border-b py-2.5">
                    <div
                        class="h-14 w-10 shrink-0 overflow-hidden rounded border border-white/8 bg-white/[0.04]">
                        {#if poster(t.posterPath)}
                            <img
                                src={poster(t.posterPath)}
                                alt={t.title ?? "poster"}
                                class="h-full w-full object-cover"
                                loading="lazy" />
                        {/if}
                    </div>

                    <div class="min-w-0 flex-1">
                        <p class="truncate text-[13px] font-semibold text-neutral-100">
                            {t.title ?? t.infoHash}
                        </p>
                        {#if t.subtitle}
                            <p class="truncate text-[11px] text-neutral-400">{t.subtitle}</p>
                        {/if}
                        <p class="mt-0.5 text-[11px] text-neutral-500">
                            checked {relativeTime(t.checkedAt)}
                            {#if t.status === "unhealthy" && t.sampledSegments > 0}
                                · {t.missingPct.toFixed(1)}% of {t.sampledSegments} sampled missing
                            {:else if t.status === "not_ingested"}
                                · no segment map — re-grab to re-ingest
                            {:else if t.status === "unknown"}
                                · couldn't verify ({t.errorSegments}/{t.sampledSegments} probes errored)
                            {/if}
                            {#if t.repairAttempts > 0}
                                · auto-repair {t.repairAttempts}×{#if untilTime(t.nextRepairAt)},
                                    next in {untilTime(t.nextRepairAt)}{/if}
                            {/if}
                        </p>
                    </div>

                    <Badge variant={badge.variant} class="shrink-0 text-[10px]"
                        >{badge.label}</Badge>

                    {#if needsRegrab(t.status) && t.mediaItemId !== null}
                        <button
                            type="button"
                            class="shrink-0 rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-medium text-neutral-200 transition hover:bg-white/[0.06] disabled:opacity-50"
                            title="Reset and re-scrape for a complete release"
                            disabled={state === "working"}
                            onclick={() => regrab(t)}>
                            {#if state === "working"}
                                Re-grabbing…
                            {:else if state === "done"}
                                Re-scraping
                            {:else if state === "error"}
                                Retry
                            {:else}
                                Re-grab
                            {/if}
                        </button>
                    {:else}
                        <button
                            type="button"
                            class="shrink-0 rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-medium text-neutral-200 transition hover:bg-white/[0.06] disabled:opacity-50"
                            title="Re-run the availability check now"
                            disabled={state === "working"}
                            onclick={() => recheck(t)}>
                            {#if state === "working"}
                                Checking…
                            {:else if state === "done"}
                                Checked
                            {:else if state === "error"}
                                Retry
                            {:else}
                                Re-check
                            {/if}
                        </button>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</section>
