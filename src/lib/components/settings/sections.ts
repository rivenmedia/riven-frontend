/**
 * Shared section metadata for the Settings page.
 * Used by both +page.server.ts and +page.svelte.
 *
 * Each tab groups one or more top-level schema keys.
 * Keys are passed to GET /api/v1/settings/schema/keys and GET/POST /api/v1/settings/get|set/{paths}.
 */
export type SectionTabId = string;

export interface SectionTab {
    id: SectionTabId;
    label: string;
    /** Top-level schema keys for this section (comma-separated for API paths) */
    keys: string[];
    /** Whether changes in this section require backend restart to take effect */
    restartRequired?: boolean;
}

/** Tab groupings: General, Filesystem, Downloaders, Content, Scraping, Infra */
export const SETTINGS_TABS: SectionTab[] = [
    {
        id: "general",
        label: "General",
        keys: [
            "version",
            "api_key",
            "log_level",
            "enable_network_tracing",
            "enable_stream_tracing",
            "retry_interval",
            "tracemalloc"
        ]
    },
    {
        id: "filesystem",
        label: "Filesystem",
        keys: ["filesystem"],
        restartRequired: true
    },
    {
        id: "updaters",
        label: "Library Updaters",
        keys: ["updaters"]
    },
    {
        id: "downloaders",
        label: "Downloaders",
        keys: ["downloaders"]
    },
    {
        id: "content",
        label: "Content",
        keys: ["content"]
    },
    {
        id: "scraping",
        label: "Scraping",
        keys: ["scraping", "ranking", "indexer"]
    },
    {
        id: "infra",
        label: "Infra",
        keys: ["database", "notifications", "post_processing", "logging", "stream"],
        restartRequired: true
    }
];

export const DEFAULT_TAB_ID: SectionTabId = SETTINGS_TABS[0].id;

export function getTabById(id: SectionTabId): SectionTab | undefined {
    return SETTINGS_TABS.find((t) => t.id === id);
}

/** Paths string for API: keys joined by comma */
export function getPathsForTab(tab: SectionTab): string {
    return tab.keys.join(",");
}
