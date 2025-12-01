import {
    startManualSession,
    parseTorrentTitles,
    manualSelect,
    manualUpdateAttributes,
    completeManualSession
} from "$lib/api";
import type { Container, Stream } from "$lib/api/types.gen";

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
    if (itemId) queryParams.item_id = itemId;
    else if (externalId) {
        if (mediaType === "movie") queryParams.tmdb_id = externalId;
        if (mediaType === "tv") queryParams.tvdb_id = externalId;
    }

    const sessionRes = await startManualSession({ query: queryParams });
    if (!sessionRes.data) {
        throw new Error(`Failed to start session for magnet: ${magnet}`);
    }
    const sId = sessionRes.data.session_id;
    const files = sessionRes.data.containers?.files || [];

    // 2. Parse Titles (to auto-select relevant files)
    const filenames = files.map(f => f.filename).filter((f): f is string => f != null);
    const parseRes = await parseTorrentTitles({ body: filenames });

    let fileMappings: FileMapping[] = [];
    if (parseRes.data) {
        fileMappings = files.map((file, idx) => {
            const parsedData = parseRes.data!.data[idx] as ParsedTitleData;
            return {
                file_id: file.file_id?.toString() || "",
                filename: file.filename || "",
                filesize: file.filesize || 0,
                season: parsedData?.seasons?.[0],
                episode: parsedData?.episodes?.[0]
            };
        });
    }

    // 3. Select Files (Auto-select based on logic)
    const container: Container = {};
    fileMappings.forEach(m => {
        container[m.file_id] = {
            file_id: parseInt(m.file_id),
            filename: m.filename,
            filesize: m.filesize
        };
    });

    await manualSelect({ path: { session_id: sId }, body: container });

    // 4. Update Attributes
    let updateBody: any;
    if (mediaType === "movie") {
        const largestFile = fileMappings.reduce((prev, current) =>
            current.filesize > prev.filesize ? current : prev
        );
        updateBody = {
            file_id: parseInt(largestFile.file_id),
            filename: largestFile.filename,
            filesize: largestFile.filesize
        };
    } else {
        updateBody = {};

        // Find the stream object to get torrent-level metadata
        const streamObj = streams.find(s => s.magnet === magnet)?.stream;
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
                    filesize: mapping.filesize
                };
                mappedCount++;
            }
        });

        if (mappedCount === 0) {
            console.warn(`Could not map any files for torrent: ${streamObj?.raw_title || magnet}`);
            // We still proceed to complete session, effectively skipping this torrent but closing the session
        }
    }

    await manualUpdateAttributes({ path: { session_id: sId }, body: updateBody });

    // 5. Complete Session
    await completeManualSession({ path: { session_id: sId } });
}
