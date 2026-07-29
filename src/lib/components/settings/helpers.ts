import type {
    CustomProfile,
    SettingFieldDef,
    SettingsSection,
    SetupData,
    SetupGeneralSection,
    SetupGroup,
    SetupPluginCardView,
    SetupPluginSection,
    Step
} from "./types";

export function pluginStatus(section: { enabled?: boolean | null; valid?: boolean | null }): {
    label: string;
    variant: "default" | "secondary";
} {
    if (!section.enabled) return { label: "Inactive", variant: "secondary" };
    if (section.valid) return { label: "Active", variant: "default" };
    return { label: "Invalid", variant: "secondary" };
}

export const settingsSwitchClass =
    "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80 [&_[data-slot=switch-thumb]]:translate-x-0 [&_[data-state=checked][data-slot=switch-thumb]]:translate-x-[calc(100%-2px)] rtl:[&_[data-state=checked][data-slot=switch-thumb]]:-translate-x-[calc(100%-2px)] dark:[&_[data-state=unchecked][data-slot=switch-thumb]]:bg-foreground dark:[&_[data-state=checked][data-slot=switch-thumb]]:bg-primary-foreground";

export function toLabel(key: string): string {
    return key
        .replace(/^r(\d+p)$/, "$1")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Presentational chrome for the non-plugin setup steps; the plugin-group steps
// are driven entirely by the backend `setupGroups` query.
const setupStepMeta = {
    welcome: {
        label: "Welcome",
        description: "Quick overview before you connect providers."
    },
    quality: {
        label: "Quality",
        description: "Choose profiles and instance defaults."
    },
    finish: {
        label: "Review",
        description: "Check readiness and finish setup."
    }
} satisfies Record<"welcome" | "quality" | "finish", Omit<Step, "id">>;

type SetupState = {
    general: SettingsSection | null;
    plugins: SettingsSection[];
    customProfiles: CustomProfile[];
};

/** Split the backend sections into the general section + plugin sections, deep-copying values for local editing. */
export function createSetupState(data: SetupData): SetupState {
    const sections = (data.sections ?? []).map((section) => ({
        ...section,
        values: { ...(section.values as Record<string, unknown>) }
    }));
    return {
        general: sections.find((section) => section.kind === "general") ?? null,
        plugins: sections.filter((section) => section.kind === "plugin"),
        customProfiles: (data.customProfiles ?? []).map((profile) => ({ ...profile }))
    };
}

/**
 * Group plugin sections into setup sections using the backend `setupGroups`
 * (order + labels) and each section's own `category`. Sections whose category
 * isn't a known group fall into a trailing "Other" group.
 */
export function buildPluginSections(
    plugins: SettingsSection[],
    savingMap: Record<string, boolean>,
    groups: SetupGroup[]
): SetupPluginSection[] {
    const cardFor = (section: SettingsSection): SetupPluginCardView => ({
        section,
        badge: pluginStatus(section),
        saving: savingMap[section.id] ?? false
    });

    const knownIds = new Set(groups.map((group) => group.id));
    const byCategory = new Map<string, SetupPluginCardView[]>();
    for (const section of plugins) {
        const category =
            section.category && knownIds.has(section.category) ? section.category : "other";
        const bucket = byCategory.get(category) ?? [];
        bucket.push(cardFor(section));
        byCategory.set(category, bucket);
    }

    const byName = (a: SetupPluginCardView, b: SetupPluginCardView) =>
        a.section.id.localeCompare(b.section.id);

    const sections: SetupPluginSection[] = groups.map((group) => ({
        ...group,
        plugins: (byCategory.get(group.id) ?? []).sort(byName)
    }));

    const leftovers = byCategory.get("other") ?? [];
    if (leftovers.length > 0) {
        sections.push({
            id: "other",
            title: "Other",
            description: "Additional plugins.",
            plugins: leftovers.sort(byName)
        });
    }

    return sections.filter((section) => section.plugins.length > 0);
}

/** Group general-settings fields by their backend-provided `section` label. */
export function buildGeneralSections(schema: SettingFieldDef[]): SetupGeneralSection[] {
    const sections = new Map<string, SetupGeneralSection>();

    for (const field of schema) {
        const title = field.section ?? "General";
        const existing = sections.get(title);

        if (existing) {
            existing.fields.push(field);
            continue;
        }

        sections.set(title, { title, description: "", fields: [field] });
    }

    return [...sections.values()];
}

export function buildSetupSteps(pluginSections: SetupPluginSection[]): Step[] {
    return [
        { id: "welcome", ...setupStepMeta.welcome },
        ...pluginSections.map((section) => ({
            id: section.id,
            label: section.title,
            description: section.description
        })),
        { id: "quality", ...setupStepMeta.quality },
        { id: "finish", ...setupStepMeta.finish }
    ];
}
