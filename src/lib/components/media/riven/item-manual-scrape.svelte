<script lang="ts">
    import { untrack } from "svelte";
    import { invalidateAll } from "$app/navigation";
    import providers from "$lib/providers";
    import type { components } from "$lib/providers/riven";
    import {
        type Stream,
        type DebridFile,
        type Container,
        type ShowFileData,
        type FileMapping,
        type ParsedTitleData,
        type BatchSession
    } from "$lib/types";

    import type { Snippet } from "svelte";

    type RtnSettingsModel = components["schemas"]["RTNSettingsModel"];
    type AutoScrapeRequest = components["schemas"]["AutoScrapeRequest"];

    import { toast } from "svelte-sonner";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Accordion from "$lib/components/ui/accordion/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import AlertCircle from "@lucide/svelte/icons/alert-circle";
    import FileIcon from "@lucide/svelte/icons/file";
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import Search from "@lucide/svelte/icons/search";
    import Zap from "@lucide/svelte/icons/zap";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
    import Monitor from "@lucide/svelte/icons/monitor";
    import Star from "@lucide/svelte/icons/star";
    import Disc from "@lucide/svelte/icons/disc";
    import Sun from "@lucide/svelte/icons/sun";
    import Volume2 from "@lucide/svelte/icons/volume-2";
    import Plus from "@lucide/svelte/icons/plus";
    import Trash2 from "@lucide/svelte/icons/trash-2";
    import X from "@lucide/svelte/icons/x";
    import Magnet from "@lucide/svelte/icons/magnet";
    import Download from "@lucide/svelte/icons/download";
    import Ghost from "@lucide/svelte/icons/ghost";
    import Inbox from "@lucide/svelte/icons/inbox";
    import FileQuestion from "@lucide/svelte/icons/file-question";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import StreamItem from "./stream-item.svelte";
    import SeasonSelector, { type SeasonInfo } from "./season-selector.svelte";
    import { createScopedLogger } from "$lib/logger";

    const logger = createScopedLogger("manual-scrape");

    interface Props {
        title: string | null | undefined;
        itemId?: string | null;
        externalId: string;
        mediaType: "tv" | "movie";
        variant?:
            | "ghost"
            | "default"
            | "link"
            | "destructive"
            | "outline"
            | "secondary"
            | undefined;
        size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | undefined;
        class?: string;
        seasons?: SeasonInfo[];
        children?: Snippet;
    }

    let {
        title,
        itemId,
        externalId,
        mediaType,
        variant = "ghost",
        size = "sm",
        seasons = [],
        children,
        ...restProps
    }: Props = $props();

    interface FileSelection {
        file_id: number;
        filename: string;
        filesize: number;
    }

    type UpdateBody = DebridFile | ShowFileData;

    let open = $state(false);
    let step = $state(1);
    let tabValue = $state<"search" | "auto">("search");
    let loading = $state(false);
    let settingsLoading = $state(false);
    let error = $state<string | null>(null);
    let magnetLink = $state("");
    let streams = $state<{ magnet: string; stream: Stream }[]>([]);
    let currentSessionMagnet: string | null = null;

    function parseFileId(value: string | number | undefined): number {
        if (value === undefined || value === null) {
            throw new Error("File ID is undefined or null");
        }
        const parsed = typeof value === "number" ? value : parseInt(value, 10);
        if (isNaN(parsed)) {
            throw new Error(`Invalid file ID: ${value}`);
        }
        return parsed;
    }

    async function handleComplete() {
        if (!currentSessionMagnet) return;

        loading = true;
        error = null;

        try {
            // Step 1: Select files (Stateless Download logic)
            const container: Container = {};
            selectedFilesMappings.forEach((mapping) => {
                const fId = parseFileId(mapping.file_id);
                container[fId] = {
                    file_id: fId,
                    filename: mapping.filename,
                    filesize: mapping.filesize,
                    download_url: mapping.download_url ?? undefined
                };
            });

            if (!sessionData?.session_id) {
                throw new Error("No active session found");
            }

            // Action 1: Select Files
            await providers.riven.POST("/api/v1/scrape/session/{session_id}", {
                params: {
                    path: { session_id: sessionData.session_id }
                },
                body: {
                    action: "select_files",
                    files: container
                }
            });

            // Action 1.5: Update Attributes (Map files to episodes/movies)
            let fileDataPayload: any = null;

            if (mediaType === "movie") {
                const mapping = selectedFilesMappings[0];
                if (mapping) {
                    fileDataPayload = {
                        file_id: parseFileId(mapping.file_id),
                        filename: mapping.filename,
                        filesize: mapping.filesize,
                        download_url: mapping.download_url
                    };
                }
            } else {
                // TV Shows
                const showData: Record<number, Record<number, any>> = {};
                selectedFilesMappings.forEach((m) => {
                    if (m.season !== undefined && m.episode !== undefined) {
                        if (!showData[m.season]) {
                            showData[m.season] = {};
                        }
                        showData[m.season][m.episode] = {
                            file_id: parseFileId(m.file_id),
                            filename: m.filename,
                            filesize: m.filesize,
                            download_url: m.download_url
                        };
                    }
                });

                if (Object.keys(showData).length > 0) {
                    fileDataPayload = showData;
                }
            }

            if (fileDataPayload) {
                await providers.riven.POST("/api/v1/scrape/session/{session_id}", {
                    params: {
                        path: { session_id: sessionData.session_id }
                    },
                    body: {
                        action: "update_attributes",
                        file_data: fileDataPayload
                    }
                });
            }

            // Action 2: Complete Session
            const { data: selectData, error: selectErr } = await providers.riven.POST(
                "/api/v1/scrape/session/{session_id}",
                {
                    params: {
                        path: { session_id: sessionData.session_id }
                    },
                    body: {
                        action: "complete"
                    }
                }
            );

            if (!selectData) {
                const errorMsg =
                    (selectErr as { message?: string; detail?: string })?.message ||
                    (selectErr as { message?: string; detail?: string })?.detail ||
                    "Failed to start download";
                error = errorMsg;
                toast.error(errorMsg);
                return;
            }

            toast.success("Download started successfully!");
            open = false;
            resetFlow();
            await invalidateAll();
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "An error occurred";
            error = errorMsg;
            toast.error(errorMsg);
        } finally {
            loading = false;
        }
    }
    let sessionData = $state<any | null>(null);
    let selectedFilesMappings = $state<FileMapping[]>([]);
    let rankingOptions = $state<Record<string, string[]>>({});
    let selectedOptions = $state<Record<string, string[]>>({
        resolutions: [],
        quality: [],
        rips: [],
        hdr: [],
        audio: [],
        extras: [],

        trash: [],
        require: [],
        exclude: []
    });
    let canStartAutoScrape = $derived(Object.values(selectedOptions).some((arr) => arr.length > 0));

    let selectedMagnets = $state<Set<string>>(new Set());
    let activeTab = $state("all");
    let batchProgress = $state<{ current: number; total: number; message: string } | null>(null);
    let searchQuery = $state("");

    let customTitle = $state("");
    let customImdbId = $state("");
    let minFilesizeOverride = $state<number | null>(null);
    let maxFilesizeOverride = $state<number | null>(null);

    // Season Selection State - managed by SeasonSelector component
    let selectedSeasons = $state<Set<number>>(new Set());
    let isManualMagnet = $state(false);
    let batchSessions = $state<BatchSession[]>([]);
    let preparingBatch = $state(false);
    let streamingProgress = $state<{
        isStreaming: boolean;
        currentService: string | null;
        totalStreams: number;
        servicesCompleted: number;
        totalServices: number;
        message: string | null;
    }>({
        isStreaming: false,
        currentService: null,
        totalStreams: 0,
        servicesCompleted: 0,
        totalServices: 0,
        message: null
    });
    let eventSourceRef = $state<EventSource | null>(null);

    const categoryIcons: Record<string, any> = {
        resolutions: Monitor,
        quality: Star,
        rips: Disc,
        hdr: Sun,
        audio: Volume2,
        extras: Plus,
        trash: Trash2
    };

    // Track which categories are expanded (all collapsed by default)
    let expandedCategories = $state<Set<string>>(new Set());

    let filteredStreams = $derived.by(() => {
        let result = streams;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(({ stream }) => stream.raw_title.toLowerCase().includes(query));
        }

        if (activeTab === "all") return result;

        return result.filter(({ stream }) => {
            const data = stream.parsed_data as ParsedTitleData;
            const seasons = data.seasons || [];
            const episodes = data.episodes || [];
            const isComplete = data.complete === true;

            const isShowPack = seasons.length > 1;

            // Season Pack: Single season AND (marked complete OR no episodes listed OR many episodes listed)
            const isSeasonPack =
                seasons.length === 1 &&
                (isComplete || episodes.length === 0 || episodes.length > 2);

            // Episode: Has episodes AND is not a season pack (so 1 or 2 episodes)
            const isEpisode = episodes.length > 0 && !isSeasonPack && !isShowPack;

            if (activeTab === "show_packs") return isShowPack;
            if (activeTab === "season_packs") return isSeasonPack;
            if (activeTab === "episodes") return isEpisode;
            return true;
        });
    });

    // Stream counts for TV tabs
    let streamCounts = $derived.by(() => {
        const baseStreams = searchQuery
            ? streams.filter(({ stream }) =>
                  stream.raw_title.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : streams;

        let showPacks = 0,
            seasonPacks = 0,
            episodes = 0;

        for (const { stream } of baseStreams) {
            const data = stream.parsed_data as ParsedTitleData;
            const seasons = data.seasons || [];
            const episodeList = data.episodes || [];
            const isComplete = data.complete === true;

            const isShowPack = seasons.length > 1;
            const isSeasonPack =
                seasons.length === 1 &&
                (isComplete || episodeList.length === 0 || episodeList.length > 2);
            const isEpisode = episodeList.length > 0 && !isSeasonPack && !isShowPack;

            if (isShowPack) showPacks++;
            else if (isSeasonPack) seasonPacks++;
            else if (isEpisode) episodes++;
        }

        return {
            all: baseStreams.length,
            show_packs: showPacks,
            season_packs: seasonPacks,
            episodes: episodes
        };
    });

    function toggleMagnetSelection(magnet: string) {
        const newSet = new Set(selectedMagnets);
        if (newSet.has(magnet)) {
            newSet.delete(magnet);
        } else {
            newSet.add(magnet);
        }
        selectedMagnets = newSet;
    }

    async function handleBatchScrape() {
        if (selectedMagnets.size === 0) return;

        preparingBatch = true;
        batchSessions = [];
        batchProgress = {
            current: 0,
            total: selectedMagnets.size,
            message: "Preparing sessions..."
        };

        try {
            const magnets = Array.from(selectedMagnets);
            const CONCURRENCY = 3;
            let itemsProcessed = 0;

            for (let i = 0; i < magnets.length; i += CONCURRENCY) {
                const chunk = magnets.slice(i, i + CONCURRENCY);

                await Promise.all(
                    chunk.map(async (magnet) => {
                        // Find stream info
                        const streamInfo = streams.find((s) => s.magnet === magnet);
                        if (streamInfo) {
                            await prepareBatchSession(magnet, streamInfo.stream);
                        }

                        itemsProcessed++;
                        batchProgress = {
                            current: itemsProcessed,
                            total: magnets.length,
                            message: `Preparing ${itemsProcessed}/${magnets.length}`
                        };
                    })
                );
            }

            step = 6; // Batch Confirmation Step
        } catch (e) {
            logger.error("Batch preparation failed", e);
            toast.error("Failed to prepare batch sessions");
        } finally {
            preparingBatch = false;
            batchProgress = null;
        }
    }

    async function prepareBatchSession(magnet: string, stream: Stream) {
        try {
            const queryParams: any = {
                media_type: mediaType,
                magnet: `magnet:?xt=urn:btih:${magnet}`
            };

            if (minFilesizeOverride !== null) {
                queryParams.min_filesize_override = minFilesizeOverride;
            }
            if (maxFilesizeOverride !== null) {
                queryParams.max_filesize_override = maxFilesizeOverride;
            }

            if (itemId)
                queryParams.item_id = parseFileId(itemId); // Ensure int
            else if (externalId) {
                if (mediaType === "movie") queryParams.tmdb_id = externalId;
                if (mediaType === "tv") queryParams.tvdb_id = externalId;
            }

            const { data, error: err } = await providers.riven.POST(
                "/api/v1/scrape/start_session",
                {
                    params: {
                        query: queryParams
                    }
                }
            );

            if (data) {
                // Cast to specific type if known, or improve type definitions
                const sData = data as components["schemas"]["StartSessionResponse"];
                let mappings: FileMapping[];

                if (
                    sData.containers &&
                    sData.containers.files &&
                    sData.containers.files.length > 0
                ) {
                    const files = sData.containers.files;
                    const filenames = files.reduce<string[]>((acc: string[], f: DebridFile) => {
                        if (f.filename != null) acc.push(f.filename);
                        return acc;
                    }, []);

                    // Only call parseTorrentTitles if we have valid filenames
                    if (filenames.length > 0) {
                        const { data: parseData } = await providers.riven.POST(
                            "/api/v1/scrape/parse",
                            {
                                body: filenames
                            }
                        );

                        if (parseData) {
                            mappings = files.map((file: DebridFile, idx: number) => {
                                // Assuming parseData follows a specific structure, cast appropriately or define it
                                const parsed = (parseData as any).data[idx] as ParsedTitleData;
                                return {
                                    file_id: file.file_id?.toString() ?? "",
                                    filename: file.filename ?? "",
                                    filesize: file.filesize ?? 0,
                                    season: parsed.seasons?.[0],
                                    episode: parsed.episodes?.[0],
                                    download_url: file.download_url
                                };
                            });

                            batchSessions.push({
                                sessionId: sData.session_id, // Use actual session ID
                                magnet,
                                stream,
                                sessionData: sData,
                                mappings,
                                status: "pending"
                            });
                        }
                    }
                }
            }
        } catch (e) {
            logger.error(`Failed to prepare session for ${magnet}`, e);
        }
    }

    function resetFlow() {
        step = 1;
        loading = false;
        error = null;
        magnetLink = "";
        streams = [];
        loading = false;
        error = null;
        magnetLink = "";
        streams = [];
        currentSessionMagnet = null;
        sessionData = null;
        sessionData = null;
        selectedFilesMappings = [];

        selectedOptions = {
            resolutions: [],
            quality: [],
            rips: [],
            hdr: [],
            audio: [],
            extras: [],

            trash: [],
            require: [],
            exclude: []
        };
        selectedMagnets = new Set();
        activeTab = "all";
        batchProgress = null;
        searchQuery = "";
        batchSessions = [];
        preparingBatch = false;

        // Close EventSource if active
        if (eventSourceRef) {
            eventSourceRef.close();
            eventSourceRef = null;
        }
        streamingProgress = {
            isStreaming: false,
            currentService: null,
            totalStreams: 0,
            servicesCompleted: 0,
            totalServices: 0,
            message: null
        };
    }

    async function fetchSettings() {
        settingsLoading = true;
        try {
            const { data } = await providers.riven.GET("/api/v1/settings/get/all");

            if (data) {
                const ranking = data.ranking;
                const newSelectedOptions = { ...selectedOptions };
                const newRankingOptions: Record<string, string[]> = {};

                // Resolutions
                if (ranking?.resolutions) {
                    newRankingOptions.resolutions = Object.keys(ranking.resolutions).filter(
                        (k) => k !== "unknown"
                    ) as string[];
                    // Populate selected resolutions
                    newSelectedOptions.resolutions = Object.entries(ranking.resolutions)
                        .filter(([k, v]) => v === true && k !== "unknown")
                        .map(([k]) => k);
                }

                // Custom Ranks
                const categories: (keyof import("$lib/providers/riven").components["schemas"]["CustomRanksConfig"])[] =
                    ["quality", "rips", "hdr", "audio", "extras", "trash"];
                // Note: 'trash' might not be in CustomRanksConfig in the same way, need verification or ANY cast if strict.

                categories.forEach((cat) => {
                    if (ranking?.custom_ranks && (ranking.custom_ranks as any)[cat]) {
                        const categoryObj = (ranking.custom_ranks as any)[cat];
                        if (!categoryObj) return;

                        newRankingOptions[cat] = Object.keys(categoryObj);

                        // Populate selected options for this category
                        newSelectedOptions[cat] = Object.entries(categoryObj)
                            .filter(([_, val]) => {
                                return (val as any)?.fetch === true;
                            })
                            .map(([key]) => key);
                    }
                });

                rankingOptions = newRankingOptions;
                selectedOptions = newSelectedOptions;
            }
        } catch (e) {
            logger.error("Failed to fetch settings", e);
        } finally {
            settingsLoading = false;
        }
    }

    function getRankingOverrides() {
        const rankingOverrides: Record<string, string[]> = {};
        Object.entries(selectedOptions).forEach(([key, value]) => {
            if (
                [
                    "resolutions",
                    "quality",
                    "rips",
                    "hdr",
                    "audio",
                    "extras",
                    "trash",
                    "require",
                    "exclude"
                ].includes(key)
            ) {
                rankingOverrides[key] = value;
            }
        });
        return rankingOverrides;
    }

    function getScrapeParams() {
        const params: any = {
            media_type: mediaType
        };

        if (itemId) {
            params.item_id = String(itemId);
        }

        if (externalId) {
            if (mediaType === "movie") params.tmdb_id = externalId;
            if (mediaType === "tv") params.tvdb_id = externalId;
        }

        return params;
    }

    async function handleAutoScrape() {
        loading = true;
        error = null;

        try {
            const params = getScrapeParams();
            const rankingOverrides = getRankingOverrides();

            const body: AutoScrapeRequest = {
                ...params,
                min_filesize_override: minFilesizeOverride,
                max_filesize_override: maxFilesizeOverride
            };

            if (Object.keys(rankingOverrides).length > 0) {
                body.ranking_overrides = rankingOverrides;
            }

            if (
                mediaType === "tv" &&
                seasons.length > 0 &&
                selectedSeasons.size > 0 &&
                selectedSeasons.size < seasons.length
            ) {
                const { media_type: _, ...restBody } = body;
                // Use AutoScrapeRequest
                const seasonBody: AutoScrapeRequest = {
                    ...restBody,
                    media_type: "tv",
                    season_numbers: Array.from(selectedSeasons)
                };

                // Fire and forget - don't await this
                providers.riven
                    .POST("/api/v1/scrape/auto", {
                        body: seasonBody
                    })
                    .then(({ data: sData, error: sErr }) => {
                        if (sErr) {
                            const errorMsg =
                                (sErr as any).message ||
                                (sErr as any).detail ||
                                "Failed to start auto scrape";
                            toast.error(errorMsg);
                        }
                    })
                    .catch((e) => {
                        logger.error("Auto scrape failed", e);
                        toast.error("An error occurred starting the scrape");
                    });

                toast.success("Media item requested successfully!");
                open = false;
                loading = false;
                return;
            }

            // Fire and forget - non-blocking
            providers.riven
                .POST("/api/v1/scrape/auto", {
                    body: body
                })
                .then(({ data, error: err }) => {
                    if (err) {
                        // @ts-ignore
                        const errorMsg = err.message || err.detail || "Failed to start auto scrape";
                        toast.error(errorMsg);
                    }
                })
                .catch((e) => {
                    const errorMsg = e instanceof Error ? e.message : "An error occurred";
                    toast.error(errorMsg);
                });

            toast.success("Media item requested successfully!");
            open = false; // Close dialog immediately
            loading = false;
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "An error occurred";
            error = errorMsg;
            toast.error(errorMsg);
        } finally {
            loading = false;
        }
    }

    // Helper to start a session with a given magnet link
    async function startScrapeSession(magnet: string) {
        loading = true;
        error = null;

        try {
            const queryParams: any = {
                media_type: mediaType,
                magnet: magnet
            };

            if (minFilesizeOverride !== null) {
                queryParams.min_filesize_override = minFilesizeOverride;
            }
            if (maxFilesizeOverride !== null) {
                queryParams.max_filesize_override = maxFilesizeOverride;
            }

            // Use shared helper for IDs
            const idParams = getScrapeParams();
            Object.assign(queryParams, idParams);

            const { data, error: err } = await providers.riven.POST(
                "/api/v1/scrape/start_session",
                {
                    params: { query: queryParams }
                }
            );

            if (data) {
                // Cast to any to handle new fields
                const sData = data as any;
                let mappings: FileMapping[];
                currentSessionMagnet = magnet;

                if (sData.parsed_files && sData.parsed_files.length > 0) {
                    const files = sData.parsed_files;
                    mappings = files.map((file: any, idx: number) => {
                        const pm = file.parsed_metadata;
                        return {
                            file_id: file.file_id?.toString() || idx.toString(),
                            filename: file.filename || "",
                            filesize: file.filesize || 0,
                            season: pm?.seasons?.[0],
                            episode: pm?.episodes?.[0]
                        };
                    });

                    batchSessions.push({
                        sessionId: sData.torrent_info?.infohash || magnet,
                        magnet,
                        stream: streams.find((s) => s.magnet === magnet)?.stream as Stream,
                        sessionData: sData,
                        mappings,
                        status: "pending"
                    });
                }

                sessionData = data;
                toast.success("Session started successfully!");
                await handleSelectAllFiles();
                // No longer need to check step, handleSelectAllFiles will move to step 3
            } else {
                const errorMsg =
                    (err as any)?.detail || (err as any)?.message || "Failed to start session";
                error = errorMsg;
                toast.error(errorMsg);
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "An error occurred";
            error = errorMsg;
            toast.error(errorMsg);
        } finally {
            loading = false;
        }
    }

    async function handleFetchStreams() {
        loading = true;
        error = null;

        // If magnet link is provided, use it directly (non-streaming)
        if (magnetLink) {
            isManualMagnet = true;
            // When manually entering a magnet, we assume the user knows what they are doing,
            // so we disable the filesize check to allow scraping of any file size.
            // (Note: manual magnet usually implies skipping normal filters, so we could pass
            // a very high bitrate or None if the backend treats None as 'use system limit' vs 'unlimited'.
            // But here we just respect the UI setting or leave it default.)
            await startScrapeSession(magnetLink);
            return;
        }

        // Build query parameters for SSE endpoint
        const baseParams = getScrapeParams();
        const params = new URLSearchParams();

        Object.entries(baseParams).forEach(([key, value]) => {
            if (value) params.set(key, String(value));
        });

        if (customTitle) {
            // @ts-ignore
            params.set("custom_title", customTitle);
        }
        if (customImdbId) {
            // @ts-ignore
            params.set("custom_imdb_id", customImdbId);
        }

        // Add ranking overrides
        const rankingOverrides = getRankingOverrides();

        if (Object.keys(rankingOverrides).length > 0) {
            params.set("ranking_overrides", JSON.stringify(rankingOverrides));
        }

        // Create EventSource for streaming - use dedicated SSE proxy endpoint
        const url = `/api/scrape_stream?${params.toString()}`;

        try {
            const eventSource = new EventSource(url);
            eventSourceRef = eventSource;

            // Immediately move to step 2 to show streaming results
            step = 2;
            streams = [];
            streamingProgress = {
                isStreaming: true,
                currentService: null,
                totalStreams: 0,
                servicesCompleted: 0,
                totalServices: 0,
                message: "Starting scrape..."
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.event === "start") {
                        streamingProgress = {
                            ...streamingProgress,
                            totalServices: data.total_services,
                            message: data.message || "Starting scrape..."
                        };
                    } else if (data.event === "streams" || data.event === "progress") {
                        streamingProgress = {
                            ...streamingProgress,
                            isStreaming: true,
                            currentService: data.service,
                            totalStreams: data.total_streams,
                            servicesCompleted: data.services_completed,
                            totalServices: data.total_services,
                            message: data.message
                        };

                        // Update streams if present
                        if (data.streams) {
                            const streamArray = Object.entries(data.streams).map(
                                ([magnet, stream]) => ({
                                    magnet,
                                    stream: stream as Stream
                                })
                            );

                            streams = streamArray.sort(
                                (a, b) => (b.stream as Stream).rank - (a.stream as Stream).rank
                            );
                        }
                    } else if (data.event === "complete") {
                        streamingProgress = {
                            ...streamingProgress,
                            isStreaming: false,
                            currentService: null,
                            totalStreams: data.total_streams,
                            servicesCompleted: data.services_completed,
                            message: data.message
                        };

                        // Final update of streams
                        if (data.streams) {
                            const streamArray = Object.entries(data.streams).map(
                                ([magnet, stream]) => ({
                                    magnet,
                                    stream: stream as Stream
                                })
                            );

                            streams = streamArray.sort(
                                (a, b) => (b.stream as Stream).rank - (a.stream as Stream).rank
                            );
                        }

                        eventSource.close();
                        eventSourceRef = null;
                        loading = false;
                        toast.success(`Found ${data.total_streams} streams`);
                    } else if (data.event === "error") {
                        logger.error("Streaming scrape error:", data.message);
                        // Don't stop streaming, just log the error - partial results may still be useful
                        streamingProgress = {
                            ...streamingProgress,
                            message: data.message
                        };
                    }
                } catch (e) {
                    logger.error("Failed to parse SSE event:", e);
                }
            };

            eventSource.onerror = (err) => {
                logger.error("EventSource error:", err);
                eventSource.close();
                eventSourceRef = null;

                streamingProgress = {
                    ...streamingProgress,
                    isStreaming: false,
                    message: "Connection lost"
                };

                loading = false;

                // If we got no streams, show error
                if (streams.length === 0) {
                    error = "Failed to connect to scraping service";
                    toast.error(error);
                    step = 1;
                } else {
                    // We have partial results, that's okay
                    toast.warning(`Scraping interrupted. Found ${streams.length} streams.`);
                }
            };
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "An error occurred";
            error = errorMsg;
            toast.error(errorMsg);
            loading = false;
        }
    }

    async function handleSelectStream(infohash: string) {
        isManualMagnet = false;
        await startScrapeSession(`magnet:?xt=urn:btih:${infohash}`);
    }

    async function handleSelectAllFiles() {
        if (!sessionData?.parsed_files || sessionData.parsed_files.length === 0) {
            error = "No files available to select";
            toast.error(error);
            return;
        }

        loading = true;
        error = null;

        try {
            const files = sessionData.parsed_files || [];

            // Fix season/episode indexing
            selectedFilesMappings = files.map((file: any, idx: number) => {
                const pm = file.parsed_metadata;
                return {
                    file_id: file.file_id?.toString() || idx.toString(),
                    filename: file.filename || "",
                    filesize: file.filesize || 0,
                    season: pm?.seasons?.[0],
                    episode: pm?.episodes?.[0],
                    download_url: file.download_url ?? undefined
                };
            });

            step = 3;
            toast.success("Files selected!");
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "An error occurred";
            error = errorMsg;
            toast.error(errorMsg);
        } finally {
            loading = false;
        }
    }

    async function handleBatchComplete() {
        if (batchSessions.length === 0) return;

        loading = true;
        error = null;
        batchProgress = {
            current: 0,
            total: batchSessions.length,
            message: "Processing sessions..."
        };

        try {
            for (let i = 0; i < batchSessions.length; i++) {
                const session = batchSessions[i];
                batchProgress = {
                    current: i + 1,
                    total: batchSessions.length,
                    message: `Processing ${i + 1}/${batchSessions.length}`
                };

                try {
                    // Step 1: Select files (Stateless Download logic)
                    const container: Container = {};
                    session.mappings.forEach((mapping) => {
                        const fId = parseFileId(mapping.file_id);
                        container[fId] = {
                            file_id: fId,
                            filename: mapping.filename,
                            filesize: mapping.filesize
                        };
                    });

                    // Use unified session endpoint with select_files and update_attributes actions
                    await providers.riven.POST("/api/v1/scrape/session/{session_id}", {
                        params: {
                            path: { session_id: session.sessionId }
                        },
                        body: {
                            action: "select_files",
                            files: container
                        }
                    });

                    // Complete the session
                    await providers.riven.POST("/api/v1/scrape/session/{session_id}", {
                        params: {
                            path: { session_id: session.sessionId }
                        },
                        body: {
                            action: "complete"
                        }
                    });

                    // Update session status
                    session.status = "completed";
                } catch (e) {
                    logger.error(`Failed to process session ${session.sessionId}`, e);
                    session.status = "error";
                    session.error = e instanceof Error ? e.message : "Unknown error";
                }
            }

            toast.success("Batch processing finished!");
            open = false;
            resetFlow();
            await invalidateAll();
        } catch (e) {
            logger.error("Batch completion failed", e);
            toast.error("Batch completion failed");
        } finally {
            loading = false;
            batchProgress = null;
        }
    }

    function getResolutionColor(resolution?: string): string {
        if (!resolution) return "bg-primary text-primary-foreground";
        if (resolution.includes("2160")) return "bg-chart-5 text-primary-foreground";
        if (resolution.includes("1440")) return "bg-chart-4 text-primary-foreground";
        if (resolution.includes("1080")) return "bg-chart-2 text-primary-foreground";
        if (resolution.includes("720")) return "bg-chart-3 text-primary-foreground";
        return "bg-primary text-primary-foreground";
    }

    function formatFileSize(bytes: number): string {
        if (bytes >= 1073741824) {
            return (bytes / 1073741824).toFixed(2) + " GB";
        } else if (bytes >= 1048576) {
            return (bytes / 1048576).toFixed(2) + " MB";
        }
        return bytes + " B";
    }

    function canProceedToComplete(): boolean {
        if (mediaType === "movie") {
            return selectedFilesMappings.length > 0;
        }
        // For TV shows, ensure all files have season and episode numbers
        return selectedFilesMappings.every(
            (mapping) => mapping.season !== undefined && mapping.episode !== undefined
        );
    }

    $effect(() => {
        // If dialog is open, fetch settings.
        if (open) {
            fetchSettings();
        }

        if (!open) {
            untrack(() => {
                resetFlow();
            });
        }
    });
