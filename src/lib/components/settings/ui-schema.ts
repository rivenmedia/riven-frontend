import type { Schema, UiSchemaRoot } from "@sjsf/form";
import { getSchemaAtPath } from "./schema-utils";
import { findNullableFields } from "./schema-patterns";

/** Set a value at a nested path, creating intermediate objects as needed. */
function setAtPath(obj: Record<string, unknown>, path: string[], value: unknown): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
            current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
    }
    if (path.length > 0) {
        current[path[path.length - 1]] = value;
    }
}

/** Get or create a nested object at a path. */
function getOrCreateAtPath(obj: Record<string, unknown>, path: string[]): Record<string, unknown> {
    let current = obj;
    for (const key of path) {
        if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
            current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
    }
    return current;
}

/** Apply customRankWidget to all CustomRank objects in a category. */
function applyCustomRankWidgets(
    result: Record<string, unknown>,
    schema: Schema,
    categoryPath: string
): void {
    const categorySchema = getSchemaAtPath(schema, categoryPath);
    if (!categorySchema?.properties) return;

    const pathParts = categoryPath.split(".");
    const target = getOrCreateAtPath(result, pathParts);

    for (const itemKey of Object.keys(categorySchema.properties as Record<string, unknown>)) {
        target[itemKey] = {
            "ui:components": {
                objectField: "customRankWidget"
            }
        };
    }
}

/**
 * Build UI Schema from JSON Schema. Configures custom widgets for nullable fields
 * and CustomRank objects. Card styling is handled via CSS (.settings-form fieldset).
 */
export function buildSettingsUiSchema(schema: Schema): UiSchemaRoot {
    const props = schema.properties as Record<string, Schema> | undefined;
    if (!props) return {};

    const result: Record<string, unknown> = {
        // Hide the default submit button (we render our own)
        "ui:globalOptions": {
            shadcn4SubmitButton: { hidden: true }
        },
        // Hide the root schema title (we render our own header in settings-content.svelte)
        "ui:options": {
            hideTitle: true
        }
    };

    const has = (key: string) => key in props;

    // Auto-detect and apply nullable field widgets
    const nullableFields = findNullableFields(schema);
    for (const { path, widget } of nullableFields) {
        setAtPath(result, [...path, "ui:components"], { anyOfField: widget });
    }

    // Database host field - wider for connection strings
    if (has("database")) {
        setAtPath(result, ["database", "host", "ui:options"], {
            shadcn4Field: { style: "max-width: 100%;" }
        });
    }

    // Ranking section - custom rank widgets
    if (has("ranking")) {
        const customRanksSchema = getSchemaAtPath(schema, "ranking.custom_ranks");
        if (customRanksSchema?.properties) {
            for (const categoryKey of Object.keys(
                customRanksSchema.properties as Record<string, unknown>
            )) {
                applyCustomRankWidgets(result, schema, `ranking.custom_ranks.${categoryKey}`);
            }
        }
    }

    return result as UiSchemaRoot;
}
