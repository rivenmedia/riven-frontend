<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import type { ActivePlaybackSession } from "./types";

    let { sessions }: { sessions: ActivePlaybackSession[] } = $props();

    const playbackTone = {
        playing: "default",
        paused: "secondary",
        buffering: "secondary"
    } as const;

    const playbackMethod = {
        directplay: "Direct Play",
        direct_play: "Direct Play",
        directstream: "Direct Stream",
        direct_stream: "Direct Stream",
        transcode: "Transcode"
    } as const;

    function formatTime(seconds: number | null | undefined) {
        if (seconds === null || seconds === undefined || seconds < 0) return null;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = Math.floor(seconds % 60);
        return hours > 0
            ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
            : `${minutes}:${String(remainder).padStart(2, "0")}`;
    }

    const cards = $derived.by(() =>
        sessions.map((session) => {
            const progress =
                session.positionSeconds !== null &&
                session.durationSeconds !== null &&
                session.durationSeconds > 0
                    ? Math.max(
                          0,
                          Math.min(100, (session.positionSeconds / session.durationSeconds) * 100)
                      )
                    : 0;
            const remaining =
                session.positionSeconds !== null &&
                session.durationSeconds !== null &&
                session.durationSeconds > session.positionSeconds
                    ? formatTime(session.durationSeconds - session.positionSeconds)
                    : null;

            return {
                ...session,
                key: `${session.server}:${session.userName ?? "unknown"}:${session.itemTitle}`,
                displayTitle: session.parentTitle ?? session.itemTitle,
                episodeCode:
                    session.seasonNumber !== null && session.episodeNumber !== null
                        ? `S${String(session.seasonNumber).padStart(2, "0")}E${String(session.episodeNumber).padStart(2, "0")}`
                        : null,
                playbackLabel:
                    session.playbackState.charAt(0).toUpperCase() +
                    session.playbackState.slice(1).toLowerCase(),
                playbackVariant:
                    playbackTone[
                        session.playbackState.toLowerCase() as keyof typeof playbackTone
                    ] ?? "secondary",
                methodLabel:
                    playbackMethod[
                        session.playbackMethod.toLowerCase() as keyof typeof playbackMethod
                    ] ?? "Unknown",
                deviceLabel: session.deviceName ? "Device" : "Client",
                deviceValue: session.deviceName ?? session.clientName ?? "Unknown",
                showClient:
                    !!session.deviceName &&
                    !!session.clientName &&
                    session.deviceName.trim().toLowerCase() !==
                        session.clientName.trim().toLowerCase(),
                startTime: formatTime(session.positionSeconds),
                endTime: formatTime(session.durationSeconds),
                remaining,
                progress
            };
        })
    );
</script>

<section class="border-border/60 border-b py-8">
    <div class="mb-5">
        <h2 class="text-base font-semibold">Watching Now</h2>
    </div>

    <div>
        {#if cards.length === 0}
            <p class="text-sm text-neutral-400">Nothing playing.</p>
        {:else}
            <div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {#each cards as session (session.key)}
                    <div class="border-border/60 border-b pb-3">
                        <div class="flex gap-2.5">
                            <div
                                class="h-16 w-12 shrink-0 overflow-hidden rounded-md border border-white/8 bg-white/[0.04]">
                                {#if session.imageUrl}
                                    <img
                                        src={session.imageUrl}
                                        alt={session.displayTitle}
                                        class="h-full w-full object-cover"
                                        loading="lazy" />
                                {:else}
                                    <div
                                        class="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
                                        {session.itemType ?? "Media"}
                                    </div>
                                {/if}
                            </div>

                            <div class="min-w-0 flex-1">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <div class="flex flex-wrap items-center gap-1.5">
                                            <span
                                                class="truncate text-[13px] leading-tight font-semibold text-neutral-100">
                                                {session.displayTitle}
                                            </span>
                                            {#if session.episodeCode}
                                                <Badge
                                                    variant="outline"
                                                    class="rounded-md px-1.5 py-0 text-[10px]">
                                                    {session.episodeCode}
                                                </Badge>
                                            {/if}
                                        </div>
                                        {#if session.parentTitle}
                                            <p
                                                class="mt-0.5 line-clamp-1 text-[11px] text-neutral-300">
                                                {session.itemTitle}
                                            </p>
                                        {/if}
                                    </div>
                                    <Badge
                                        variant={session.playbackVariant}
                                        class="rounded-md px-1.5 py-0 text-[10px]">
                                        {session.playbackLabel}
                                    </Badge>
                                </div>

                                <div
                                    class="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-neutral-500">
                                    <span class="truncate"
                                        >{session.userName ?? "Unknown user"} on {session.server}</span>
                                    <span class="text-neutral-600">•</span>
                                    <span>{session.methodLabel}</span>
                                    {#if session.itemType}
                                        <span class="text-neutral-600">•</span>
                                        <span>{session.itemType}</span>
                                    {/if}
                                </div>

                                <div
                                    class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">
                                    <span class="truncate">
                                        <span class="text-neutral-400">{session.deviceLabel}</span>
                                        <span class="ml-1 text-neutral-200"
                                            >{session.deviceValue}</span>
                                    </span>
                                    {#if session.showClient}
                                        <span class="truncate">
                                            <span class="text-neutral-400">Client</span>
                                            <span class="ml-1 text-neutral-200"
                                                >{session.clientName}</span>
                                        </span>
                                    {/if}
                                </div>

                                {#if session.startTime && session.endTime}
                                    <div class="mt-1.5">
                                        <div
                                            class="mb-1 flex items-center justify-between text-[10px] text-neutral-500">
                                            <span>{session.startTime}</span>
                                            <span>{session.endTime}</span>
                                        </div>
                                        <div
                                            class="relative h-1 overflow-hidden rounded-full bg-white/8">
                                            <div
                                                class="relative h-full rounded-full bg-[var(--chart-1)]"
                                                style={`width: ${session.progress}%`}>
                                                <span
                                                    class="absolute top-1/2 right-0 h-2 w-2 translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-[var(--chart-1)] shadow-[0_0_8px_color-mix(in_oklab,var(--chart-1)_45%,transparent)]"
                                                ></span>
                                            </div>
                                        </div>
                                        {#if session.remaining}
                                            <p class="mt-1 text-right text-[10px] text-neutral-500">
                                                {session.remaining} left
                                            </p>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</section>
