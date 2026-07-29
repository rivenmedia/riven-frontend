export type QualityProfile = {
    id: string;
    label: string;
    description: string;
    settings: Record<string, unknown>;
};

export type CustomProfile = {
    id: number;
    name: string;
    settings: Record<string, unknown>;
    is_builtin: boolean;
    enabled: boolean;
    created_at: string;
    updated_at: string;
};

export type SettingFieldDef = {
    key: string;
    label: string;
    type: string;
    required: boolean;
    default_value?: string;
    placeholder?: string;
    description?: string;
    options?: string[];
    allow_custom_options?: boolean;
    fields?: SettingFieldDef[];
    item_fields?: SettingFieldDef[];
    key_placeholder?: string;
    add_label?: string;
    section?: string;
    /** Layout hint for `object` fields: "grid" | "tabs". Absent = stacked. */
    display?: string;
    true_label?: string;
    false_label?: string;
};

/**
 * One configurable settings surface, mirroring the GraphQL `SettingsSection`:
 * the instance-wide "general" settings or a single plugin. The frontend renders
 * `schema` + `values` generically; plugin-only fields are null for "general".
 */
export type SettingsSection = {
    id: string;
    title: string;
    kind: "general" | "plugin" | string;
    schema: SettingFieldDef[];
    values: Record<string, unknown>;
    category?: string | null;
    enabled?: boolean | null;
    valid?: boolean | null;
    configured?: boolean | null;
    missingRequiredFields: string[];
    version?: string | null;
};

/** Backend-owned setup section that plugins are grouped under (by `SettingsSection.category`). */
export type SetupGroup = {
    id: string;
    title: string;
    description: string;
};

/** Backend-owned setup readiness, mirrors the GraphQL `instanceStatus`. */
export type InstanceStatus = {
    setupCompleted: boolean;
    readyToComplete: boolean;
    enabledValidPluginCount: number;
    enabledProfileCount: number;
    blockers: string[];
};

export type SetupData = {
    sections: SettingsSection[];
    rankSettings: Record<string, unknown>;
    rankSettingsSchema: SettingFieldDef[];
    qualityProfiles: QualityProfile[];
    customProfiles: CustomProfile[];
    setupGroups: SetupGroup[];
    instanceStatus: InstanceStatus;
};

export type Step = {
    id: string;
    label: string;
    description: string;
};

export type PluginGroup = {
    id: string;
    title: string;
    description: string;
    emptyMessage?: string;
};

export type SetupPluginCardView = {
    section: SettingsSection;
    badge: { label: string; variant: "default" | "secondary" };
    saving: boolean;
};

export type SetupPluginSection = PluginGroup & {
    plugins: SetupPluginCardView[];
};

export type SetupGeneralSection = {
    title: string;
    description: string;
    fields: SettingFieldDef[];
};

export type SetupProfileView = QualityProfile & {
    enabled: boolean;
};
