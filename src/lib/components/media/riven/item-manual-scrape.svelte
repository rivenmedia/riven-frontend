<script lang="ts">
    import { untrack } from "svelte";
    import { invalidateAll } from "$app/navigation";
    import providers from "$lib/providers";
    import type { components } from "$lib/providers/riven";

    import type { RtnSettingsModel } from "$lib/api/types.gen";
    import { toast } from "svelte-sonner";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Accordion from "$lib/components/ui/accordion/index.js";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import { cn } from "$lib/utils";
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
    import Magnet from "@lucide/svelte/icons/magnet";
    import Download from "@lucide/svelte/icons/download";
    import StreamItem from "./stream-item.svelte";

    type Stream = components["schemas"]["Stream"];
    type StartSessionResponse = components["schemas"]["StartSessionResponse"];
    type DebridFile = components["schemas"]["DebridFile"];
    type Container = components["schemas"]["Container"];
    type ShowFileData = components["schemas"]["ShowFileData"];
    type ParsedData = components["schemas"]["ParsedData"];

    interface Props {
        title: string | null | undefined;
        itemId?: string | null;
        externalId: string;
        mediaType: "movie" | "tv";
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
    }

    let {
        title,
        itemId,
        externalId,
        mediaType,
        variant = "ghost",
        size = "sm",
        ...restProps
    }: Props = $props();

    interface FileMapping {
        file_id: string;
        filename: string;
        filesize: number;
        season?: number;
        episode?: number;
        download_url?: string | null;
    }

    interface ParsedTitleData {
        seasons?: number[];
        episodes?: number[];
        resolution?: string;
        quality?: string;
        hdr?: string[];
        codec?: string;
        audio?: string[];
        languages?: string[];
        complete?: boolean;
    }

    interface FileSelection {
        file_id: number;
        filename: string;
        filesize: number;
    }

    type UpdateBody = DebridFile | ShowFileData;

    interface BatchSession {
        sessionId: string;
        magnet: string;
        stream: Stream;
        sessionData: StartSessionResponse;
        mappings: FileMapping[];
        status: "pending" | "completed" | "error";
        error?: string;
    }

    let open = $state(false);
    let step = $state(1);
    let loading = $state(false);
    let settingsLoading = $state(false);
    let error = $state<string | null>(null);
    let magnetLink = $state("");
    let streams = $state<{ magnet: string; stream: Stream }[]>([]);
    let sessionId = $state<string | null>(null);
    let sessionData = $state<StartSessionResponse | null>(null);
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
    let disableFilesizeCheck = $state(false);
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

            for (let i = 0; i < magnets.length; i += CONCURRENCY) {
                const chunk = magnets.slice(i, i + CONCURRENCY);

                await Promise.all(
                    chunk.map(async (magnet, index) => {
                        const globalIndex = i + index;
                        batchProgress = {
                            current: globalIndex + 1,
                            total: magnets.length,
                            message: `Preparing ${globalIndex + 1}/${magnets.length}`
                        };

                        // Find stream info
                        const streamInfo = streams.find((s) => s.magnet === magnet);
                        if (streamInfo) {
                            await prepareBatchSession(magnet, streamInfo.stream);
                        }
                    })
                );
            }

            step = 6; // Batch Confirmation Step
        } catch (e) {
            console.error("Batch preparation failed", e);
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

            if (itemId)
                queryParams.item_id = parseInt(itemId as string); // Ensure int
            else if (externalId) {
                if (mediaType === "movie") queryParams.tmdb_id = externalId;
                if (mediaType === "tv") queryParams.tvdb_id = externalId;
            }

            if (disableFilesizeCheck) {
                // @ts-ignore
                queryParams.disable_filesize_check = true;
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
                const sData = data;
                let mappings: FileMapping[];

                if (
                    sData.containers &&
                    sData.containers.files &&
                    sData.containers.files.length > 0
                ) {
                    const files = sData.containers.files;
                    const filenames = files
                        .map((f) => f.filename)
                        .filter((f): f is string => f != null);

                    // Only call parseTorrentTitles if we have valid filenames
                    if (filenames.length > 0) {
                        const { data: parseData } = await providers.riven.POST(
                            "/api/v1/scrape/parse",
                            {
                                body: filenames
                            }
                        );

                        if (parseData) {
                            mappings = files.map((file, idx) => {
                                const parsedData = parseData.data[idx] as ParsedTitleData;
                                return {
                                    file_id: file.file_id?.toString() || "",
                                    filename: file.filename || "",
                                    filesize: file.filesize || 0,
                                    season: parsedData?.seasons?.[0],
                                    episode: parsedData?.episodes?.[0]
                                };
                            });
                            batchSessions.push({
                                sessionId: sData.session_id,
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
            console.error(`Failed to prepare session for ${magnet}`, e);
        }
    }

    function resetFlow() {
        step = 1;
        loading = false;
        error = null;
        magnetLink = "";
        streams = [];
        sessionId = null;
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
            console.error("Failed to fetch settings", e);
        } finally {
            settingsLoading = false;
        }
    }

    type AutoScrapeRequest = components["schemas"]["AutoScrapeRequest"];

    async function handleAutoScrape() {
        // itemId is optional now, as we can fallback to externalId

        loading = true;
        error = null;

        try {
            const body: AutoScrapeRequest = {
                media_type: mediaType
            };

            // Only include IDs if they have valid values
            if (itemId) {
                // @ts-ignore
                body.item_id = parseInt(itemId as string).toString();
            }

            if (externalId) {
                if (mediaType === "movie") {
                    body.tmdb_id = externalId;
                } else if (mediaType === "tv") {
                    body.tvdb_id = externalId;
                }
            }

            // Only include selected options if they have values
            Object.entries(selectedOptions).forEach(([key, value]) => {
                if (value.length > 0) {
                    // @ts-ignore
                    body[key] = value;
                }
            });

            const { data, error: err } = await providers.riven.POST("/api/v1/scrape/auto", {
                body: body
            });

            if (err) {
                // @ts-ignore
                throw new Error(err.message || err.detail || "Failed to start auto scrape");
            }

            if (data) {
                toast.success(data.message || "Auto scrape started successfully");
                open = false; // Close dialog on success
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "An error occurred";
            error = errorMsg;
            toast.error(errorMsg);
        } finally {
            loading = false;
        }
    }

    // Helper to start a session with a given magnet link
    async function startScrapeSession(magnet: string, forceDisableFilesizeCheck: boolean = false) {
        loading = true;
        error = null;

        try {
            const queryParams: any = {
                media_type: mediaType,
                magnet: magnet
            };

            if (forceDisableFilesizeCheck || disableFilesizeCheck) {
                // @ts-ignore
                queryParams.disable_filesize_check = true;
            }

            if (itemId) {
                queryParams.item_id = parseInt(itemId as string);
            } else {
                if (!externalId) {
                    throw new Error("No item ID or external ID available");
                }
                if (mediaType === "movie") {
                    queryParams.tmdb_id = externalId;
                }
                if (mediaType === "tv") {
                    queryParams.tvdb_id = externalId;
                }
            }

            const { data, error: err } = await providers.riven.POST(
                "/api/v1/scrape/start_session",
                {
                    params: { query: queryParams }
                }
            );

            if (data) {
                sessionId = data.session_id;
                sessionData = data;
                toast.success("Session started successfully!");
                await handleSelectAllFiles();
                if (step !== 3) {
                    // If parsing failed, we stay on the current step (1 or 2) and show error
                    // step = 3; // Removed fallback to step 3
                }
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
            await startScrapeSession(magnetLink, true);
            return;
        }

        // Build query parameters for SSE endpoint
        const params = new URLSearchParams();
        params.set("media_type", mediaType);

        if (itemId) {
            params.set("item_id", itemId);
        } else {
            if (!externalId) {
                error = "No item ID or external ID available";
                toast.error(error);
                loading = false;
                return;
            }
        }

        if (mediaType === "movie" && externalId) {
            params.set("tmdb_id", externalId);
        }
        if (mediaType === "tv" && externalId) {
            params.set("tvdb_id", externalId);
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
                        console.error("Streaming scrape error:", data.message);
                        // Don't stop streaming, just log the error - partial results may still be useful
                        streamingProgress = {
                            ...streamingProgress,
                            message: data.message
                        };
                    }
                } catch (e) {
                    console.error("Failed to parse SSE event:", e);
                }
            };

            eventSource.onerror = (err) => {
                console.error("EventSource error:", err);
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
        if (
            !sessionData?.containers ||
            !sessionData.containers.files ||
            sessionData.containers.files.length === 0
        ) {
            error = "No files available to select";
            toast.error(error);
            return;
        }

        loading = true;
        error = null;

        try {
            const files = sessionData.containers.files || [];
            // Parse filenames to extract season/episode info
            const filenames = files.map((f) => f.filename).filter((f): f is string => f != null);

            // Ensure we have valid filenames before calling the API
            if (filenames.length === 0) {
                error = "No valid filenames found";
                toast.error(error);
                loading = false;
                return;
            }

            const { data, error: err } = await providers.riven.POST("/api/v1/scrape/parse", {
                body: filenames
            });

            if (data) {
                selectedFilesMappings = files.map((file, idx) => {
                    const parsedData = data.data[idx] as ParsedTitleData;
                    return {
                        file_id: file.file_id?.toString() || idx.toString(),
                        filename: file.filename || "",
                        filesize: file.filesize || 0,
                        season: parsedData?.seasons?.[0],
                        episode: parsedData?.episodes?.[0],
                        download_url: file.download_url ?? undefined
                    };
                });
                step = 3;
                toast.success("Files selected!");
            } else {
                const errorMsg =
                    (err as any)?.detail || (err as any)?.message || "Failed to parse filenames";
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

    async function handleComplete() {
        if (!sessionId) return;

        loading = true;
        error = null;

        try {
            // Step 1: Select files
            const container: Container = {};
            selectedFilesMappings.forEach((mapping) => {
                // @ts-ignore
                container[mapping.file_id] = {
                    file_id: parseInt(mapping.file_id),
                    filename: mapping.filename,
                    filesize: mapping.filesize,
                    download_url: mapping.download_url ?? undefined
                };
            });

            const { data: selectData, error: selectErr } = await providers.riven.POST(
                "/api/v1/scrape/select_files/{session_id}",
                {
                    params: { path: { session_id: sessionId } },
                    body: container
                }
            );

            if (!selectData) {
                const errorMsg = (selectErr as any)?.message || "Failed to select files";
                error = errorMsg;
                toast.error(errorMsg);
                return;
            }

            // Step 2: Update attributes
            let updateBody: UpdateBody;

            if (mediaType === "movie") {
                // For movies, select the largest file
                const largestFile = selectedFilesMappings.reduce((prev, current) =>
                    current.filesize > prev.filesize ? current : prev
                );
                updateBody = {
                    file_id: parseInt(largestFile.file_id),
                    filename: largestFile.filename,
                    filesize: largestFile.filesize,
                    download_url: largestFile.download_url ?? undefined
                };
            } else {
                // For TV shows, map files to episodes
                updateBody = {};
                selectedFilesMappings.forEach((mapping) => {
                    if (mapping.season !== undefined && mapping.episode !== undefined) {
                        const seasonKey = mapping.season.toString();
                        const episodeKey = mapping.episode.toString();

                        if (!(updateBody as Record<string, any>)[seasonKey]) {
                            (updateBody as Record<string, any>)[seasonKey] = {};
                        }

                        (updateBody as Record<string, any>)[seasonKey][episodeKey] = {
                            file_id: parseInt(mapping.file_id),
                            filename: mapping.filename,
                            filesize: mapping.filesize
                        };
                    }
                });
            }

            const { data: updateData, error: updateErr } = await providers.riven.POST(
                "/api/v1/scrape/update_attributes/{session_id}",
                {
                    params: { path: { session_id: sessionId } },
                    body: updateBody
                }
            );

            if (!updateData) {
                console.error(updateErr);
                const errorMsg = (updateErr as any)?.message || "Failed to update attributes";
                error = errorMsg;
                toast.error(errorMsg);
                return;
            }

            // Step 3: Complete session
            const { data: completeData, error: completeErr } = await providers.riven.POST(
                "/api/v1/scrape/complete_session/{session_id}",
                {
                    params: { path: { session_id: sessionId } }
                }
            );

            if (completeData) {
                toast.success("Manual scrape completed successfully!");
                open = false;
                resetFlow();
                await invalidateAll();
            } else {
                const errorMsg = (completeErr as any)?.message || "Failed to complete session";
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
                    // Step 1: Select files
                    const container: Container = {};
                    session.mappings.forEach((mapping) => {
                        // @ts-ignore
                        container[mapping.file_id] = {
                            file_id: parseInt(mapping.file_id),
                            filename: mapping.filename,
                            filesize: mapping.filesize
                        };
                    });

                    await providers.riven.POST("/api/v1/scrape/select_files/{session_id}", {
                        params: { path: { session_id: session.sessionId } },
                        // @ts-ignore
                        body: container
                    });

                    // Step 2: Update attributes
                    let updateBody: UpdateBody;

                    if (mediaType === "movie") {
                        const largestFile = session.mappings.reduce((prev, current) =>
                            current.filesize > prev.filesize ? current : prev
                        );
                        updateBody = {
                            file_id: parseInt(largestFile.file_id),
                            filename: largestFile.filename,
                            filesize: largestFile.filesize
                        };
                    } else {
                        updateBody = {};
                        session.mappings.forEach((mapping) => {
                            if (mapping.season !== undefined && mapping.episode !== undefined) {
                                const seasonKey = mapping.season.toString();
                                const episodeKey = mapping.episode.toString();

                                if (!(updateBody as Record<string, any>)[seasonKey]) {
                                    (updateBody as Record<string, any>)[seasonKey] = {};
                                }

                                (updateBody as Record<string, any>)[seasonKey][episodeKey] = {
                                    file_id: parseInt(mapping.file_id),
                                    filename: mapping.filename,
                                    filesize: mapping.filesize
                                };
                            }
                        });
                    }

                    await providers.riven.POST("/api/v1/scrape/update_attributes/{session_id}", {
                        params: { path: { session_id: session.sessionId } },
                        body: updateBody
                    });

                    // Step 3: Complete
                    await providers.riven.POST("/api/v1/scrape/complete_session/{session_id}", {
                        params: { path: { session_id: session.sessionId } }
                    });

                    // Update session status
                    session.status = "completed";
                } catch (e) {
                    console.error(`Failed to process session ${session.sessionId}`, e);
                    session.status = "error";
                    session.error = e instanceof Error ? e.message : "Unknown error";
                }
            }

            toast.success("Batch processing finished!");
            open = false;
            resetFlow();
            await invalidateAll();
        } catch (e) {
            console.error("Batch completion failed", e);
            toast.error("Batch completion failed");
        } finally {
            loading = false;
            batchProgress = null;
        }
    }

    function getResolutionColor(resolution?: string): string {
        if (!resolution) return "bg-pink-600";
        if (resolution.includes("2160")) return "bg-purple-600";
        if (resolution.includes("1440")) return "bg-indigo-600";
        if (resolution.includes("1080")) return "bg-blue-600";
        if (resolution.includes("720")) return "bg-yellow-600";
        return "bg-pink-600";
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
                // Cleanup: abort session if not completed
                if (sessionId) {
                    providers.riven
                        .POST("/api/v1/scrape/abort_session/{session_id}", {
                            params: { path: { session_id: sessionId } }
                        })
                        .catch(() => {
                            // Silently ignore cleanup errors
                        });
                }
                // Cleanup batch sessions
                batchSessions.forEach((s) => {
                    if (s.status === "pending") {
                        providers.riven
                            .POST("/api/v1/scrape/abort_session/{session_id}", {
                                params: { path: { session_id: s.sessionId } }
                            })
                            .catch(() => {});
                    }
                });
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
        class={cn(
            "flex w-full max-w-4xl flex-col overflow-hidden lg:max-w-7xl",
            step === 2 ? "max-h-[75vh]" : "max-h-[90vh]"
        )}>
        <Dialog.Header class="flex-shrink-0">
            <Dialog.Title>
                {#if step === 5}
                    Auto Scrape - Select Resolutions
                {:else if step === 1}
                    Manual Scrape - Fetch Streams
                {:else if step === 2}
                    Manual Scrape - Select Stream
                {:else if step === 3}
                    Manual Scrape - {mediaType === "movie" ? "Confirm Selection" : "Map Files"}
                {:else if step === 4}
                    Manual Scrape - Auto Scrape Config
                {:else if step === 6}
                    Batch Scrape - Confirm All ({batchSessions.length} items)
                {/if}
            </Dialog.Title>
            <Dialog.Description>
                {#if step === 5}
                    Select resolutions to include in the auto scrape
                {:else if step === 1}
                    Fetch available streams for "{title}"
                {:else if step === 2}
                    Choose a stream to download
                {:else if step === 3}
                    {mediaType === "movie"
                        ? "Confirm your file selection"
                        : "Map files to seasons and episodes"}
                {:else if step === 4}
                    Configure constraints for auto scraping
                {:else if step === 6}
                    Review and confirm file mappings for all selected torrents
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
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <Label for="magnet">Magnet Link (Optional)</Label>
                        <div class="relative">
                            <Magnet
                                class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                            <Input
                                id="magnet"
                                type="text"
                                class="pl-9"
                                placeholder="magnet:?xt=urn:btih:..."
                                bind:value={magnetLink}
                                onkeydown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleFetchStreams();
                                    }
                                }}
                                disabled={loading} />
                        </div>
                        <p class="text-muted-foreground text-xs">
                            Leave empty to fetch streams automatically
                        </p>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <Button onclick={handleFetchStreams} disabled={loading} class="w-full">
                            {#if loading}
                                <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                                Fetching...
                            {:else}
                                <Download class="mr-2 h-4 w-4" />
                                Fetch Streams
                            {/if}
                        </Button>

                        <Button
                            variant="secondary"
                            onclick={() => (step = 4)}
                            disabled={loading}
                            class="w-full">
                            <Zap class="mr-2 h-4 w-4" />
                            Auto Scrape
                        </Button>
                    </div>
                </div>
            {:else if step === 2}
                <div class="flex h-full flex-col gap-3">
                    {#if step > 1}
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => (step = 1)}
                                    class="w-fit">
                                    <ChevronLeft class="mr-1 h-4 w-4" />
                                    Back
                                </Button>

                                <div class="flex items-center space-x-2">
                                    <Label for="disable-filesize-check" class="text-xs"
                                        >Disable bitrate Check</Label>
                                    <Switch
                                        id="disable-filesize-check"
                                        bind:checked={disableFilesizeCheck} />
                                </div>

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
                                <div class="h-4 w-4 rounded-full bg-green-500"></div>
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
                                <p class="text-muted-foreground mb-2">No streams found.</p>
                                <Button variant="outline" size="sm" onclick={() => (step = 1)}>
                                    Back to Options
                                </Button>
                            {/if}
                        </div>
                    {:else}
                        <Tabs.Root
                            value={activeTab}
                            onValueChange={(v) => (activeTab = v)}
                            class="flex min-h-0 w-full flex-1 flex-col">
                            {#if mediaType === "tv"}
                                <Tabs.List class="mb-4 grid w-full shrink-0 grid-cols-4">
                                    <Tabs.Trigger value="all">All</Tabs.Trigger>
                                    <Tabs.Trigger value="show_packs">Show Packs</Tabs.Trigger>
                                    <Tabs.Trigger value="season_packs">Season Packs</Tabs.Trigger>
                                    <Tabs.Trigger value="episodes">Episodes</Tabs.Trigger>
                                </Tabs.List>
                            {/if}

                            <div class="min-h-0 flex-1 overflow-y-auto">
                                {#if filteredStreams.length === 0}
                                    <div class="text-muted-foreground py-8 text-center">
                                        No streams found for this category.
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
            {:else if step === 4}
                <div class="flex flex-col gap-4">
                    <Button variant="ghost" size="sm" onclick={() => (step = 1)} class="w-fit">
                        <ChevronLeft class="mr-1 h-4 w-4" />
                        Back
                    </Button>

                    <div
                        class="flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-md border p-2 pr-2">
                        <div class="flex items-center justify-between">
                            <Label>Quality Constraints</Label>
                            <div class="flex items-center space-x-2">
                                <Label for="disable-filesize-check-auto" class="text-xs"
                                    >Disable bitrate Check</Label>
                                <Switch
                                    id="disable-filesize-check-auto"
                                    bind:checked={disableFilesizeCheck} />
                            </div>
                        </div>
                        <p class="text-muted-foreground mb-2 text-xs">
                            Configure constraints for the auto scrape process.
                        </p>

                        {#if settingsLoading}
                            <div class="space-y-2">
                                <Skeleton class="h-10 w-full" />
                                <Skeleton class="h-10 w-full" />
                                <Skeleton class="h-10 w-full" />
                                <Skeleton class="h-10 w-full" />
                                <Skeleton class="h-10 w-full" />
                                <Skeleton class="h-10 w-full" />
                                <Skeleton class="h-10 w-full" />
                            </div>
                        {:else}
                            <div class="mb-4 grid grid-cols-2 gap-4">
                                <div class="flex flex-col gap-2">
                                    <Label>Require</Label>
                                    <Input
                                        placeholder="e.g. 4K, HDR (comma separated)"
                                        value={selectedOptions.require?.join(", ") || ""}
                                        oninput={(e) => {
                                            const val = e.currentTarget.value;
                                            selectedOptions.require = val
                                                ? val
                                                      .split(",")
                                                      .map((s) => s.trim())
                                                      .filter(Boolean)
                                                : [];
                                        }} />
                                    <p class="text-muted-foreground text-[10px]">
                                        Must contain ANY of these terms
                                    </p>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label>Exclude</Label>
                                    <Input
                                        placeholder="e.g. CAM, TS (comma separated)"
                                        value={selectedOptions.exclude?.join(", ") || ""}
                                        oninput={(e) => {
                                            const val = e.currentTarget.value;
                                            selectedOptions.exclude = val
                                                ? val
                                                      .split(",")
                                                      .map((s) => s.trim())
                                                      .filter(Boolean)
                                                : [];
                                        }} />
                                    <p class="text-muted-foreground text-[10px]">
                                        Must NOT contain ANY of these terms
                                    </p>
                                </div>
                            </div>

                            <Accordion.Root type="multiple" class="w-full">
                                {#each Object.entries(rankingOptions) as [category, options] (category)}
                                    <Accordion.Item value={category}>
                                        <Accordion.Trigger
                                            class="py-2 text-sm capitalize hover:no-underline">
                                            <div class="flex items-center gap-2">
                                                {#if categoryIcons[category]}
                                                    {@const Icon = categoryIcons[category]}
                                                    <Icon class="h-4 w-4" />
                                                {/if}
                                                {category === "trash" ? "Bin" : category}
                                                {#if selectedOptions[category]?.length}
                                                    <Badge
                                                        variant="secondary"
                                                        class="h-5 px-1.5 text-[10px]">
                                                        {selectedOptions[category].length}
                                                    </Badge>
                                                {/if}
                                            </div>
                                        </Accordion.Trigger>
                                        <Accordion.Content>
                                            <div class="flex flex-wrap gap-2 pt-2">
                                                {#each options as option (option)}
                                                    {@const isSelected =
                                                        selectedOptions[category]?.includes(option)}
                                                    <Badge
                                                        variant={isSelected ? "default" : "outline"}
                                                        class="hover:bg-primary/90 cursor-pointer transition-colors"
                                                        onclick={() => {
                                                            if (isSelected) {
                                                                selectedOptions[category] = (
                                                                    selectedOptions[category] || []
                                                                ).filter((r) => r !== option);
                                                            } else {
                                                                selectedOptions[category] = [
                                                                    ...(selectedOptions[category] ||
                                                                        []),
                                                                    option
                                                                ];
                                                            }
                                                        }}>
                                                        {option.replace(/^r/, "")}
                                                    </Badge>
                                                {/each}
                                            </div>
                                        </Accordion.Content>
                                    </Accordion.Item>
                                {/each}
                            </Accordion.Root>
                        {/if}
                    </div>

                    <Button
                        onclick={handleAutoScrape}
                        disabled={loading || !canStartAutoScrape}
                        class="w-full">
                        {#if loading}
                            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                            Starting...
                        {:else}
                            <Zap class="mr-2 h-4 w-4" />
                            Start Auto Scrape
                        {/if}
                    </Button>
                </div>
            {:else if step === 3}
                <div class="flex flex-col gap-3">
                    {#if step > 1}
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => {
                                if (isManualMagnet) {
                                    step = 1;
                                } else {
                                    step = 2;
                                }
                            }}
                            class="w-fit">
                            <ChevronLeft class="mr-1 h-4 w-4" />
                            Back
                        </Button>
                    {/if}

                    <div class="mb-4 flex flex-col gap-3">
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
                        class="w-full">
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
                    <Button variant="ghost" size="sm" onclick={() => (step = 2)} class="w-fit">
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

                    <Button onclick={handleBatchComplete} disabled={loading} class="w-full">
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
