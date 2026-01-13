import type { Schema } from "@sjsf/form";
import { resolveRef } from "./schema-utils";

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

export type NullableWidget = "nullableArrayWidget" | "nullablePrimitiveWidget";

export interface NullableFieldInfo {
    path: string[];
    widget: NullableWidget;
}

/**
 * Recursively find all nullable fields in a schema.
 * Returns paths and their widget assignments for automatic UI schema generation.
 */
export function findNullableFields(
    schema: Schema,
    path: string[] = [],
    rootSchema?: Schema
): NullableFieldInfo[] {
    const root = rootSchema ?? schema;
    const results: NullableFieldInfo[] = [];

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

    // Recurse into additionalProperties for dictionary-typed objects (e.g., library_profiles)
    // This allows auto-detection of nullable fields inside arbitrary-keyed objects
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
