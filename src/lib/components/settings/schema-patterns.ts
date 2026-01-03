import type { Schema } from "@sjsf/form";
import { resolveRef } from "./schema-utils";

/**
 * Schema pattern detection utilities.
 *
 * These functions detect common JSON Schema patterns (like nullable fields)
 * to enable automatic widget selection without manual configuration.
 */

/**
 * Check if schema represents a nullable array: anyOf: [array, null]
 */
export function isNullableArraySchema(schema: Schema): boolean {
    const anyOf = schema.anyOf;
    if (!anyOf || !Array.isArray(anyOf) || anyOf.length !== 2) return false;

    return (
        anyOf.some((s) => (s as Schema).type === "array") &&
        anyOf.some((s) => (s as Schema).type === "null")
    );
}

/**
 * Check if schema represents a nullable primitive: anyOf: [number|integer|boolean, null]
 */
export function isNullablePrimitiveSchema(schema: Schema): boolean {
    const anyOf = schema.anyOf;
    if (!anyOf || !Array.isArray(anyOf) || anyOf.length !== 2) return false;

    const primitiveTypes = ["number", "integer", "boolean"];
    return (
        anyOf.some((s) => primitiveTypes.includes((s as Schema).type as string)) &&
        anyOf.some((s) => (s as Schema).type === "null")
    );
}

/**
 * Result of finding nullable fields in a schema.
 */
export interface NullableFieldInfo {
    path: string[];
    widget: "nullableArrayWidget" | "nullablePrimitiveWidget";
}

/**
 * Recursively walk a JSON Schema and find all nullable fields.
 * Returns paths and their appropriate widget assignments.
 *
 * This enables automatic widget detection without listing every field in UI schema.
 *
 * @param schema - The JSON Schema to walk
 * @param path - Current path in the schema (for recursion)
 * @param rootSchema - The root schema for resolving $ref (defaults to schema)
 */
export function findNullableFields(
    schema: Schema,
    path: string[] = [],
    rootSchema?: Schema
): NullableFieldInfo[] {
    const root = rootSchema ?? schema;
    const results: NullableFieldInfo[] = [];

    // Resolve $ref if present, falling back to original schema if resolution fails
    const ref = schema.$ref as string | undefined;
    const resolvedSchema = ref ? (resolveRef(root, ref) ?? schema) : schema;

    // Check if this schema itself is nullable
    if (isNullableArraySchema(resolvedSchema)) {
        results.push({ path, widget: "nullableArrayWidget" });
        return results; // Don't recurse into nullable fields
    }
    if (isNullablePrimitiveSchema(resolvedSchema)) {
        results.push({ path, widget: "nullablePrimitiveWidget" });
        return results;
    }

    // Recurse into object properties
    if (resolvedSchema.properties) {
        for (const [key, propSchema] of Object.entries(resolvedSchema.properties)) {
            results.push(...findNullableFields(propSchema as Schema, [...path, key], root));
        }
    }

    // Recurse into additionalProperties (for dictionary-like objects)
    if (
        resolvedSchema.additionalProperties &&
        typeof resolvedSchema.additionalProperties === "object"
    ) {
        results.push(
            ...findNullableFields(
                resolvedSchema.additionalProperties as Schema,
                [...path, "additionalProperties"],
                root
            )
        );
    }

    return results;
}

/**
 * Build a nested object structure from a list of nullable fields.
 * Used to generate UI schema widget assignments.
 *
 * @param fields - Array of nullable field info from findNullableFields
 * @returns Nested object with ui:components assignments
 */
export function buildNullableWidgetUiSchema(fields: NullableFieldInfo[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const { path, widget } of fields) {
        setNestedValue(result, path, {
            "ui:components": { anyOfField: widget }
        });
    }

    return result;
}

/**
 * Set a value at a nested path in an object, creating intermediate objects as needed.
 */
function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
    if (path.length === 0) return;

    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!(key in current) || typeof current[key] !== "object") {
            current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
    }

    const lastKey = path[path.length - 1];

    // Merge with existing value if both are objects
    if (
        typeof current[lastKey] === "object" &&
        current[lastKey] !== null &&
        typeof value === "object" &&
        value !== null
    ) {
        current[lastKey] = {
            ...(current[lastKey] as Record<string, unknown>),
            ...(value as Record<string, unknown>)
        };
    } else {
        current[lastKey] = value;
    }
}
