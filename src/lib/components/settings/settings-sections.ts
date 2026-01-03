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

/** Section ID for the general/root-level settings section */
export const GENERAL_SECTION_ID = "general";

/**
 * Settings section definition.
 * Services are discovered dynamically from the schema - any object property
 * with an "enabled" field is considered a toggleable service.
 */
export interface SettingsSection {
    id: string;
    label: string;
    icon: Component;
    /** Schema path(s) this section manages */
    paths: string[];
    description: string;
    /** Schema path to discover services from (objects with "enabled" field) */
    servicesPath?: string;
    /** Label shown above the services list (e.g., "Debrid Services") */
    servicesLabel?: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
    {
        id: GENERAL_SECTION_ID,
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
        description: "Emby, Jellyfin, and Plex integration",
        servicesPath: "updaters",
        servicesLabel: "Media Servers"
    },
    {
        id: "downloaders",
        label: "Downloaders",
        icon: Download,
        paths: ["downloaders"],
        description: "Debrid services and file settings",
        servicesPath: "downloaders",
        servicesLabel: "Debrid Services"
    },
    {
        id: "content",
        label: "Content Sources",
        icon: ListPlus,
        paths: ["content"],
        description: "Overseerr, Plex Watchlist, MDBList, Listrr, Trakt",
        servicesPath: "content",
        servicesLabel: "Content Sources"
    },
    {
        id: "scraping",
        label: "Scraping",
        icon: Search,
        paths: ["scraping"],
        description: "Scraper providers and behavior",
        servicesPath: "scraping",
        servicesLabel: "Scraper Providers"
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

/** Pre-built map for O(1) section lookups by ID */
const SETTINGS_SECTION_MAP = new Map<string, SettingsSection>(
    SETTINGS_SECTIONS.map((s) => [s.id, s])
);

/**
 * Retrieve a settings section by its identifier.
 *
 * @returns The matching `SettingsSection`, or `undefined` if no section exists for the given id.
 */
export function getSectionById(id: string): SettingsSection | undefined {
    return SETTINGS_SECTION_MAP.get(id);
}