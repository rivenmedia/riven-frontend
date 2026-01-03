import type { Schema } from "@sjsf/form";
import { resolveRef } from "./schema-utils";

/**
 * Schema pattern detection utilities.
 *
 * These functions detect common JSON Schema patterns (like nullable fields)
 * to enable automatic widget selection without manual configuration.
 */

/**
 * Determine whether a JSON Schema represents a nullable array.
 *
 * @returns `true` if `schema.anyOf` is an array of length 2 containing one subschema with `type: "array"` and one with `type: "null"`, `false` otherwise.
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
 * Determines whether the schema is a nullable primitive expressed as an `anyOf` containing one primitive type and `null`.
 *
 * @returns `true` if `schema.anyOf` contains one of `number`, `integer`, or `boolean` and a `null` type; `false` otherwise.
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
 * Locate nullable fields in a JSON Schema and record each field's path and the widget type to use.
 *
 * Traverses the schema recursively, resolving `$ref` against `rootSchema` when present. If a nullable
 * pattern is detected at a node, that node's path and widget are recorded and recursion stops for that branch.
 *
 * @param schema - The JSON Schema node to inspect
 * @param path - The current property path within the schema (used during recursion)
 * @param rootSchema - Root schema used to resolve `$ref` values; defaults to `schema` when omitted
 * @returns An array of NullableFieldInfo entries describing the paths and widget types for all detected nullable fields
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
 * Creates a nested UI schema that assigns nullable-field widgets at their schema paths.
 *
 * @param fields - List of nullable fields with their paths and widget identifiers
 * @returns A nested object mapping each field path to an object with `"ui:components": { anyOfField: <widget> }`
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
 * Place `value` at `path` inside `obj`, creating intermediate objects for missing keys.
 *
 * If `path` is empty the function does nothing. For the final path segment, if both
 * the existing value and `value` are plain objects (non-null), their enumerable
 * properties are shallow-merged; otherwise the final key is overwritten with `value`.
 *
 * @param obj - The root object to modify
 * @param path - An array of keys representing the nested path where the value should be set
 * @param value - The value to set at the specified path
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