</script>

<Dialog.Root bind:open>
    <Dialog.Trigger>
        {#snippet child({ props })}
            <Button {variant} {size} {...restProps} {...props}>
                <Search class="mr-1 h-4 w-4" />
                Manual Scrape
            </Button>
        {/snippet}
    </Dialog.Trigger>
    <Dialog.Content
        class="flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden lg:max-w-7xl">
        <Dialog.Header class="relative flex-shrink-0">
            <div class="flex items-center justify-between">
                <Dialog.Title class="text-lg font-semibold">
                    {#if step === 5}
                        Auto Scrape
                    {:else if step === 1}
                        Manual Scrape
                    {:else if step === 2}
                        Select Stream
                    {:else if step === 3}
                        {mediaType === "movie" ? "Confirm" : "Map Files"}
                    {:else if step === 4}
                        Auto Scrape
                    {:else if step === 6}
                        Batch Confirm
                    {/if}
                </Dialog.Title>
                <!-- Step Indicator -->
                <div class="flex items-center gap-2">
                    {#each [1, 2, 3] as s}
                        <div class="flex items-center gap-1.5">
                            <div
                                class={`h-2 w-2 rounded-full transition-colors ${step === s || (step === 4 && s === 1) || (step === 6 && s === 3) ? "bg-primary" : step > s ? "bg-primary/50" : "bg-muted"}`}>
                            </div>
                            {#if s < 3}
                                <div
                                    class={`h-px w-4 transition-colors ${step > s ? "bg-primary/50" : "bg-muted"}`}>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
            <Dialog.Description class="text-muted-foreground text-sm">
                {#if step === 5}
                    Select resolutions to include
                {:else if step === 1}
                    Choose how to find streams for "{title}"
                {:else if step === 2}
                    {filteredStreams.length} streams found
                {:else if step === 3}
                    {mediaType === "movie"
                        ? "Confirm your file selection"
                        : `${selectedFilesMappings.length} files to map`}
                {:else if step === 4}
                    Configure quality constraints
                {:else if step === 6}
                    {batchSessions.length} items ready
                {/if}
            </Dialog.Description>
        </Dialog.Header>

        {#if error}
            <Alert.Root variant="destructive" class="mb-4 flex-shrink-0">
                <AlertCircle class="h-4 w-4" />
                <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
        {/if}

        <div class="-mx-6 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-4">
            {#if step === 1}
                <Tabs.Root bind:value={tabValue} class="flex h-full flex-col">
                    <Tabs.List class="mb-4 grid w-full grid-cols-2">
                        <Tabs.Trigger value="search">Search</Tabs.Trigger>
                        <Tabs.Trigger value="auto">Auto Scrape</Tabs.Trigger>
                    </Tabs.List>

                    <div class="min-h-0 flex-1 overflow-y-auto">
                        <Tabs.Content value="search" class="h-full">
                            <div class="flex flex-col gap-4">
                                <!-- Magnet Link Input -->
                                <div class="flex flex-col gap-1.5">
                                    <Label for="magnet" class="text-muted-foreground text-xs"
                                        >Magnet Link (optional)</Label>
                                    <div class="relative">
                                        <Magnet
                                            class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                        <Input
                                            id="magnet"
                                            type="text"
                                            class="h-9 pl-9"
                                            placeholder="Paste magnet or leave empty to search"
                                            bind:value={magnetLink}
                                            onkeydown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleFetchStreams();
                                                }
                                            }}
                                            disabled={loading} />
                                    </div>
                                </div>

                                <Accordion.Root type="single" class="w-full">
                                    <Accordion.Item value="custom-params">
                                        <Accordion.Trigger class="py-2 text-sm hover:no-underline">
                                            Advanced Options
                                        </Accordion.Trigger>
                                        <Accordion.Content>
                                            <div class="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
                                                <div class="flex flex-col gap-1.5">
                                                    <Label for="custom-title" class="text-xs"
                                                        >Custom Title</Label>
                                                    <Input
                                                        id="custom-title"
                                                        placeholder="e.g. French Title"
                                                        bind:value={customTitle}
                                                        class="h-8 text-sm" />
                                                </div>
                                                <div class="flex flex-col gap-1.5">
                                                    <Label for="custom-imdb" class="text-xs"
                                                        >Custom IMDB ID</Label>
                                                    <Input
                                                        id="custom-imdb"
                                                        placeholder="tt1234567"
                                                        bind:value={customImdbId}
                                                        class="h-8 text-sm" />
                                                </div>
                                                <div class="flex flex-col gap-1.5">
                                                    <Label for="min-filesize" class="text-xs"
                                                        >Min Filesize (MB)</Label>
                                                    <Input
                                                        id="min-filesize"
                                                        type="number"
                                                        placeholder="e.g. 1000"
                                                        bind:value={minFilesizeOverride}
                                                        class="h-8 text-sm" />
                                                </div>
                                                <div class="flex flex-col gap-1.5">
                                                    <Label for="max-filesize" class="text-xs"
                                                        >Max Filesize (MB)</Label>
                                                    <Input
                                                        id="max-filesize"
                                                        type="number"
                                                        placeholder="e.g. 5000"
                                                        bind:value={maxFilesizeOverride}
                                                        class="h-8 text-sm" />
                                                </div>
                                            </div>
                                        </Accordion.Content>
                                    </Accordion.Item>
                                </Accordion.Root>

                                <Button
                                    onclick={handleFetchStreams}
                                    disabled={loading}
                                    variant="secondary"
                                    class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary w-full border bg-transparent">
                                    {#if loading}
                                        <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                                        {magnetLink ? "Processing..." : "Searching..."}
                                    {:else}
                                        <Search class="mr-2 h-4 w-4" />
                                        {magnetLink ? "Use Magnet" : "Search Streams"}
                                    {/if}
                                </Button>
                            </div>
                        </Tabs.Content>

                        <Tabs.Content value="auto" class="h-full overflow-y-auto">
                            <div class="flex h-full flex-col gap-4">
                                {#if mediaType === "tv" && seasons.length > 0}
                                    <div class="flex items-center justify-between">
                                        <Popover.Root>
                                            <Popover.Trigger>
                                                {#snippet child({ props })}
                                                    <Button
                                                        variant="outline"
                                                        class="h-9 justify-between gap-3 px-3 font-normal"
                                                        {...props}>
                                                        <span class="font-medium"
                                                            >Select Seasons</span>
                                                        <span
                                                            class="text-muted-foreground flex items-center gap-1 text-xs">
                                                            {selectedSeasons.size}
                                                            <ChevronDown
                                                                class="h-3.5 w-3.5 opacity-50" />
                                                        </span>
                                                    </Button>
                                                {/snippet}
                                            </Popover.Trigger>
                                            <Popover.Content class="w-56 p-3" align="start">
                                                <div class="space-y-4">
                                                    <div class="flex items-center justify-between">
                                                        <h4 class="leading-none font-medium">
                                                            Seasons
                                                        </h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            class="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
                                                            onclick={() =>
                                                                (selectedSeasons = new Set())}>
                                                            Deselect All
                                                        </Button>
                                                    </div>
                                                    <SeasonSelector
                                                        {seasons}
                                                        {open}
                                                        bind:selectedSeasons
                                                        class="max-h-[40vh]" />
                                                </div>
                                            </Popover.Content>
                                        </Popover.Root>

                                        {#if selectedSeasons.size > 0}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                class="text-muted-foreground hover:text-destructive h-8 px-2 text-xs"
                                                onclick={() => (selectedSeasons = new Set())}>
                                                Deselect All
                                            </Button>
                                        {/if}
                                    </div>
                                {/if}

                                <!-- Quality Filters (collapsible) -->
                                <Accordion.Root type="single" value="quality" class="w-full">
                                    <Accordion.Item
                                        value="quality"
                                        class="border-border rounded-md border">
                                        <Accordion.Trigger class="px-3 py-2 hover:no-underline">
                                            <span class="text-sm font-medium">Quality Filters</span>
                                        </Accordion.Trigger>
                                        <Accordion.Content>
                                            <div class="px-3 pb-3">
                                                {#if settingsLoading}
                                                    <div class="space-y-2">
                                                        <Skeleton class="h-8 w-full" />
                                                        <Skeleton class="h-8 w-full" />
                                                    </div>
                                                {:else}
                                                    <div class="flex flex-col gap-4 pt-2">
                                                        {#each Object.entries(rankingOptions) as [category, options] (category)}
                                                            {@const isExpanded =
                                                                expandedCategories.has(category)}
                                                            <div class="flex flex-col gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    class="text-muted-foreground hover:text-foreground flex w-full items-center justify-between gap-2 px-0.5 transition-colors"
                                                                    onclick={() => {
                                                                        const newSet = new Set(
                                                                            expandedCategories
                                                                        );
                                                                        if (newSet.has(category)) {
                                                                            newSet.delete(category);
                                                                        } else {
                                                                            newSet.add(category);
                                                                        }
                                                                        expandedCategories = newSet;
                                                                    }}>
                                                                    <div
                                                                        class="flex items-center gap-2">
                                                                        {#if categoryIcons[category]}
                                                                            {@const Icon =
                                                                                categoryIcons[
                                                                                    category
                                                                                ]}
                                                                            <Icon
                                                                                class="h-3.5 w-3.5 shrink-0" />
                                                                        {/if}
                                                                        <span
                                                                            class="text-sm font-semibold capitalize">
                                                                            {category === "trash"
                                                                                ? "Bin"
                                                                                : category === "hdr"
                                                                                  ? "HDR"
                                                                                  : category}
                                                                        </span>
                                                                    </div>
                                                                    <ChevronDown
                                                                        class="h-3.5 w-3.5 shrink-0 transition-transform duration-200 {isExpanded
                                                                            ? 'rotate-180'
                                                                            : ''}" />
                                                                </button>

                                                                {#if isExpanded}
                                                                    <div
                                                                        class="flex flex-wrap gap-1.5">
                                                                        {#each options as option (option)}
                                                                            {@const isSelected =
                                                                                selectedOptions[
                                                                                    category
                                                                                ]?.includes(option)}
                                                                            <button
                                                                                class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {isSelected
                                                                                    ? 'border-primary/50 bg-primary/10 text-primary'
                                                                                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'}"
                                                                                onclick={() => {
                                                                                    if (
                                                                                        isSelected
                                                                                    ) {
                                                                                        selectedOptions[
                                                                                            category
                                                                                        ] = (
                                                                                            selectedOptions[
                                                                                                category
                                                                                            ] || []
                                                                                        ).filter(
                                                                                            (r) =>
                                                                                                r !==
                                                                                                option
                                                                                        );
                                                                                    } else {
                                                                                        selectedOptions[
                                                                                            category
                                                                                        ] = [
                                                                                            ...(selectedOptions[
                                                                                                category
                                                                                            ] ||
                                                                                                []),
                                                                                            option
                                                                                        ];
                                                                                    }
                                                                                }}>
                                                                                {category ===
                                                                                "resolutions"
                                                                                    ? option.replace(
                                                                                          /^r/,
                                                                                          ""
                                                                                      )
                                                                                    : option.replace(
                                                                                          /_/g,
                                                                                          " "
                                                                                      )}
                                                                            </button>
                                                                        {/each}
                                                                    </div>
                                                                {/if}
                                                            </div>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        </Accordion.Content>
                                    </Accordion.Item>
                                </Accordion.Root>
                                <!-- Advanced Options -->
                                <Accordion.Root type="single" class="w-full">
                                    <Accordion.Item value="advanced">
                                        <Accordion.Trigger class="py-2 text-sm hover:no-underline">
                                            Advanced Options
                                        </Accordion.Trigger>
                                        <Accordion.Content>
                                            <div class="flex flex-col gap-3 pt-2">
                                                <div class="grid grid-cols-2 gap-3">
                                                    <div class="flex flex-col gap-1.5">
                                                        <Label class="text-xs">Require terms</Label>
                                                        <Input
                                                            placeholder="e.g. 4K, HDR"
                                                            value={selectedOptions.require?.join(
                                                                ", "
                                                            ) || ""}
                                                            oninput={(e) => {
                                                                const val = e.currentTarget.value;
                                                                selectedOptions.require = val
                                                                    ? val
                                                                          .split(",")
                                                                          .map((s) => s.trim())
                                                                          .filter(Boolean)
                                                                    : [];
                                                            }}
                                                            class="h-8 text-sm" />
                                                    </div>
                                                    <div class="flex flex-col gap-1.5">
                                                        <Label class="text-xs">Exclude terms</Label>
                                                        <Input
                                                            placeholder="e.g. CAM, TS"
                                                            value={selectedOptions.exclude?.join(
                                                                ", "
                                                            ) || ""}
                                                            oninput={(e) => {
                                                                const val = e.currentTarget.value;
                                                                selectedOptions.exclude = val
                                                                    ? val
                                                                          .split(",")
                                                                          .map((s) => s.trim())
                                                                          .filter(Boolean)
                                                                    : [];
                                                            }}
                                                            class="h-8 text-sm" />
                                                    </div>
                                                </div>
                                                <div
                                                    class="bg-muted/50 flex flex-col gap-2 rounded-md p-2">
                                                    <div class="flex gap-2">
                                                        <div class="flex flex-1 flex-col gap-1.5">
                                                            <Label
                                                                for="min-filesize-auto"
                                                                class="text-xs"
                                                                >Min Filesize (MB)</Label>
                                                            <Input
                                                                id="min-filesize-auto"
                                                                type="number"
                                                                placeholder="e.g. 1000"
                                                                class="h-8 text-xs"
                                                                bind:value={minFilesizeOverride} />
                                                        </div>
                                                        <div class="flex flex-1 flex-col gap-1.5">
                                                            <Label
                                                                for="max-filesize-auto"
                                                                class="text-xs"
                                                                >Max Filesize (MB)</Label>
                                                            <Input
                                                                id="max-filesize-auto"
                                                                type="number"
                                                                placeholder="e.g. 5000"
                                                                class="h-8 text-xs"
                                                                bind:value={maxFilesizeOverride} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div></Accordion.Content>
                                    </Accordion.Item>
                                </Accordion.Root>

                                <Button
                                    onclick={handleAutoScrape}
                                    disabled={loading || !canStartAutoScrape}
                                    variant="secondary"
                                    class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary w-full border bg-transparent">
                                    {#if loading}
                                        <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                                        Starting...
                                    {:else}
                                        <Zap class="mr-2 h-4 w-4" />
                                        Start Auto Scrape
                                    {/if}
                                </Button>
                            </div>
                        </Tabs.Content>
                    </div>
                </Tabs.Root>
            {:else if step === 2}
                <div class="flex h-full flex-col gap-3">
                    {#if step > 1}
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onclick={() => (step = 1)}
                                    class="border-border text-muted-foreground hover:bg-muted hover:text-foreground w-fit border bg-transparent">
                                    <ChevronLeft class="mr-1 h-4 w-4" />
                                    Back
                                </Button>

                                {#if selectedMagnets.size > 0}
                                    <Button
                                        size="sm"
                                        onclick={handleBatchScrape}
                                        disabled={loading || preparingBatch}>
                                        {#if preparingBatch}
                                            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                                            {batchProgress ? batchProgress.message : "Preparing..."}
                                        {:else}
                                            <Download class="mr-2 h-4 w-4" />
                                            Scrape Selected ({selectedMagnets.size})
                                        {/if}
                                    </Button>
                                {/if}
                            </div>

                            <div class="relative">
                                <Search
                                    class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search torrents..."
                                    class="pl-9"
                                    bind:value={searchQuery} />
                            </div>
                        </div>
                    {/if}

                    {#if streamingProgress.isStreaming}
                        <div class="bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
                            {#if streamingProgress.isStreaming}
                                <LoaderCircle class="text-primary h-4 w-4 animate-spin" />
                            {:else}
                                <div class="bg-chart-1 h-4 w-4 rounded-full"></div>
                            {/if}
                            <div class="flex flex-1 flex-col gap-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium">
                                        {streamingProgress.isStreaming ? "Scraping..." : "Complete"}
                                    </span>
                                    <span class="text-muted-foreground text-xs">
                                        {streamingProgress.servicesCompleted}/{streamingProgress.totalServices}
                                        sources
                                    </span>
                                </div>
                                <div class="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                                    <div
                                        class="bg-primary h-full transition-all duration-300"
                                        style="width: {streamingProgress.totalServices > 0
                                            ? (streamingProgress.servicesCompleted /
                                                  streamingProgress.totalServices) *
                                              100
                                            : 0}%">
                                    </div>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-muted-foreground text-xs">
                                        {streamingProgress.message || ""}
                                    </span>
                                    <Badge variant="secondary" class="text-xs">
                                        {streamingProgress.totalStreams} streams found
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    {/if}

                    {#if streams.length === 0}
                        <div class="flex flex-col items-center justify-center p-8 text-center">
                            {#if streamingProgress.isStreaming}
                                <LoaderCircle
                                    class="text-muted-foreground mb-2 h-8 w-8 animate-spin" />
                                <p class="text-muted-foreground mb-2">Searching for streams...</p>
                                <p class="text-muted-foreground text-xs">
                                    {streamingProgress.message || ""}
                                </p>
                            {:else}
                                <div class="flex flex-col items-center justify-center py-4">
                                    <Ghost class="text-muted-foreground/30 mb-3 h-12 w-12" />
                                    <h3 class="text-sm font-medium">No streams found</h3>
                                    <p class="text-muted-foreground mt-1 text-xs">
                                        Try adjusting your search terms or filters.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onclick={() => (step = 1)}
                                        class="mt-4">
                                        Back to Options
                                    </Button>
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <Tabs.Root
                            value={activeTab}
                            onValueChange={(v) => (activeTab = v)}
                            class="flex min-h-0 w-full flex-1 flex-col">
                            {#if mediaType === "tv"}
                                <Tabs.List class="mb-4 grid w-full shrink-0 grid-cols-4">
                                    <Tabs.Trigger value="all" class="gap-1.5">
                                        All
                                        <Badge variant="secondary" class="h-4 px-1.5 text-[10px]"
                                            >{streamCounts.all}</Badge>
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="show_packs" class="gap-1.5">
                                        Shows
                                        {#if streamCounts.show_packs > 0}
                                            <Badge
                                                variant="secondary"
                                                class="h-4 px-1.5 text-[10px]"
                                                >{streamCounts.show_packs}</Badge>
                                        {/if}
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="season_packs" class="gap-1.5">
                                        Seasons
                                        {#if streamCounts.season_packs > 0}
                                            <Badge
                                                variant="secondary"
                                                class="h-4 px-1.5 text-[10px]"
                                                >{streamCounts.season_packs}</Badge>
                                        {/if}
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="episodes" class="gap-1.5">
                                        Episodes
                                        {#if streamCounts.episodes > 0}
                                            <Badge
                                                variant="secondary"
                                                class="h-4 px-1.5 text-[10px]"
                                                >{streamCounts.episodes}</Badge>
                                        {/if}
                                    </Tabs.Trigger>
                                </Tabs.List>
                            {/if}

                            <div class="min-h-0 flex-1 overflow-y-auto">
                                {#if filteredStreams.length === 0}
                                    <div
                                        class="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                                        <Inbox class="text-muted-foreground/30 mb-3 h-10 w-10" />
                                        <p class="text-sm">No streams in this category.</p>
                                    </div>
                                {:else}
                                    <div class="flex flex-col gap-3 lg:grid lg:grid-cols-2">
                                        {#each filteredStreams as { magnet, stream } (magnet)}
                                            <StreamItem
                                                {stream}
                                                {magnet}
                                                isSelected={selectedMagnets.has(magnet)}
                                                onSelect={toggleMagnetSelection}
                                                onScrape={handleSelectStream}
                                                showCheckbox={mediaType === "tv"} />
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </Tabs.Root>
                    {/if}
                </div>
            {:else if step === 3}
                <div class="flex flex-col gap-3">
                    {#if step > 1}
                        <Button
                            variant="secondary"
                            size="sm"
                            onclick={() => {
                                if (isManualMagnet) {
                                    step = 1;
                                } else {
                                    step = 2;
                                }
                            }}
                            class="border-border text-muted-foreground hover:bg-muted hover:text-foreground w-fit border bg-transparent">
                            <ChevronLeft class="mr-1 h-4 w-4" />
                            Back
                        </Button>
                    {/if}

                    <div class="mb-4 flex flex-col gap-3">
                        {#if selectedFilesMappings.length === 0}
                            <div
                                class="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                                <FileQuestion class="text-muted-foreground/30 mb-3 h-10 w-10" />
                                <p class="text-sm">No files selected.</p>
                            </div>
                        {/if}
                        {#each selectedFilesMappings as mapping, idx (mapping.file_id)}
                            <Card.Root>
                                <Card.Content class="flex flex-col gap-3 px-4">
                                    <div class="flex items-start gap-3">
                                        <FileIcon
                                            class="text-muted-foreground mt-1 h-5 w-5 shrink-0" />
                                        <div class="min-w-0 flex-1">
                                            <p class="text-sm font-medium break-words">
                                                {mapping.filename}
                                            </p>
                                            <p class="text-muted-foreground text-xs">
                                                {formatFileSize(mapping.filesize)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            class="h-6 w-6 shrink-0"
                                            onclick={() => {
                                                selectedFilesMappings =
                                                    selectedFilesMappings.filter(
                                                        (_, i) => i !== idx
                                                    );
                                            }}>
                                            <X
                                                class="text-muted-foreground hover:text-foreground h-4 w-4" />
                                        </Button>
                                    </div>

                                    {#if mediaType === "tv"}
                                        <div class="flex gap-2">
                                            <div class="flex-1">
                                                <Label for={`season-${idx}`} class="text-xs"
                                                    >Season</Label>
                                                <Input
                                                    id={`season-${idx}`}
                                                    type="number"
                                                    min="0"
                                                    bind:value={mapping.season}
                                                    placeholder="Season"
                                                    class="mt-1" />
                                            </div>
                                            <div class="flex-1">
                                                <Label for={`episode-${idx}`} class="text-xs"
                                                    >Episode</Label>
                                                <Input
                                                    id={`episode-${idx}`}
                                                    type="number"
                                                    min="0"
                                                    bind:value={mapping.episode}
                                                    placeholder="Episode"
                                                    class="mt-1" />
                                            </div>
                                        </div>
                                    {/if}
                                </Card.Content>
                            </Card.Root>
                        {/each}
                    </div>

                    <Button
                        onclick={handleComplete}
                        disabled={loading || !canProceedToComplete()}
                        variant="secondary"
                        class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary w-full border bg-transparent">
                        {#if loading}
                            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                            Completing...
                        {:else}
                            Confirm
                        {/if}
                    </Button>
                </div>
            {:else if step === 6}
                <div class="flex h-full flex-col gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={() => (step = 2)}
                        class="border-border text-muted-foreground hover:bg-muted hover:text-foreground w-fit border bg-transparent">
                        <ChevronLeft class="mr-1 h-4 w-4" />
                        Back to Streams
                    </Button>

                    {#if batchProgress}
                        <div class="bg-muted/50 flex items-center gap-2 rounded-md p-3 text-sm">
                            <LoaderCircle class="h-4 w-4 animate-spin" />
                            <span class="font-medium">Batch Mode:</span>
                            <span>{batchProgress.message}</span>
                        </div>
                    {/if}

                    <div class="min-h-0 flex-1 space-y-6 overflow-y-auto">
                        {#each batchSessions as session, sIdx (session.sessionId)}
                            <div class="space-y-2">
                                <h3
                                    class="bg-background sticky top-0 z-10 flex items-center gap-2 border-b py-2 text-sm font-medium">
                                    <span
                                        class="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs"
                                        >#{sIdx + 1}</span>
                                    <span class="truncate">{session.stream.raw_title}</span>
                                </h3>

                                <div class="space-y-2 pl-2">
                                    {#each session.mappings as mapping, mIdx (mapping.file_id)}
                                        <Card.Root>
                                            <Card.Content class="flex flex-col gap-3 px-4 py-3">
                                                <div class="flex items-start gap-3">
                                                    <FileIcon
                                                        class="text-muted-foreground mt-1 h-4 w-4 shrink-0" />
                                                    <div class="min-w-0 flex-1">
                                                        <p class="text-xs font-medium break-words">
                                                            {mapping.filename}
                                                        </p>
                                                        <p
                                                            class="text-muted-foreground text-[10px]">
                                                            {formatFileSize(mapping.filesize)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {#if mediaType === "tv"}
                                                    <div class="flex gap-2">
                                                        <div class="flex-1">
                                                            <Label
                                                                for={`s-${sIdx}-${mIdx}`}
                                                                class="text-[10px]">Season</Label>
                                                            <Input
                                                                id={`s-${sIdx}-${mIdx}`}
                                                                type="number"
                                                                min="0"
                                                                bind:value={mapping.season}
                                                                placeholder="S"
                                                                class="mt-1 h-7 text-xs" />
                                                        </div>
                                                        <div class="flex-1">
                                                            <Label
                                                                for={`e-${sIdx}-${mIdx}`}
                                                                class="text-[10px]">Episode</Label>
                                                            <Input
                                                                id={`e-${sIdx}-${mIdx}`}
                                                                type="number"
                                                                min="0"
                                                                bind:value={mapping.episode}
                                                                placeholder="E"
                                                                class="mt-1 h-7 text-xs" />
                                                        </div>
                                                    </div>
                                                {/if}
                                            </Card.Content>
                                        </Card.Root>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>

                    <Button
                        onclick={handleBatchComplete}
                        disabled={loading}
                        variant="secondary"
                        class="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary w-full border bg-transparent">
                        {#if loading}
                            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                            {batchProgress ? batchProgress.message : "Processing..."}
                        {:else}
                            Confirm All ({batchSessions.length} items)
                        {/if}
                    </Button>
                </div>
            {/if}
        </div>
    </Dialog.Content>
</Dialog.Root>
