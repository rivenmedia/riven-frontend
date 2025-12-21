import Settings2 from "@lucide/svelte/icons/settings-2";
import HardDrive from "@lucide/svelte/icons/hard-drive";
import Server from "@lucide/svelte/icons/server";
import Download from "@lucide/svelte/icons/download";
import ListPlus from "@lucide/svelte/icons/list-plus";
import Search from "@lucide/svelte/icons/search";
import Star from "@lucide/svelte/icons/star";
import Bell from "@lucide/svelte/icons/bell";
import Wrench from "@lucide/svelte/icons/wrench";
import type { Component } from "svelte";

export interface SettingsSection {
    id: string;
    label: string;
    icon: Component;
    paths: string[];
    description: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
    {
        id: "general",
        label: "General",
        icon: Settings2,
        paths: [
            "api_key",
            "log_level",
            "enable_network_tracing",
            "enable_stream_tracing",
            "retry_interval",
            "tracemalloc",
            "database"
        ],
        description: "API key, logging, and debug settings"
    },
    {
        id: "storage",
        label: "Storage",
        icon: HardDrive,
        paths: ["filesystem"],
        description: "Filesystem, cache, and naming templates"
    },
    {
        id: "media_servers",
        label: "Media Servers",
        icon: Server,
        paths: ["updaters"],
        description: "Emby, Jellyfin, and Plex integration"
    },
    {
        id: "downloaders",
        label: "Downloaders",
        icon: Download,
        paths: ["downloaders"],
        description: "Debrid services and file settings"
    },
    {
        id: "content",
        label: "Content Sources",
        icon: ListPlus,
        paths: ["content"],
        description: "Overseerr, Plex Watchlist, MDBList, Listrr, Trakt"
    },
    {
        id: "scraping",
        label: "Scraping",
        icon: Search,
        paths: ["scraping"],
        description: "Scraper providers and behavior"
    },
    {
        id: "ranking",
        label: "Ranking",
        icon: Star,
        paths: ["ranking"],
        description: "Quality, resolution, HDR, audio, and language preferences"
    },
    {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        paths: ["notifications"],
        description: "Webhooks and notification settings"
    },
    {
        id: "advanced",
        label: "Advanced",
        icon: Wrench,
        paths: ["post_processing", "logging", "stream", "indexer"],
        description: "Post-processing, logging, and streaming"
    }
];
