import type { Schema, UiSchemaRoot, UiSchemaDefinition } from "@sjsf/form";
import { getSchemaAtPath } from "./schema-utils";

/**
 * Field group definition for organizing global fields in UI.
 * Used by section components to render fields in logical groups.
 */
export interface FieldGroup {
    id: string;
    /** Fields in this group - titles/descriptions come from schema */
    fields: string[];
    /** Force single-column layout regardless of field count */
    layout?: "stack" | "grid";
}

/**
 * UI Schema section configuration.
 * Defines field groups for a schema section (e.g., "scraping", "downloaders").
 */
export interface SectionUiConfig {
    groups: FieldGroup[];
}

/**
 * Field grouping configuration for settings sections.
 * This is UI presentation metadata - it defines how global fields
 * should be grouped visually within each section.
 *
 * Note: This is intentionally separate from the JSON Schema because
 * grouping is a UI concern, not a data structure concern.
 * Titles and descriptions come from the schema, not hardcoded here.
 */
export const SECTION_FIELD_GROUPS: Record<string, SectionUiConfig> = {
    // Root-level fields (general section) - use empty sectionPath
    "": {
        groups: [
            {
                id: "backend",
                fields: ["api_key", "database"]
            },
            {
                id: "behavior",
                fields: ["retry_interval"]
            },
            {
                id: "log_level",
                fields: ["log_level"]
            },
            {
                id: "debug",
                layout: "stack",
                fields: ["enable_network_tracing", "enable_stream_tracing", "tracemalloc"]
            }
        ]
    },
    updaters: {
        groups: [
            {
                id: "library_sync",
                fields: ["library_path", "updater_interval"]
            }
        ]
    },
    scraping: {
        groups: [
            {
                id: "retry_delays",
                fields: ["after_2", "after_5", "after_10", "max_failed_attempts"]
            },
            {
                id: "matching",
                fields: ["bucket_limit", "enable_aliases", "dubbed_anime_only"]
            }
        ]
    },
    downloaders: {
        groups: [
            {
                id: "movie_filesize",
                fields: ["movie_filesize_mb_min", "movie_filesize_mb_max"]
            },
            {
                id: "episode_filesize",
                fields: ["episode_filesize_mb_min", "episode_filesize_mb_max"]
            },
            {
                id: "other",
                fields: ["video_extensions", "proxy_url"]
            }
        ]
    }
};

/**
 * Retrieve UI field groups for a settings section, filtered to include only fields present in the section's schema.
 *
 * @param schema - The root JSON schema
 * @param sectionPath - Path to the section (e.g., "scraping") or empty string for root-level fields
 * @returns An array of FieldGroup objects whose `fields` are restricted to keys present in the resolved section schema; groups with no remaining fields are omitted
 */
export function getFieldGroupsForSection(schema: Schema, sectionPath: string): FieldGroup[] {
    const config = SECTION_FIELD_GROUPS[sectionPath];
    if (!config) return [];

    // Get the section schema to validate fields exist
    // For root-level fields (empty sectionPath), use the root schema directly
    const sectionSchema = sectionPath ? getSchemaAtPath(schema, sectionPath) : schema;
    if (!sectionSchema?.properties) return [];

    const availableFields = new Set(
        Object.keys(sectionSchema.properties as Record<string, unknown>)
    );

    // Filter groups and their fields to only include what exists in schema
    return config.groups
        .map((group) => ({
            ...group,
            fields: group.fields.filter((field) => availableFields.has(field))
        }))
        .filter((group) => group.fields.length > 0);
}

/**
 * Creates UI schema entries that assign the customRankWidget to each CustomRank field in the specified category.
 *
 * @param schema - Root JSON Schema
 * @param categoryPath - Path to the category within the schema (e.g., "ranking.custom_ranks.<category>")
 * @returns An object mapping each field name to a UI schema entry that sets `ui:components.objectField` to `"customRankWidget"`
 */
function buildCustomRankUiSchema(schema: Schema, categoryPath: string): Record<string, unknown> {
    const categorySchema = getSchemaAtPath(schema, categoryPath);
    if (!categorySchema?.properties) return {};

    const result: Record<string, unknown> = {};
    for (const itemKey of Object.keys(categorySchema.properties as Record<string, unknown>)) {
        result[itemKey] = {
            "ui:components": {
                objectField: "customRankWidget"
            }
        };
    }
    return result;
}

