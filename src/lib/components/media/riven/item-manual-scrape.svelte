<script lang="ts">
	import {
		scrapeItem,
		startManualSession,
		manualSelect,
		manualUpdateAttributes,
		completeManualSession,
		abortManualSession,
		parseTorrentTitles,
        autoScrapeItem,
        getSettings,
		type Stream,
		type StartSessionResponse,
		type DebridFile,
		type Container
	} from "$lib/api";
    import { processBatchItem } from "$lib/utils/batch-scrape";
	import type {
        StartSessionResponse,
        Stream,
        RtnSettingsModel,
        Container
    } from "$lib/api/types.gen";
	import { toast } from "svelte-sonner";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
    import * as Accordion from "$lib/components/ui/accordion/index.js";
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
	}

	interface FileSelection {
		file_id: number;
		filename: string;
		filesize: number;
	}

	type UpdateBody = FileSelection | Record<string, Record<string, FileSelection>>;

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
    let canStartAutoScrape = $derived(
        Object.values(selectedOptions).some(arr => arr.length > 0)
    );

    let selectedMagnets = $state<Set<string>>(new Set());
    let activeTab = $state("all");
    let batchProgress = $state<{ current: number; total: number; message: string } | null>(null);
    let searchQuery = $state("");

    let filteredStreams = $derived.by(() => {
        let result = streams;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(({ stream }) => stream.raw_title.toLowerCase().includes(query));
        }

        if (activeTab === "all") return result;
        
        return result.filter(({ stream }) => {
            const seasons = stream.parsed_data.seasons || [];
            const episodes = stream.parsed_data.episodes || [];
            const isComplete = stream.parsed_data.complete === true;

            const isShowPack = seasons.length > 1;
            
            // Season Pack: Single season AND (marked complete OR no episodes listed OR many episodes listed)
            const isSeasonPack = seasons.length === 1 && (isComplete || episodes.length === 0 || episodes.length > 2);
            
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

        loading = true;
        error = null;
        batchProgress = { current: 0, total: selectedMagnets.size, message: "Starting batch scrape..." };

        try {
            let processed = 0;
            for (const magnet of selectedMagnets) {
                processed++;
                batchProgress = { current: processed, total: selectedMagnets.size, message: `Processing torrent ${processed}/${selectedMagnets.size}...` };

                await processBatchItem({
                    magnet,
                    mediaType,
                    itemId,
                    externalId,
                    streams
                });
            }

            toast.success(`Batch scrape completed for ${processed} torrents!`);
            open = false;
            resetFlow();

        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "Batch scrape failed";
            error = errorMsg;
            toast.error(errorMsg);
        } finally {
            loading = false;
            batchProgress = null;
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
	}

    async function fetchSettings() {
        settingsLoading = true;
        try {
            const response = await getSettings({
                path: { paths: "ranking" }
            });
            if (response.data) {
                const ranking = response.data.ranking;
                const newSelectedOptions = { ...selectedOptions };
                
                // Resolutions
                if (ranking.resolutions) {
                    rankingOptions.resolutions = Object.keys(ranking.resolutions).filter(k => k !== "unknown");
                    // Populate selected resolutions
                    newSelectedOptions.resolutions = Object.entries(ranking.resolutions)
                        .filter(([k, v]) => v === true && k !== "unknown")
                        .map(([k]) => k);
                }
                
                // Custom Ranks
                const categories = ["quality", "rips", "hdr", "audio", "extras", "trash"];
                categories.forEach(cat => {
                    if (ranking.custom_ranks && ranking.custom_ranks[cat]) {
                        const categoryObj = ranking.custom_ranks[cat];
                        rankingOptions[cat] = Object.keys(categoryObj);
                        
                        // Populate selected options for this category
                        newSelectedOptions[cat] = Object.entries(categoryObj)
                            .filter(([_, val]) => {
                                if (typeof val === 'object' && val !== null && 'fetch' in val) {
                                    return (val as any).fetch === true;
                                }
                                return val === true;
                            })
                            .map(([key]) => key);
                    }
                });
                
                selectedOptions = newSelectedOptions;
            }
        } catch (e) {
            console.error("Failed to fetch settings", e);
        } finally {
            settingsLoading = false;
        }
    }

    $effect(() => {
        if (open) {
            fetchSettings();
        }
    });

    async function handleAutoScrape() {
        // itemId is optional now, as we can fallback to externalId
        
        loading = true;
        error = null;

        try {
            const body: any = {
                item_id: itemId || undefined,
                tmdb_id: externalId && mediaType === "movie" ? externalId : undefined,
                tvdb_id: externalId && mediaType === "tv" ? externalId : undefined,
                media_type: mediaType
            };

            // Only include selected options if they have values
            Object.entries(selectedOptions).forEach(([key, value]) => {
                if (value.length > 0) {
                    body[key] = value;
                }
            });

            const response = await autoScrapeItem({
                body
            });

            if (response.data) {
                toast.success(response.data.message);
                open = false;
                resetFlow();
            } else {
                const errorMsg = (response.error as any)?.message || "Failed to start auto scrape";
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

		try {
			// Construct query parameters, only including non-null values
			const queryParams: {
				item_id?: string;
				tmdb_id?: string;
				tvdb_id?: string;
				media_type: "movie" | "tv";
			} = {
				media_type: mediaType
			};

			// Always prioritize item_id if available
			if (itemId) {
				queryParams.item_id = itemId;
			} else {
				// If no itemId, we must have external IDs to proceed
				if (!externalId) {
					error = "No item ID or external ID available";
					toast.error(error);
					loading = false;
					return;
				}
			}
			
			if (mediaType === "movie" && externalId) {
				queryParams.tmdb_id = externalId;
			}
			if (mediaType === "tv" && externalId) {
				queryParams.tvdb_id = externalId;
			}

			const response = await scrapeItem({
				query: queryParams
			});

			if (response.data) {
				const streamArray = Object.entries(response.data.streams).map(([magnet, stream]) => ({
					magnet,
					stream
				}));

				streams = streamArray.sort((a, b) => b.stream.rank - a.stream.rank);
				step = 2;
				toast.success("Streams fetched successfully!");
			} else {
				const errorMsg = (response.error as any)?.message || "Failed to fetch streams";
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

	async function handleSelectStream(infohash: string) {
		loading = true;
		error = null;

		try {
			// Construct query parameters, only including non-null values
			const queryParams: {
				item_id?: string;
				tmdb_id?: string;
				tvdb_id?: string;
				media_type: "movie" | "tv";
				magnet: string;
			} = {
				media_type: mediaType,
				// Construct proper magnet URI from infohash
				magnet: `magnet:?xt=urn:btih:${infohash}`
			};

			// Always prioritize item_id if available
			if (itemId) {
				queryParams.item_id = itemId;
			} else {
				// If no itemId, we must have external IDs to proceed
				if (!externalId) {
					error = "No item ID or external ID available";
					toast.error(error);
					loading = false;
					return;
				}
			}
			
			if (mediaType === "movie" && externalId) {
				queryParams.tmdb_id = externalId;
			}
			if (mediaType === "tv" && externalId) {
				queryParams.tvdb_id = externalId;
			}

			const response = await startManualSession({
				query: queryParams
			});

			if (response.data) {
				sessionId = response.data.session_id;
				sessionData = response.data;
				step = 3;
				toast.success("Session started successfully!");
			} else {
				const errorMsg = (response.error as any)?.message || "Failed to start session";
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

	async function handleSelectAllFiles() {
		if (!sessionData?.containers?.files) return;

		loading = true;
		error = null;

		try {
			// Parse filenames to extract season/episode info
			const filenames = sessionData.containers.files
				.map((f) => f.filename)
				.filter((f): f is string => f != null);

			const parseResponse = await parseTorrentTitles({
				body: filenames
			});

			if (parseResponse.data) {
				selectedFilesMappings = sessionData.containers.files.map((file, idx) => {
					const parsedData = parseResponse.data.data[idx] as ParsedTitleData;
					return {
						file_id: file.file_id?.toString() || "",
						filename: file.filename || "",
						filesize: file.filesize || 0,
						season: parsedData?.seasons?.[0],
						episode: parsedData?.episodes?.[0]
					};
				});
				step = 4;
				toast.success("Files selected!");
			} else {
				const errorMsg = (parseResponse.error as any)?.message || "Failed to parse filenames";
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
				container[mapping.file_id] = {
					file_id: parseInt(mapping.file_id),
					filename: mapping.filename,
					filesize: mapping.filesize
				};
			});

			const selectResponse = await manualSelect({
				path: { session_id: sessionId },
				body: container
			});

			if (!selectResponse.data) {
				const errorMsg = (selectResponse.error as any)?.message || "Failed to select files";
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
					filesize: largestFile.filesize
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

			const updateResponse = await manualUpdateAttributes({
				path: { session_id: sessionId },
				body: updateBody
			});

			if (!updateResponse.data) {
				console.error(updateResponse.error);
				const errorMsg = (updateResponse.error as any)?.message || "Failed to update attributes";
				error = errorMsg;
				toast.error(errorMsg);
				return;
			}

			// Step 3: Complete session
			const completeResponse = await completeManualSession({
				path: { session_id: sessionId }
			});

			if (completeResponse.data) {
				toast.success("Manual scrape completed successfully!");
				open = false;
				resetFlow();
			} else {
				const errorMsg = (completeResponse.error as any)?.message || "Failed to complete session";
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
		if (!open) {
			// Cleanup: abort session if not completed
			if (sessionId && step < 4) {
				abortManualSession({ path: { session_id: sessionId } });
			}
			resetFlow();
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
	<Dialog.Content class="max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
		<Dialog.Header class="flex-shrink-0">
			<Dialog.Title>
				{#if step === 5}
                    Auto Scrape - Select Resolutions
                {:else if step === 1}
					Manual Scrape - Fetch Streams
				{:else if step === 2}
					Manual Scrape - Select Stream
				{:else if step === 3}
					Manual Scrape - Select Files
				{:else if step === 4}
					Manual Scrape - {mediaType === "movie" ? "Confirm Selection" : "Map Files"}
                {:else if step === 5}
                    Manual Scrape - Auto Scrape Config
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
					Select files from the torrent
				{:else if step === 4}
					{mediaType === "movie"
						? "Confirm your file selection"
						: "Map files to seasons and episodes"}
                {:else if step === 5}
                    Configure constraints for auto scraping
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if error}
			<Alert.Root variant="destructive" class="mb-4 flex-shrink-0">
				<AlertCircle class="h-4 w-4" />
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{/if}

		<div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0 -mx-6 px-6 py-4">
			{#if step === 1}
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label for="magnet">Magnet Link (Optional)</Label>
                        <div class="relative">
                            <Magnet class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="magnet"
                                type="text"
                                class="pl-9"
                                placeholder="magnet:?xt=urn:btih:..."
                                bind:value={magnetLink}
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

                        <Button variant="secondary" onclick={() => (step = 5)} disabled={loading} class="w-full">
                            <Zap class="mr-2 h-4 w-4" />
                            Auto Scrape
                        </Button>
                    </div>
				</div>
			{:else if step === 2}
                <div class="flex flex-col gap-3 h-full">
					{#if step > 1}
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between">
                                <Button variant="ghost" size="sm" onclick={() => (step = 1)} class="w-fit">
                                    <ChevronLeft class="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                                
                                {#if selectedMagnets.size > 0}
                                    <Button size="sm" onclick={handleBatchScrape} disabled={loading}>
                                        {#if loading}
                                            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                                            {batchProgress ? `Processing ${batchProgress.current}/${batchProgress.total}` : "Scraping..."}
                                        {:else}
                                            <Download class="mr-2 h-4 w-4" />
                                            Scrape Selected ({selectedMagnets.size})
                                        {/if}
                                    </Button>
                                {/if}
                            </div>
                            
                            <div class="relative">
                                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search torrents..."
                                    class="pl-9"
                                    bind:value={searchQuery}
                                />
                            </div>
                        </div>
					{/if}

                    {#if streams.length === 0}
                        <div class="flex flex-col items-center justify-center p-8 text-center">
                            <p class="text-muted-foreground mb-2">No streams found.</p>
                            <Button variant="outline" size="sm" onclick={() => (step = 1)}>
                                Back to Options
                            </Button>
                        </div>
                    {:else}
                        <Tabs.Root value={activeTab} onValueChange={(v) => activeTab = v} class="w-full flex-1 flex flex-col min-h-0">
                            {#if mediaType === "tv"}
                                <Tabs.List class="w-full grid grid-cols-4 mb-4 shrink-0">
                                    <Tabs.Trigger value="all">All</Tabs.Trigger>
                                    <Tabs.Trigger value="show_packs">Show Packs</Tabs.Trigger>
                                    <Tabs.Trigger value="season_packs">Season Packs</Tabs.Trigger>
                                    <Tabs.Trigger value="episodes">Episodes</Tabs.Trigger>
                                </Tabs.List>
                            {/if}
                            
                            <div class="flex-1 overflow-y-auto min-h-0 pr-2">
                                {#if filteredStreams.length === 0}
                                    <div class="text-center py-8 text-muted-foreground">
                                        No streams found for this category.
                                    </div>
                                {:else}
                                    <div class="flex flex-col gap-3">
                                        {#each filteredStreams as { magnet, stream } (magnet)}
                                            <StreamItem 
                                                {stream} 
                                                {magnet} 
                                                isSelected={selectedMagnets.has(magnet)}
                                                onSelect={toggleMagnetSelection}
                                                onScrape={handleSelectStream}
                                            />
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
						<Button variant="ghost" size="sm" onclick={() => (step = 2)} class="w-fit">
							<ChevronLeft class="mr-1 h-4 w-4" />
							Back
						</Button>
					{/if}

					{#if sessionData?.containers?.files}
						<div class="mb-4 flex flex-col gap-3">
							{#each sessionData.containers.files as file (file.file_id)}
								<Card.Root>
									<Card.Content class="flex items-start gap-3 px-4">
										<FileIcon class="text-muted-foreground mt-1 h-5 w-5 shrink-0" />
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium break-words">{file.filename}</p>
											{#if file.filesize}
												<p class="text-muted-foreground text-xs">
													{formatFileSize(file.filesize)}
												</p>
											{/if}
										</div>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>

						<Button onclick={handleSelectAllFiles} disabled={loading} class="w-full">
							{#if loading}
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
								Processing Files...
							{:else}
								Select All Files
							{/if}
						</Button>
					{:else}
						<p class="text-muted-foreground text-center text-sm">No files available</p>
					{/if}
				</div>
            {:else if step === 5}
                <div class="flex flex-col gap-4">
                    <Button variant="ghost" size="sm" onclick={() => (step = 1)} class="w-fit">
                        <ChevronLeft class="mr-1 h-4 w-4" />
                        Back
                    </Button>

                    <div class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 border rounded-md p-2">
                        <Label>Quality Constraints</Label>
                        <p class="text-xs text-muted-foreground mb-2">Configure constraints for the auto scrape process.</p>
                        
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
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div class="flex flex-col gap-2">
                                    <Label>Require</Label>
                                    <Input 
                                        placeholder="e.g. 4K, HDR (comma separated)"
                                        value={selectedOptions.require?.join(", ") || ""}
                                        oninput={(e) => {
                                            const val = e.currentTarget.value;
                                            selectedOptions.require = val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
                                        }}
                                    />
                                    <p class="text-[10px] text-muted-foreground">Must contain ANY of these terms</p>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label>Exclude</Label>
                                    <Input 
                                        placeholder="e.g. CAM, TS (comma separated)"
                                        value={selectedOptions.exclude?.join(", ") || ""}
                                        oninput={(e) => {
                                            const val = e.currentTarget.value;
                                            selectedOptions.exclude = val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
                                        }}
                                    />
                                    <p class="text-[10px] text-muted-foreground">Must NOT contain ANY of these terms</p>
                                </div>
                            </div>

                            <Accordion.Root type="multiple" class="w-full">
                                {#each Object.entries(rankingOptions) as [category, options] (category)}
                                    <Accordion.Item value={category}>
                                        <Accordion.Trigger class="capitalize text-sm py-2 hover:no-underline">
                                            <div class="flex items-center gap-2">
                                                {category}
                                                {#if categoryIcons[category]}
                                                    <svelte:component this={categoryIcons[category]} class="h-4 w-4" />
                                                {/if}
                                                {category === 'trash' ? 'Bin' : category}
                                                {#if selectedOptions[category]?.length}
                                                    <Badge variant="secondary" class="text-[10px] h-5 px-1.5">
                                                        {selectedOptions[category].length}
                                                    </Badge>
                                                {/if}
                                            </div>
                                        </Accordion.Trigger>
                                        <Accordion.Content>
                                            <div class="flex flex-wrap gap-2 pt-2">
                                                {#each options as option (option)}
                                                    {@const isSelected = selectedOptions[category]?.includes(option)}
                                                    <Badge 
                                                        variant={isSelected ? "default" : "outline"}
                                                        class="cursor-pointer hover:bg-primary/90 transition-colors"
                                                        onclick={() => {
                                                            if (isSelected) {
                                                                selectedOptions[category] = (selectedOptions[category] || []).filter(r => r !== option);
                                                            } else {
                                                                selectedOptions[category] = [...(selectedOptions[category] || []), option];
                                                            }
                                                        }}
                                                    >
                                                        {option.replace(/^r/, '')}
                                                    </Badge>
                                                {/each}
                                            </div>
                                        </Accordion.Content>
                                    </Accordion.Item>
                                {/each}
                            </Accordion.Root>
                        </div>

                    <Button onclick={handleAutoScrape} disabled={loading || !canStartAutoScrape} class="w-full">
                        {#if loading}
                            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                            Starting...
                        {:else}
                            <Zap class="mr-2 h-4 w-4" />
                            Start Auto Scrape
                        {/if}
                    </Button>
                </div>
<<<<<<< HEAD
			{:else if step === 1}
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label for="magnet">Magnet Link (Optional)</Label>
						<Input
							id="magnet"
							type="text"
							placeholder="magnet:?xt=urn:btih:..."
							bind:value={magnetLink}
							disabled={loading} />
						<p class="text-muted-foreground text-xs">
							Leave empty to fetch streams automatically
						</p>
					</div>

					<Button onclick={handleFetchStreams} disabled={loading} class="w-full">
						{#if loading}
							<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
							Fetching Streams...
						{:else}
							Fetch Streams
						{/if}
					</Button>

                    <div class="relative">
                        <div class="absolute inset-0 flex items-center">
                            <span class="w-full border-t" />
                        </div>
                        <div class="relative flex justify-center text-xs uppercase">
                            <span class="bg-background text-muted-foreground px-2">Or</span>
                        </div>
                    </div>

                    <Button variant="secondary" onclick={() => (autoScrapeMode = true)} disabled={loading} class="w-full">
                        <Zap class="mr-2 h-4 w-4" />
                        Auto Scrape
                    </Button>
				</div>
			{:else if step === 2}
				<div class="flex flex-col gap-3">
					{#if step > 1}
						<Button variant="ghost" size="sm" onclick={() => (step = 1)} class="w-fit">
							<ChevronLeft class="mr-1 h-4 w-4" />
							Back
						</Button>
					{/if}

					{#each streams as { magnet, stream } (magnet)}
						<Card.Root
							class="cursor-pointer transition-all hover:border-primary hover:shadow-md"
							onclick={() => handleSelectStream(magnet)}>
							<Card.Content class="px-4">
								<div class="flex flex-col gap-2">
									<div class="flex items-start justify-between gap-2">
										<p class="text-sm font-medium break-words flex-1 min-w-0">{stream.raw_title}</p>
										<Badge variant={stream.rank > 0 ? "default" : "destructive"} class="shrink-0">
											Rank: {stream.rank}
										</Badge>
									</div>

									<div class="flex flex-wrap gap-2">
										{#if stream.parsed_data.resolution}
											<Badge class={getResolutionColor(stream.parsed_data.resolution)}>
												{stream.parsed_data.resolution}
											</Badge>
										{/if}
										{#if stream.parsed_data.quality}
											<Badge variant="outline">{stream.parsed_data.quality}</Badge>
										{/if}
										{#if stream.parsed_data.hdr}
											{#each stream.parsed_data.hdr as hdr}
												<Badge variant="outline">{hdr}</Badge>
											{/each}
										{/if}
										{#if stream.parsed_data.codec}
											<Badge variant="outline">{stream.parsed_data.codec.toUpperCase()}</Badge>
										{/if}
										{#if stream.parsed_data.audio}
											{#each stream.parsed_data.audio as audio}
												<Badge variant="outline">{audio}</Badge>
											{/each}
										{/if}
										{#if stream.parsed_data.languages}
											{#each stream.parsed_data.languages as lang}
												<Badge variant="outline">{lang.toUpperCase()}</Badge>
											{/each}
										{/if}
										{#if stream.is_cached}
											<Badge class="bg-green-600">Cached</Badge>
										{/if}
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			{:else if step === 3}
				<div class="flex flex-col gap-3">
					{#if step > 1}
						<Button variant="ghost" size="sm" onclick={() => (step = 2)} class="w-fit">
							<ChevronLeft class="mr-1 h-4 w-4" />
							Back
						</Button>
					{/if}

					{#if sessionData?.containers?.files}
						<div class="mb-4 flex flex-col gap-3">
							{#each sessionData.containers.files as file (file.file_id)}
								<Card.Root>
									<Card.Content class="flex items-start gap-3 px-4">
										<FileIcon class="text-muted-foreground mt-1 h-5 w-5 shrink-0" />
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium break-words">{file.filename}</p>
											{#if file.filesize}
												<p class="text-muted-foreground text-xs">
													{formatFileSize(file.filesize)}
												</p>
											{/if}
										</div>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>

						<Button onclick={handleSelectAllFiles} disabled={loading} class="w-full">
							{#if loading}
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
								Processing Files...
							{:else}
								Select All Files
							{/if}
						</Button>
					{:else}
						<p class="text-muted-foreground text-center text-sm">No files available</p>
					{/if}
				</div>
=======
>>>>>>> 58cdf7a (UI: Improve manual scrape flow)
			{:else if step === 4}
				<div class="flex flex-col gap-3">
					{#if step > 1}
						<Button variant="ghost" size="sm" onclick={() => (step = 3)} class="w-fit">
							<ChevronLeft class="mr-1 h-4 w-4" />
							Back
						</Button>
					{/if}

					<div class="mb-4 flex flex-col gap-3">
						{#each selectedFilesMappings as mapping, idx (mapping.file_id)}
							<Card.Root>
								<Card.Content class="flex flex-col gap-3 px-4">
									<div class="flex items-start gap-3">
										<FileIcon class="text-muted-foreground mt-1 h-5 w-5 shrink-0" />
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium break-words">{mapping.filename}</p>
											<p class="text-muted-foreground text-xs">
												{formatFileSize(mapping.filesize)}
											</p>
										</div>
									</div>

									{#if mediaType === "tv"}
										<div class="flex gap-2">
											<div class="flex-1">
												<Label for={`season-${idx}`} class="text-xs">Season</Label>
												<Input
													id={`season-${idx}`}
													type="number"
													min="0"
													bind:value={mapping.season}
													placeholder="Season"
													class="mt-1" />
											</div>
											<div class="flex-1">
												<Label for={`episode-${idx}`} class="text-xs">Episode</Label>
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
							Complete
						{/if}
					</Button>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
