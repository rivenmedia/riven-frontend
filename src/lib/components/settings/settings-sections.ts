import Settings2 from "@lucide/svelte/icons/settings-2";
import Server from "@lucide/svelte/icons/server";
import Download from "@lucide/svelte/icons/download";
import ListPlus from "@lucide/svelte/icons/list-plus";
import Search from "@lucide/svelte/icons/search";
import Star from "@lucide/svelte/icons/star";
import Bell from "@lucide/svelte/icons/bell";
import Wrench from "@lucide/svelte/icons/wrench";
import type { Component } from "svelte";

export interface SectionGroup {
    id: string;
    title: string;
    keys: string[]; // Backend schema keys for this section
    icon: Component;
    description: string;
}

// Maps UI tabs to backend schema keys (used with /settings/schema/keys endpoint)
export const SECTION_GROUPS: SectionGroup[] = [
    {
        id: "general",
        title: "General",
        keys: [
            "api_key",
            "log_level",
            "enable_network_tracing",
            "enable_stream_tracing",
            "retry_interval",
            "tracemalloc",
            "database",
            "filesystem"
        ],
        icon: Settings2,
        description: "API key, logging, filesystem, and debug settings"
    },
    {
        id: "media_servers",
        title: "Media Servers",
        keys: ["updaters"],
        icon: Server,
        description: "Emby, Jellyfin, and Plex integration"
    },
    {
        id: "downloaders",
        title: "Downloaders",
        keys: ["downloaders"],
        icon: Download,
        description: "Debrid services and file settings"
    },
    {
        id: "content",
        title: "Content Sources",
        keys: ["content"],
        icon: ListPlus,
        description: "Overseerr, Plex Watchlist, MDBList, Listrr, Trakt"
    },
    {
        id: "scraping",
        title: "Scraping",
        keys: ["scraping"],
        icon: Search,
        description: "Scraper providers and behavior"
    },
    {
        id: "ranking",
        title: "Ranking",
        keys: ["ranking"],
        icon: Star,
        description: "Quality, resolution, HDR, audio, and language preferences"
    },
    {
        id: "notifications",
        title: "Notifications",
        keys: ["notifications"],
        icon: Bell,
        description: "Webhooks and notification settings"
    },
    {
        id: "advanced",
        title: "Advanced",
        keys: ["post_processing", "logging", "stream", "indexer"],
        icon: Wrench,
        description: "Post-processing, logging, and streaming"
    }
];

/**
 * Get a section group by its ID.
 */
export function getSectionGroupById(id: string): SectionGroup | undefined {
    return SECTION_GROUPS.find((s) => s.id === id);
}

export const DEFAULT_SECTION_ID = SECTION_GROUPS[0].id;
