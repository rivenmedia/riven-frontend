<script lang="ts">
    import PageShell from "$lib/components/page-shell.svelte";
    import { gqlClient } from "$lib/graphql-client";
    import { cn } from "$lib/utils";
    import type { PageData } from "./$types";
    import ActivityCard from "$lib/components/dashboard/activity-card.svelte";
    import LibraryChartsCard from "$lib/components/dashboard/library-charts-card.svelte";
    import ReleaseYearCard from "$lib/components/dashboard/release-year-card.svelte";
    import ServiceStatusCard from "$lib/components/dashboard/service-status-card.svelte";
    import DownloaderServicesGrid from "$lib/components/dashboard/downloader-services-grid.svelte";
    import WatchingNowCard from "$lib/components/dashboard/watching-now-card.svelte";
    import UsenetProvidersCard from "$lib/components/dashboard/usenet-providers-card.svelte";
    import UsenetActivityCard from "$lib/components/dashboard/usenet-activity-card.svelte";
    import UsenetHealthCard from "$lib/components/dashboard/usenet-health-card.svelte";
    import type {
        ActivePlaybackSession,
        DownloaderService,
        DashboardStatistics,
        NntpProviderHealth,
        UsenetStreamingHealth,
        UsenetTitleHealth,
        UsenetTitleHealthSummary,
        UsenetTraffic
    } from "$lib/components/dashboard/types";
    import { onMount } from "svelte";
    import { subscribeToRivenMediaEvents } from "$lib/services/riven-live-updates";

    let { data }: { data: PageData } = $props();

    let activePlaybackSessions = $state<ActivePlaybackSession[]>([]);
    let downloaderServices = $state<DownloaderService[]>([]);
    let statistics = $state<DashboardStatistics | undefined>(undefined);
    let usenetProviders = $state<NntpProviderHealth[]>([]);
    let usenetStreaming = $state<UsenetStreamingHealth | null>(null);
    let usenetTitles = $state<UsenetTitleHealth[]>([]);
    const EMPTY_HEALTH_SUMMARY: UsenetTitleHealthSummary = {
        healthy: 0,
        unhealthy: 0,
        notIngested: 0,
        unknown: 0,
        total: 0
    };
    let usenetTitleSummary = $state<UsenetTitleHealthSummary>(EMPTY_HEALTH_SUMMARY);
    let usenetTraffic = $state<UsenetTraffic | null>(null);

    const serviceStatuses = $derived(
        (data as PageData & { services?: Record<string, boolean | null> }).services ?? null
    );
    const completionRate = $derived(
        statistics ? `${statistics.completion_rate.toFixed(2)}%` : "0%"
    );
    const kpiCards = $derived.by(() => [
        {
            title: "Total Items",
            value: statistics?.total_items.toLocaleString()
        },
        {
            title: "Completed",
            value: statistics?.states.Completed?.toLocaleString()
        },
        {
            title: "Incomplete",
            value: statistics?.incomplete_items.toLocaleString(),
            tone: "warning" as const
        },
        {
            title: "Completion Rate",
            value: completionRate
        }
    ]);

    const ACTIVE_PLAYBACK_QUERY = `
        query {
            activePlaybackSessions {
                server
                userName
                parentTitle
                itemTitle
                itemType
                seasonNumber
                episodeNumber
                playbackState
                playbackMethod
                positionSeconds
                durationSeconds
                deviceName
                clientName
                imageUrl
            }
        }
    `;

    const USENET_HEALTH_QUERY = `
        query {
            nntpProviders {
                host
                port
                priority
                isBackup
                maxConnections
                openConnections
                idleConnections
                activeConnections
                demoted
                consecutiveNotFound
            }
            usenetStreamingHealth {
                caches {
                    name
                    bytesUsed
                    bytesMax
                    entries
                    hits
                    misses
                    hitRate
                }
                cacheHitRate
                fetchesOk
                fetchesFailed
                fetchSuccessRate
                bytesDecoded
                inFlight
                deadSegments
                activeStreams
            }
            usenetTitleHealth {
                infoHash
                fileIndex
                mediaItemId
                status
                totalSegments
                sampledSegments
                missingSegments
                errorSegments
                missingPct
                checkedAt
                repairAttempts
                nextRepairAt
                title
                subtitle
                posterPath
                mediaType
            }
            usenetTitleHealthSummary {
                healthy
                unhealthy
                notIngested
                unknown
                total
            }
            usenetTraffic {
                totalBytesDownloaded
                totalArticlesDownloaded
                providers {
                    host
                    bytesDownloaded
                    articlesDownloaded
                }
                daily {
                    day
                    host
                    bytesDownloaded
                    articlesDownloaded
                }
            }
        }
    `;

    const STATS_QUERY = `
        query DashboardStats {
            stats {
                totalMovies
                totalShows
                totalSeasons
                totalEpisodes
                totalItems
                incompleteItems
                completionRate
                completed
                scraped
                indexed
                failed
                paused
                ongoing
                partiallyCompleted
                unreleased
            }
            activity
            yearReleases {
                year
                count
            }
        }
    `;

    type GqlDashboardStats = {
        stats: {
            totalMovies: number;
            totalShows: number;
            totalSeasons: number;
            totalEpisodes: number;
            totalItems: number;
            incompleteItems: number;
            completionRate: number;
            completed: number;
            scraped: number;
            indexed: number;
            failed: number;
            paused: number;
            ongoing: number;
            partiallyCompleted: number;
            unreleased: number;
        };
        activity: Record<string, number>;
        yearReleases: { year: number; count: number }[];
    };

    function mapDashboardStats(result: GqlDashboardStats): DashboardStatistics {
        const s = result.stats;

        return {
            total_movies: s.totalMovies,
            total_shows: s.totalShows,
            total_seasons: s.totalSeasons,
            total_episodes: s.totalEpisodes,
            total_items: s.totalItems,
            incomplete_items: s.incompleteItems,
            completion_rate: s.completionRate,
            states: {
                Completed: s.completed,
                Scraped: s.scraped,
                Indexed: s.indexed,
                Failed: s.failed,
                Paused: s.paused,
                Ongoing: s.ongoing,
                PartiallyCompleted: s.partiallyCompleted,
                Unreleased: s.unreleased
            },
            activity: result.activity ?? {},
            media_year_releases: result.yearReleases ?? []
        };
    }

    async function refreshDashboardStats() {
        const result = await gqlClient<GqlDashboardStats>(STATS_QUERY);
        statistics = mapDashboardStats(result);
    }

    // Resolve streamed Promises from the server load into local state.
    // data.statistics / activePlaybackSessions / downloaderServices are Promises —
    // returning them un-awaited from the server load lets SvelteKit transition
    // immediately while data arrives in the background.
    $effect(() => {
        let cancelled = false;

        Promise.resolve(data.statistics).then((s) => {
            if (!cancelled && s != null) statistics = s;
        });
        Promise.resolve(data.activePlaybackSessions).then((sessions) => {
            if (!cancelled) activePlaybackSessions = sessions ?? [];
        });
        Promise.resolve(data.downloaderServices).then((services) => {
            if (!cancelled) downloaderServices = services ?? [];
        });
        Promise.resolve(data.usenetHealth).then((health) => {
            if (!cancelled && health) {
                usenetProviders = health.providers ?? [];
                usenetStreaming = health.streaming ?? null;
                usenetTitles = health.titles ?? [];
                usenetTitleSummary = health.titleSummary ?? EMPTY_HEALTH_SUMMARY;
                usenetTraffic = health.traffic ?? null;
            }
        });

        return () => {
            cancelled = true;
        };
    });

    $effect(() => {
        return subscribeToRivenMediaEvents(refreshDashboardStats);
    });

    onMount(() => {
        let cancelled = false;

        const refresh = async () => {
            try {
                const result = await gqlClient<{ activePlaybackSessions: ActivePlaybackSession[] }>(
                    ACTIVE_PLAYBACK_QUERY
                );
                if (!cancelled) {
                    activePlaybackSessions = result.activePlaybackSessions ?? [];
                }
            } catch {
                // Keep the last successful snapshot on transient dashboard polling failures.
            }
            try {
                const health = await gqlClient<{
                    nntpProviders: NntpProviderHealth[];
                    usenetStreamingHealth: UsenetStreamingHealth;
                    usenetTitleHealth: UsenetTitleHealth[];
                    usenetTitleHealthSummary: UsenetTitleHealthSummary;
                    usenetTraffic: UsenetTraffic;
                }>(USENET_HEALTH_QUERY);
                if (!cancelled) {
                    usenetProviders = health.nntpProviders ?? [];
                    usenetStreaming = health.usenetStreamingHealth ?? null;
                    usenetTitles = health.usenetTitleHealth ?? [];
                    usenetTitleSummary = health.usenetTitleHealthSummary ?? EMPTY_HEALTH_SUMMARY;
                    usenetTraffic = health.usenetTraffic ?? null;
                }
            } catch {
                // Keep the last successful usenet-health snapshot on transient failures.
            }
        };

        const interval = window.setInterval(refresh, 15000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    });
</script>

<svelte:head>
    <title>Dashboard - Riven</title>
</svelte:head>

{#snippet KPICard({
    title,
    value,
    tone = "default"
}: {
    title: string;
    value: string | undefined;
    tone?: "default" | "warning";
})}
    <div class={cn("border-border/60 border-b py-5", tone === "warning" && "border-amber-600/30")}>
        <p class="text-sm font-medium text-neutral-300">{title}</p>
        <div
            class={cn(
                "mt-3 text-2xl font-semibold tracking-tight",
                tone === "warning" ? "text-amber-300" : "text-neutral-50"
            )}>
            {value}
        </div>
    </div>
{/snippet}

<PageShell class="mx-auto w-full max-w-7xl">
    <header class="border-border/60 border-b pb-6">
        <h1 class="text-3xl font-bold tracking-tight">Media Library Statistics</h1>
    </header>

    <section class="grid grid-cols-1 gap-x-10 gap-y-4 py-2 md:grid-cols-2 lg:grid-cols-4">
        {#each kpiCards as card (card.title)}
            {@render KPICard(card)}
        {/each}
    </section>

    <ActivityCard activity={statistics?.activity ?? {}} />
    <LibraryChartsCard {statistics} />
    <ReleaseYearCard data={statistics?.media_year_releases ?? []} />
    <ServiceStatusCard statuses={serviceStatuses} />
    <DownloaderServicesGrid services={downloaderServices} />
    <WatchingNowCard sessions={activePlaybackSessions} />
    {#if usenetProviders.length > 0}
        <UsenetProvidersCard providers={usenetProviders} />
        <UsenetActivityCard health={usenetStreaming} traffic={usenetTraffic} />
        <UsenetHealthCard titles={usenetTitles} summary={usenetTitleSummary} />
    {/if}
</PageShell>