/**
 * Constructs a UI schema with layout hints and widget overrides for application settings.
 *
 * Applies per-section `ui:options` (for example, hiding wrapper titles) and assigns custom
 * widgets where needed (for example, nullable array/primitive widgets and the custom rank widget).
 *
 * @param schema - The JSON Schema from the backend used to determine available sections and fields
 * @returns A UiSchemaRoot containing per-section UI options and `ui:components` mappings
 */
export function buildSettingsUiSchema(schema: Schema): UiSchemaRoot {
    // Build UI schema for CustomRank objects in each category
    const customRanksSchema = getSchemaAtPath(schema, "ranking.custom_ranks");
    const customRanksUiSchema: Record<string, unknown> = {};

    if (customRanksSchema?.properties) {
        for (const categoryKey of Object.keys(
            customRanksSchema.properties as Record<string, unknown>
        )) {
            customRanksUiSchema[categoryKey] = {
                // Hide category title since we render our own headers in ranking-section
                "ui:options": {
                    hideTitle: true
                },
                ...buildCustomRankUiSchema(schema, `ranking.custom_ranks.${categoryKey}`)
            };
        }
    }

    return {
        // Hide wrapper object titles where we use Card headers instead
        database: {
            "ui:options": {
                hideTitle: true
            }
        },
        // Filesystem - hide verbose model titles throughout nested structure
        filesystem: {
            "ui:options": {
                hideTitle: true
            },
            library_profiles: {
                // additionalProperties objects (dictionary of LibraryProfile)
                additionalProperties: {
                    "ui:options": {
                        hideTitle: true
                    },
                    filter_rules: {
                        "ui:options": {
                            hideTitle: true
                        },
                        // These fields use anyOf: [array, null] pattern
                        // Use custom widget for better UX (switch + array input)
                        content_types: {
                            "ui:components": { anyOfField: "nullableArrayWidget" }
                        },
                        genres: {
                            "ui:components": { anyOfField: "nullableArrayWidget" }
                        },
                        networks: {
                            "ui:components": { anyOfField: "nullableArrayWidget" }
                        },
                        countries: {
                            "ui:components": { anyOfField: "nullableArrayWidget" }
                        },
                        languages: {
                            "ui:components": { anyOfField: "nullableArrayWidget" }
                        },
                        content_ratings: {
                            "ui:components": { anyOfField: "nullableArrayWidget" }
                        },
                        exclude_genres: {
                            "ui:components": { anyOfField: "nullableArrayWidget" }
                        },
                        // Non-array anyOf fields - use custom widget for consistent UX
                        min_year: {
                            "ui:components": { anyOfField: "nullablePrimitiveWidget" }
                        },
                        max_year: {
                            "ui:components": { anyOfField: "nullablePrimitiveWidget" }
                        },
                        min_rating: {
                            "ui:components": { anyOfField: "nullablePrimitiveWidget" }
                        },
                        max_rating: {
                            "ui:components": { anyOfField: "nullablePrimitiveWidget" }
                        },
                        is_anime: {
                            "ui:components": { anyOfField: "nullablePrimitiveWidget" }
                        }
                    }
                }
            }
        } as UiSchemaDefinition,
        // Configure ranking section
        ranking: {
            // Hide the ranking object's own title/description since we use Card headers
            "ui:options": {
                hideTitle: true
            },
            // Resolutions - hide since we render inside a Card with our own header
            resolutions: {
                "ui:options": {
                    hideTitle: true
                }
            },
            // Options - hide object wrapper title
            options: {
                "ui:options": {
                    hideTitle: true
                }
            },
            // Languages object - hide wrapper title
            languages: {
                "ui:options": {
                    hideTitle: true
                }
            },
            // Configure CustomRank objects to use the custom widget
            custom_ranks: {
                "ui:options": {
                    hideTitle: true
                },
                ...customRanksUiSchema
            }
        },
        // Notifications - hide model title
        notifications: {
            "ui:options": {
                hideTitle: true
            }
        }
    };
}