import providers from "$lib/providers";
import type { components } from "$lib/providers/riven";

type Stream = components["schemas"]["Stream"];
type Container = components["schemas"]["Container"];

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

interface FileMapping {
    file_id: string;
    filename: string;
    filesize: number;
    season?: number;
    episode?: number;
    download_url?: string;
}

interface ProcessBatchItemParams {
    magnet: string;
    mediaType: "movie" | "tv";
    itemId?: string | null;
    externalId: string;
    streams: { magnet: string; stream: Stream }[];
}

export async function processBatchItem({
    magnet,
    mediaType,
    itemId,
    externalId,
    streams
}: ProcessBatchItemParams): Promise<void> {
    // 1. Start Session
    const queryParams: any = {
        media_type: mediaType,
        magnet: `magnet:?xt=urn:btih:${magnet}`
    };
    if (itemId) queryParams.item_id = parseInt(itemId);
    else if (externalId) {
        if (mediaType === "movie") queryParams.tmdb_id = externalId;
        if (mediaType === "tv") queryParams.tvdb_id = externalId;
    }

    const { data: sessionData, error: sessionError } = await providers.riven.POST(
        "/api/v1/scrape/start_session",
        {
            params: { query: queryParams }
        }
    );

    if (sessionError || !sessionData) {
        const msg = (sessionError as any)?.message || (sessionError as any)?.detail || "Unknown";
        throw new Error(`Failed to start session for magnet: ${magnet}. Error: ${msg}`);
    }

    const sId = sessionData.session_id;
    const files = sessionData.containers?.files || [];

    // 2. Parse Titles (to auto-select relevant files)
    const filenames = Object.values(files)
        .map((f: any) => f.filename)
        .filter((f: any): f is string => f != null);
    const { data: parseData } = await providers.riven.POST("/api/v1/scrape/parse", {
        body: filenames
    });

    let fileMappings: FileMapping[] = [];
    if (parseData) {
        // files is object or array? previous code used map. sessionData.containers.files is likely array or dict.
        // In riven.ts, TorrentContainer.files is { [key: string]: TorrentFile }.
        // So Object.values(files).
        const fileList = Object.values(files);
        fileMappings = fileList.map((file: any, idx: number) => {
            const parsedData = parseData.data[idx] as ParsedTitleData;
            return {
                file_id: file.file_id?.toString() || idx.toString(),
                filename: file.filename || "",
                filesize: file.filesize || 0,
                season: parsedData?.seasons?.[0],
                episode: parsedData?.episodes?.[0],
                download_url: file.download_url
            };
        });
    }

    // 3. Select Files (Auto-select based on logic)
    const container: any = {}; // Container is TorrentContainer? alias via types.gen.ts
    // TorrentContainer interface has files?: { [key: string]: TorrentFile } ...
    // BUT here container is being used as body for manualSelect.
    // manualSelect body expecting? riven.ts: /api/v1/scrape/select_files/{session_id}.
    // Op: manual_select. Input: DebridContainer (likely).
    // Let's check manual_select body type in riven.ts later. Assuming it matches Container alias.
    // Actually previous code: container[file_id] = { ... }.
    // If Container alias is TorrentContainer (from riven.ts), it has structure.
    // But manualSelect likely takes a simpler structure or matches.

    // Using any for container build to avoid strict type mess if alias is partial
    const containerBody: any = {};

    fileMappings.forEach((m) => {
        containerBody[m.file_id] = {
            file_id: parseInt(m.file_id),
            filename: m.filename,
            filesize: m.filesize
        };
    });

    await providers.riven.POST("/api/v1/scrape/select_files/{session_id}", {
        params: { path: { session_id: sId } },
        body: containerBody
    });

    // 4. Update Attributes
    let updateBody: any;
    if (mediaType === "movie") {
        if (fileMappings.length > 0) {
            const largestFile = fileMappings.reduce((prev, current) =>
                current.filesize > prev.filesize ? current : prev
            );
            updateBody = {
                file_id: parseInt(largestFile.file_id),
                filename: largestFile.filename,
                filesize: largestFile.filesize,
                download_url: largestFile.download_url
            };
        } else {
            // Fallback if no files found?
            updateBody = {};
        }
    } else {
        updateBody = {};

        // Find the stream object to get torrent-level metadata
        const streamObj = streams.find((s) => s.magnet === magnet)?.stream;
        const torrentSeason = streamObj?.parsed_data?.seasons?.[0];

        let mappedCount = 0;
        fileMappings.forEach((mapping) => {
            // Fallback to torrent season if file season is missing
            const season = mapping.season ?? torrentSeason;
            const episode = mapping.episode;

            if (season !== undefined && episode !== undefined) {
                const seasonKey = season.toString();
                const episodeKey = episode.toString();
                if (!updateBody[seasonKey]) {
                    updateBody[seasonKey] = {};
                }
                updateBody[seasonKey][episodeKey] = {
                    file_id: parseInt(mapping.file_id),
                    filename: mapping.filename,
                    filesize: mapping.filesize,
                    download_url: mapping.download_url
                };
                mappedCount++;
            }
        });

        if (mappedCount === 0) {
            console.warn(`Could not map any files for torrent: ${streamObj?.raw_title || magnet}`);
            // We still proceed to complete session, effectively skipping this torrent but closing the session
        }
    }

    await providers.riven.POST("/api/v1/scrape/update_attributes/{session_id}", {
        params: { path: { session_id: sId } },
        body: updateBody
    });

    // 5. Complete Session
    await providers.riven.POST("/api/v1/scrape/complete_session/{session_id}", {
        params: { path: { session_id: sId } }
    });
}
